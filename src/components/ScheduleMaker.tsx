import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generatePlans } from "@/lib/scheduler";
import type { Course, Plan, ArchivedPlan } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { HelpTooltip } from "./ui/HelpTooltip";

// Refactored Components
import { ScheduleConfig } from "./maker/ScheduleConfig";
import { ScheduleSelector } from "./maker/ScheduleSelector";
import { ScheduleViewer } from "./maker/ScheduleViewer";
import { ScheduleArchive } from "./maker/ScheduleArchive";
import { SmartGenerateDialog } from "./maker/SmartGenerateDialog";
import { MasterCatalogDialog } from "./maker/MasterCatalogDialog";
import { ShareDialog } from "./maker/ShareDialog";

interface ScheduleMakerProps {
  externalStep?: "config" | "select" | "view" | "archive";
  onStepChange?: (step: "config" | "select" | "view" | "archive") => void;
  userData?: {
    _id: string;
    credits: number;
    isAdmin: boolean;
    lastSmartGenerateTime?: number;
    planLimit?: number;
  };
}

export function ScheduleMaker({
  externalStep,
  onStepChange,
  userData,
}: ScheduleMakerProps) {
  const { t } = useLanguage();
  const [internalStep, setInternalStep] = useState<
    "config" | "select" | "view" | "archive"
  >("config");

  const step = externalStep || internalStep;
  const setStep = onStepChange || setInternalStep;
  const [sessionProfile, setSessionProfile] = useState<{
    university: string;
    prodi: string;
    semester: number;
    maxSks: number;
    useMaster: boolean;
  }>({
    university: "UPN_VETERAN_YOGYAKARTA",
    prodi: "INFORMATIKA",
    semester: 2,
    maxSks: 24,
    useMaster: true,
  });

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [lockedCourses, setLockedCourses] = useState<Record<string, string[]>>(
    {},
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
  const [viewSource, setViewSource] = useState<"live" | "archive">("live");
  const [isMasterSearchOpen, setIsMasterSearchOpen] = useState(false);
  const [isSmartDialogOpen, setIsSmartDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeSharePlanName, setActiveSharePlanName] = useState("");

  const [planLimit, setPlanLimit] = useState(userData?.planLimit || 12);

  // Sync planLimit if userData changes
  useEffect(() => {
    if (userData?.planLimit && userData.planLimit !== planLimit) {
      setPlanLimit(userData.planLimit);
    }
  }, [userData?.planLimit]);

  // Convex Queries
  const allMasterCourses = useQuery(api.admin.listMasterCourses, {
    prodi: sessionProfile.prodi,
  });
  const curriculum = useQuery(api.admin.listCurriculum, {
    prodi: sessionProfile.prodi,
    semester: sessionProfile.semester,
  });

  // Plan Archive Queries/Mutations
  const archived = useQuery(api.plans.listPlans) as ArchivedPlan[] | undefined;
  const savePlanMutation = useMutation(api.plans.savePlan);
  const deletePlanMutation = useMutation(api.plans.deletePlan);
  const createShareLinkMutation = useMutation(api.plans.createShareLink);
  const consumeTokenMutation = useMutation(api.users.generateServiceToken);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handlers
  const handleSavePlan = async (plan: Plan) => {
    if (archived && archived.length >= 30) {
      toast.error(
        "Storage full (30/30). Please delete old plans in Archive to save new ones.",
      );
      return;
    }
    setIsSaving(true);
    try {
      await savePlanMutation({
        name: plan.name,
        data: JSON.stringify(plan),
      });
      toast.success("Plan archived successfully!");
    } catch (err: any) {
      toast.error("Failed to archive plan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteArchived = async (planId: string) => {
    try {
      await deletePlanMutation({ planId: planId as any });
      toast.success("Plan removed from archive.");
    } catch (err: any) {
      toast.error("Failed to delete plan: " + err.message);
    }
  };

  const handleImportArchived = (allPlans: Plan[], index: number) => {
    setPlans(allPlans);
    setCurrentPlanIndex(index);
    setViewSource("archive");
    setStep("view");
    toast.info(`Imported ${allPlans.length} plans to grid viewer.`);
  };

  const [isSmartGenerating, setIsSmartGenerating] = useState(false);
  const renamePlanMutation = useMutation(api.plans.renamePlan);

  const getCooldownStatus = () => {
    if (!userData?.lastSmartGenerateTime) return { active: false, seconds: 0 };
    const diff = Date.now() - userData.lastSmartGenerateTime;
    const cooldownMs = 30000;
    if (diff < cooldownMs) {
      return { active: true, seconds: Math.ceil((cooldownMs - diff) / 1000) };
    }
    return { active: false, seconds: 0 };
  };

  const cooldown = getCooldownStatus();

  const handleRenameArchived = async (planId: string, newName: string) => {
    try {
      await renamePlanMutation({ planId: planId as any, newName });
      toast.success("Plan renamed successfully!");
    } catch (err: any) {
      toast.error("Failed to rename plan: " + err.message);
    }
  };

  const handleSharePlan = async (planId: string) => {
    const plan = archived?.find((p) => (p as any)._id === planId);
    if (!plan) return;

    setActiveSharePlanName(plan.name);

    if ((plan as any).shareId) {
      setActiveShareId((plan as any).shareId);
      setIsShareDialogOpen(true);
      return;
    }

    toast.promise(createShareLinkMutation({ planId: planId as any }), {
      loading: "Generating share link...",
      success: (id) => {
        setActiveShareId(id);
        setIsShareDialogOpen(true);
        return "Link generated!";
      },
      error: "Failed to generate link",
    });
  };

  const smartGenerateAction = useAction(api.ai.smartGenerate);

  const onInitSmartGenerate = () => {
    if (!userData || userData.credits <= 0) {
      toast.error("You need 1 token for Smart Generate");
      return;
    }

    // Quick check: if in cooldown, tell user immediately
    if (cooldown.active) {
      toast.error(
        `Please wait ${cooldown.seconds} seconds before generating again`,
      );
      return;
    }

    setIsSmartGenerating(false); // Reset stuck state if any
    setIsSmartDialogOpen(true);
  };

  const handleRunSmartGenerate = async (results: any) => {
    const { model, ...preferences } = results;
    if (isSmartGenerating) return;

    setIsSmartGenerating(true);
    try {
      const result = await smartGenerateAction({
        courses: courses as any,
        selectedCodes,
        maxSks: sessionProfile.maxSks,
        preferences,
        model,
      });

      if (result.success) {
        toast.success(
          `AI generated ${result.count} optimized schedules! Check Archive.`,
        );
        setIsSmartDialogOpen(false);
        setStep("archive");
      }
    } catch (err: any) {
      toast.error(err.message || "Smart Generate failed");
    } finally {
      setIsSmartGenerating(false);
    }
  };

  const handleGenerate = async (tokenized: boolean = false) => {
    // Source of truth: state (might have immediate local updates) or DB prop
    let currentLimit = Math.max(planLimit, userData?.planLimit || 12);

    if (tokenized) {
      if (!userData || userData.credits <= 0) {
        toast.error("Daily limit reached. Come back tomorrow!");
        return;
      }
      try {
        await consumeTokenMutation({ type: "expand" });
        toast.success("Consumed 1 token for +12 expansion.");
        currentLimit = (userData?.planLimit || planLimit) + 12;
        setPlanLimit(currentLimit);
      } catch (err: any) {
        toast.error("Failed to consume token: " + err.message);
        return;
      }
    }

    setIsGenerating(true);
    try {
      const activeCourses = courses.filter((c) => {
        if (!selectedCodes.includes(c.code)) return false;
        const lockedIds = lockedCourses[c.code];
        // If no specific classes are locked (empty or undefined), allow all variations (Auto-Optimize)
        if (!lockedIds || lockedIds.length === 0) return true;
        // Otherwise, only allow if the course ID is in the locked list
        return lockedIds.includes(c.id);
      });

      const generated = generatePlans(
        activeCourses,
        selectedCodes,
        currentLimit,
      );

      if (generated.length === 0) {
        toast.error(
          "No valid schedules found. Try releasing some locked classes to allow more combinations.",
        );
        return;
      }

      if (tokenized) {
        // Append logic: Find plans that are NOT already in the set
        const existingComboKeys = new Set(
          plans.map((p) =>
            p.courses
              .map((c) => c.id)
              .sort()
              .join(","),
          ),
        );

        const newPlans = generated
          .filter((p) => {
            const key = p.courses
              .map((c) => c.id)
              .sort()
              .join(",");
            return !existingComboKeys.has(key);
          })
          .slice(0, 12); // Only add the increment of 12

        if (newPlans.length === 0) {
          toast.info(
            "No new unique schedule combinations found with this configuration.",
          );
        } else {
          setPlans((prev) => [...prev, ...newPlans]);
          toast.success(
            `Discovered ${newPlans.length} new academic combinations!`,
          );
        }
      } else {
        setPlans(generated);
        setCurrentPlanIndex(0);
        setViewSource("live");
        setStep("view");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCourse = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleDeleteCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    toast.success("Academic component removed.");
  };

  const handleAutoLoad = () => {
    if (!curriculum || !allMasterCourses) return;
    const mandatoryCodes = new Set(curriculum.map((c) => c.code));
    const filteredCourses = allMasterCourses.filter((c) =>
      mandatoryCodes.has(c.code),
    );

    const coursesWithIds = filteredCourses.map((c: any) => ({
      ...c,
      id: c._id || `${c.code}-${c.class}`,
    }));

    setCourses(coursesWithIds as any);
    setSelectedCodes(Array.from(mandatoryCodes));
    setStep("select");
    setPlanLimit(12);
    toast.success(
      `${mandatoryCodes.size} academic components loaded from curriculum.`,
    );
  };

  const handleAddMasterCourse = (masterCourse: any) => {
    const newCourse = {
      ...masterCourse,
      id: masterCourse._id || `${masterCourse.code}-${masterCourse.class}`,
    };
    setCourses((prev) => [...prev, newCourse]);
    if (!selectedCodes.includes(masterCourse.code)) {
      setSelectedCodes((prev) => [...prev, masterCourse.code]);
    }
    toast.success(`${masterCourse.name} added to session.`);
    setIsMasterSearchOpen(false);
  };

  return (
    <div className="pb-20 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-10">
          {/* Sidebar Step Indicator (Desktop) / Top Flow (Mobile) */}
          {step !== "archive" && (
            <aside className="lg:w-56 shrink-0 h-fit lg:sticky lg:top-24">
              <div className="flex flex-col gap-6">
                <div className="hidden lg:flex items-center gap-2 px-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                    Architect Engine
                  </h3>
                  <HelpTooltip
                    titleKey="help.architect_title"
                    descKey="help.architect_desc"
                  />
                </div>

                {/* Stepper Container */}
                <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-0 lg:gap-8 relative lg:pl-4">
                  {/* Vertical line for desktop */}
                  <div className="hidden lg:block absolute left-8 top-2 bottom-2 w-0.5 bg-slate-100 -z-10" />
                  <div
                    className="hidden lg:block absolute left-8 top-2 w-0.5 bg-blue-600 transition-all duration-700 -z-10"
                    style={{
                      height:
                        step === "config"
                          ? "0%"
                          : step === "select"
                            ? "50%"
                            : "100%",
                    }}
                  />

                  {/* Horizontal line for mobile */}
                  <div className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
                  <div
                    className="lg:hidden absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-500 -z-10"
                    style={{
                      width:
                        step === "config"
                          ? "0%"
                          : step === "select"
                            ? "50%"
                            : "100%",
                    }}
                  />

                  {[
                    { id: "config", label: t("maker.step_config") },
                    { id: "select", label: t("maker.step_select") },
                    { id: "view", label: t("maker.step_view") },
                  ].map((s, i) => {
                    const isActive = step === s.id;
                    const isPast =
                      (step === "select" && i === 0) ||
                      (step === "view" && i <= 1);

                    return (
                      <div
                        key={s.id}
                        className="flex lg:flex-row flex-col items-center gap-2 lg:gap-4 group cursor-pointer transition-all"
                        onClick={() => {
                          if (isActive) return;
                          if (s.id === "config") setStep("config");
                          if (s.id === "select" && courses.length > 0)
                            setStep("select");
                        }}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all border-2 relative z-10 ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110 lg:scale-125"
                              : isPast
                                ? "bg-blue-100 border-blue-600 text-blue-600"
                                : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div className="flex flex-col lg:items-start items-center">
                          <span
                            className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                              isActive
                                ? "text-blue-700 font-bold"
                                : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </span>
                          {isActive && (
                            <span className="hidden lg:block text-[8px] text-blue-400 font-medium lowercase italic opacity-80">
                              currently active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {step === "config" && (
              <ScheduleConfig
                sessionProfile={sessionProfile}
                setSessionProfile={setSessionProfile}
                onStart={handleAutoLoad}
              />
            )}

            {step === "select" && (
              <ScheduleSelector
                courses={courses}
                selectedCodes={selectedCodes}
                lockedCourses={lockedCourses}
                sessionProfile={sessionProfile}
                toggleCourse={toggleCourse}
                setLockedCourses={setLockedCourses}
                handleDeleteCourse={handleDeleteCourse}
                onAddSubject={() => setIsMasterSearchOpen(true)}
                onGenerate={handleGenerate}
                onSmartGenerate={onInitSmartGenerate}
                onBack={() => setStep("config")}
                isGenerating={isGenerating}
                isSmartGenerating={isSmartGenerating}
                cooldown={cooldown}
              />
            )}

            {step === "view" && plans.length > 0 && (
              <ScheduleViewer
                plans={plans}
                currentPlanIndex={currentPlanIndex}
                setCurrentPlanIndex={setCurrentPlanIndex}
                onBack={() =>
                  setStep(viewSource === "archive" ? "archive" : "select")
                }
                onSavePlan={handleSavePlan}
                isSaving={isSaving}
                onExpand={
                  viewSource === "live" && planLimit < 36
                    ? () => handleGenerate(true)
                    : undefined
                }
                onShuffle={
                  viewSource === "live"
                    ? () => handleGenerate(false)
                    : undefined
                }
                planLimit={planLimit}
                isGenerating={isGenerating}
                userData={userData as any}
              />
            )}

            {step === "archive" && (
              <div className="w-full">
                <ScheduleArchive
                  archived={archived}
                  onImport={handleImportArchived}
                  onDelete={handleDeleteArchived}
                  onRename={handleRenameArchived}
                  onShare={handleSharePlan}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <MasterCatalogDialog
        isOpen={isMasterSearchOpen}
        onOpenChange={setIsMasterSearchOpen}
        allMasterCourses={allMasterCourses}
        onAddCourse={handleAddMasterCourse}
      />

      <SmartGenerateDialog
        isOpen={isSmartDialogOpen}
        onOpenChange={setIsSmartDialogOpen}
        courses={courses}
        selectedCodes={selectedCodes}
        onGenerate={handleRunSmartGenerate}
        isGenerating={isSmartGenerating}
        cooldown={cooldown}
      />

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        shareId={activeShareId}
        planName={activeSharePlanName}
      />
    </div>
  );
}
