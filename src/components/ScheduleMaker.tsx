import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generatePlans } from "@/lib/scheduler";
import type { Course, Plan } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { HelpTooltip } from "./ui/HelpTooltip";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { usePlanArchive } from "@/hooks/usePlanArchive";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTutorial, TutorialStep } from "@/hooks/useTutorial";
import { TutorialModal } from "@/components/ui/TutorialModal";

// Refactored Components
import { ScheduleConfig } from "./maker/ScheduleConfig";
import { ScheduleSelector } from "./maker/ScheduleSelector";
import { ScheduleViewer } from "./maker/ScheduleViewer";
import { ScheduleArchive } from "./maker/ScheduleArchive";
import { SmartGenerateDialog } from "./maker/SmartGenerateDialog";
import { MasterCatalogDialog } from "./maker/MasterCatalogDialog";
import { ShareDialog } from "./maker/ShareDialog";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { DEFAULT_SEMESTER, coerceSemester } from "@/lib/period";

/** The rail's order. `archive` is not a step; it is reached from the Navbar. */
const STEP_ORDER = ["config", "select", "view"] as const;
type MakerStep = (typeof STEP_ORDER)[number];

interface ScheduleMakerProps {
  externalStep?: "config" | "select" | "view" | "archive";
  onStepChange?: (step: "config" | "select" | "view" | "archive") => void;
  userData?: {
    _id: string;
    credits: number;
    isAdmin: boolean;
    lastSmartGenerateTime?: number;
    planLimit?: number;
    preferredAiModel?: string;
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

  const STEPS: { id: MakerStep; label: string }[] = [
    { id: "config", label: t("maker.step_config") },
    { id: "select", label: t("maker.step_select") },
    { id: "view", label: t("maker.step_view") },
  ];
  const [sessionProfile, setSessionProfile] = useLocalStorage<{
    university: string;
    prodi: string;
    semester: number;
    maxSks: number;
    useMaster: boolean;
  }>("krs-session-profile", {
    university: "UPN_VETERAN_YOGYAKARTA",
    prodi: "INFORMATIKA",
    semester: DEFAULT_SEMESTER,
    maxSks: 24,
    useMaster: true,
  });

  // A stored profile predates the current term, so its semester can have the
  // wrong parity: the default above only applies to first-time visitors. Left
  // alone, a stored 2 during an Odd term matches no option and Radix renders
  // the Select empty. Read through a coercion rather than writing back, so a
  // student who set 2 last term is not silently rewritten by a page load.
  const semester = coerceSemester(sessionProfile.semester);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCodes, setSelectedCodes] = useLocalStorage<string[]>(
    "krs-selected-codes",
    [],
  );
  const [lockedCourses, setLockedCourses] = useLocalStorage<
    Record<string, string[]>
  >("krs-locked-courses", {});
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
    semester,
  });

  // Plan archive. Backed by Convex when signed in, localStorage when not.
  const {
    plans: archived,
    isLocal: isLocalArchive,
    corruptCount,
    savePlan,
    deletePlan,
    renamePlan,
  } = usePlanArchive();

  // Unreadable rows are dropped rather than crashing the archive, but say so
  // once instead of letting plans quietly disappear. Keyed to the count so a
  // re-render does not re-toast.
  const corruptReported = useRef(0);
  useEffect(() => {
    if (corruptCount > 0 && corruptReported.current !== corruptCount) {
      corruptReported.current = corruptCount;
      toast.warning(t("toast.plan_corrupt", { count: corruptCount }));
    }
  }, [corruptCount, t]);

  const createShareLinkMutation = useMutation(api.plans.createShareLink);
  const consumeTokenMutation = useMutation(api.users.generateServiceToken);
  const updatePreferencesMutation = useMutation(api.users.updatePreferences);
  const requireAuth = useRequireAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [maxDailySks, setMaxDailySks] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Handlers
  const handleDeleteArchived = async (planId: string) => {
    try {
      await deletePlan(planId);
      toast.success(t("toast.plan_removed"));
    } catch (err: any) {
      toast.error(t("toast.delete_failed", { error: err.message }));
    }
  };

  const handleImportArchived = (allPlans: Plan[], index: number) => {
    setPlans(allPlans);
    setCurrentPlanIndex(index);
    setViewSource("archive");
    setStep("view");
    toast.info(t("toast.imported_to_viewer", { count: allPlans.length }));
  };

  const [isSmartGenerating, setIsSmartGenerating] = useState(false);

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
      await renamePlan(planId, newName);
      toast.success(t("toast.plan_renamed"));
    } catch (err: any) {
      toast.error(t("toast.rename_failed", { error: err.message }));
    }
  };

  // --- Tutorial Setup ---
  // --- Tutorial Setup ---
  // Define steps with side-effects (actions) to navigate the app
  const tutorialSteps: TutorialStep[] = [
    {
      targetId: "schedule-config",
      title: t("tutorial.step1_title"),
      description: t("tutorial.step1_desc"),
      position: "left",
    },
    {
      targetId: "schedule-selector",
      title: t("tutorial.step2_title"),
      description: t("tutorial.step2_desc"),
      position: "left",
    },
    {
      targetId: "schedule-selector", // Target selector again, but maybe highlight the generate button?
      // For now, keep generic selector ID but text explains tools
      title: t("tutorial.step3_title"),
      description: t("tutorial.step3_desc"),
      position: "top",
    },
    {
      targetId: "schedule-viewer",
      title: t("tutorial.step4_title"),
      description: t("tutorial.step4_desc"),
      position: "top",
    },
  ];

  const {
    isActive: isTutorialActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    startTutorial,
  } = useTutorial({
    tutorialId: "v2_walkthrough",
    steps: tutorialSteps,
  });

  // Sync App State with Tutorial Steps
  useEffect(() => {
    if (!isTutorialActive) return;

    // Logic to enforce state based on step index
    // Step 0: Config
    // Step 1: Select
    // Step 2: Select (Tools)
    // Step 3: Viewer
    if (currentStepIndex === 0 && step !== "config") {
      setStep("config");
    } else if (
      (currentStepIndex === 1 || currentStepIndex === 2) &&
      step !== "select"
    ) {
      setStep("select");
    } else if (currentStepIndex === 3 && step !== "view") {
      // Only force view if we have plans, otherwise maybe skip this step or mock it?
      // For tutorial purposes, if no plans exist, we might be stuck.
      // Let's auto-generate a dummy or just switch if possible.
      if (plans.length > 0) {
        setStep("view");
      } else {
        // Edge case: if no plans, maybe stay on select but warn?
        // Or just do nothing and let user discover.
        // Better: Mock data or just skip logic.
        // For now, attempt switch.
        setStep("select"); // Fallback to select if no plans
      }
    }
  }, [currentStepIndex, isTutorialActive, step, plans.length]);

  // Listen for manual trigger from Navbar
  useEffect(() => {
    const handleTrigger = () => startTutorial();
    window.addEventListener("trigger-tutorial", handleTrigger);
    return () => window.removeEventListener("trigger-tutorial", handleTrigger);
  }, []);

  const handleSharePlan = async (planId: string) => {
    const plan = archived?.find((p) => (p as any)._id === planId);
    if (!plan) return;

    // Sharing needs a server-side row to point the link at, so a local plan
    // cannot be shared until it has been migrated.
    if (
      !requireAuth(
        "Sharing needs an account so the link has somewhere to live. Your plans will be imported when you sign in.",
      )
    ) {
      return;
    }

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
    if (
      !requireAuth(
        "Smart Generate uses AI and costs 1 of your 5 daily credits, so it needs an account. The regular generator is free and needs no sign-in.",
      )
    ) {
      return;
    }

    // The button is disabled without a selection, but this is the guard that
    // matters: Smart Generate spends a credit and burns the 30s rate limit, and
    // a disabled attribute is not a check.
    if (selectedCodes.length === 0) {
      toast.error(t("toast.needs_courses"));
      return;
    }

    if (!userData || userData.credits <= 0) {
      toast.error(t("toast.no_credits"));
      return;
    }

    // Quick check: if in cooldown, tell user immediately
    if (cooldown.active) {
      toast.error(t("toast.cooldown", { seconds: cooldown.seconds }));
      return;
    }

    setIsSmartGenerating(false); // Reset stuck state if any
    setIsSmartDialogOpen(true);
  };

  const handleRunSmartGenerate = async (preferences: {
    preferredLecturers: string[];
    preferredDaysOff: string[];
    customInstructions: string;
    model: string;
    maxDailySks: number;
  }) => {
    setIsSmartDialogOpen(false);
    setIsSmartGenerating(true);

    // Save preference to local state
    setMaxDailySks(preferences.maxDailySks);

    try {
      // Destructure model out to keep the preferences object clean,
      // though backend now accepts it for backward compatibility.
      const { model, ...cleanPrefs } = preferences;

      const result = await smartGenerateAction({
        courses: courses as any,
        selectedCodes,
        maxSks: sessionProfile.maxSks,
        preferences: cleanPrefs as any, // Cast to any to avoid strict type mismatch during data transition
        model: model,
      });

      // Persist the choice
      await updatePreferencesMutation({ preferredAiModel: preferences.model });

      if (result.success) {
        toast.success(t("toast.ai_success", { count: result.count }));
        setIsSmartDialogOpen(false);
        setStep("archive");
      }
    } catch (err: any) {
      // Improve error handling for common AI failures
      const msg = err.message || "";
      if (
        msg.includes("Token was not consumed") ||
        msg.includes("no valid plans")
      ) {
        toast.warning(t("toast.ai_no_result"), { duration: 5000 });
      } else {
        toast.error(t("toast.ai_failed", { error: msg }));
      }
    } finally {
      setIsSmartGenerating(false);
    }
  };

  const handleGenerate = async (tokenized: boolean = false) => {
    // Source of truth: state (might have immediate local updates) or DB prop
    let currentLimit = Math.max(planLimit, userData?.planLimit || 12);

    if (tokenized) {
      if (
        !requireAuth(
          "Expanding the plan limit costs 1 of your 5 daily credits, so it needs an account.",
        )
      ) {
        return;
      }
      if (currentLimit >= 36) {
        toast.error(t("toast.plan_limit"));
        return;
      }
      if (!userData || userData.credits <= 0) {
        toast.error(t("toast.daily_limit"));
        return;
      }
      try {
        await consumeTokenMutation({ type: "expand" });
        toast.success(t("toast.token_spent"));
        currentLimit = Math.min((userData?.planLimit || planLimit) + 12, 36);
        setPlanLimit(currentLimit);
      } catch (err: any) {
        toast.error(t("toast.token_failed", { error: err.message }));
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
        maxDailySks,
      );

      if (generated.length === 0) {
        toast.error(t("toast.no_valid_schedules"));
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
          toast.info(t("toast.no_combinations"));
        } else {
          setPlans((prev) => [...prev, ...newPlans]);
          toast.success(t("toast.plans_imported", { count: newPlans.length }));
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
    toast.success(t("toast.course_removed"));
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

  const handleAddMultipleMasterCourses = (masterCourses: any[]) => {
    const newCourses = masterCourses.map((mc) => ({
      ...mc,
      id: mc._id || `${mc.code}-${mc.class}`,
    }));

    setCourses((prev) => [...prev, ...newCourses]);

    // Update selectedCodes for any new unique course codes
    const uniqueNewCodes = [
      ...new Set(masterCourses.map((mc) => mc.code)),
    ].filter((code) => !selectedCodes.includes(code));

    if (uniqueNewCodes.length > 0) {
      setSelectedCodes((prev) => [...prev, ...uniqueNewCodes]);
    }

    toast.success(t("toast.courses_added", { count: masterCourses.length }));
    setIsMasterSearchOpen(false);
  };

  const handleSaveManualPlan = async (data: Course[] | Plan) => {
    // If it's an empty array, it's the signals to enter plotter mode
    if (Array.isArray(data) && data.length === 0) {
      const draftCombo = selectedCodes
        .map((code) => {
          const variations = courses.filter((c) => c.code === code);
          const lockedIds = lockedCourses[code] || [];
          // Only return the variations if they are explicitly locked, otherwise null (unselected)
          return variations.find((v) => lockedIds.includes(v.id)) || null;
        })
        .filter(Boolean);

      const draftPlan: Plan = {
        id: "manual-draft",
        name: "Manual Draft",
        courses: draftCombo as Course[],
        score: { safe: 100, risky: 0, optimal: 0 },
        analysis: "Manual assembly in progress...",
      };

      setPlans([draftPlan]);
      setCurrentPlanIndex(0);
      setIsManualMode(true);
      setStep("view");
      setViewSource("live");
      return;
    }

    setIsSaving(true);
    try {
      const isFullPlan = !Array.isArray(data);
      const name = isFullPlan
        ? data.name
        : `Manual Draft ${new Date().toLocaleTimeString()}`;

      const payload = isFullPlan
        ? data
        : {
            id: crypto.randomUUID(),
            name: "Manual Plan",
            courses: data,
            score: { safe: 100, risky: 0, optimal: 0 },
            analysis: "Hand-crafted schedule with manual selection",
          };

      // Anonymous users save to localStorage; this is not gated. The plans are
      // offered for import on sign-in.
      const planId = await savePlan({
        name,
        plan: payload as Plan,
        isSmartGenerated: isFullPlan,
        generatedBy: isFullPlan
          ? userData?.preferredAiModel || "groq"
          : "manual",
      });

      toast.success(
        t(isFullPlan ? "toast.plan_archived" : "toast.manual_saved"),
        { description: isLocalArchive ? t("toast.saved_local") : undefined },
      );

      const newPlan = isFullPlan
        ? data
        : {
            ...payload,
            id: planId as string,
          };

      if (isManualMode) {
        setIsManualMode(false);
      }

      if (!isFullPlan) {
        setPlans([newPlan as Plan]);
        setCurrentPlanIndex(0);
      }

      setStep("view");
    } catch (err: any) {
      toast.error(t("toast.save_failed", { error: err.message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateManualPlan = (updatedCourses: Course[]) => {
    setPlans((prev) => {
      const next = [...prev];
      if (next[currentPlanIndex]) {
        next[currentPlanIndex] = {
          ...next[currentPlanIndex],
          courses: updatedCourses,
        };
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Sidebar Step Indicator (Desktop) / Top Flow (Mobile) */}
          {step !== "archive" && (
            <aside className="h-auto shrink-0 overflow-y-auto border-b border-border bg-card p-3 lg:h-full lg:w-64 lg:border-b-0 lg:border-r lg:p-4">
              <div className="flex flex-col gap-4">
                <div className="hidden items-center gap-2 px-2 lg:flex">
                  <h3 className="text-caps uppercase text-muted-foreground">
                    Architect Engine
                  </h3>
                  <HelpTooltip
                    titleKey="help.architect_title"
                    descKey="help.architect_desc"
                  />
                </div>

                {/*
                  The progress rail was two pairs of absolutely positioned divs
                  (one axis each) whose length was driven by a hardcoded
                  percentage per step. It is one ordered list now; the rail is a
                  border on the list itself, so it cannot drift out of sync with
                  the steps.
                */}
                <ol className="relative flex items-center justify-between gap-2 lg:flex-col lg:items-stretch lg:justify-start lg:gap-1">
                  {STEPS.map((s, i) => {
                    const isActive = step === s.id;
                    const isPast = STEP_ORDER.indexOf(step as MakerStep) > i;
                    const canNavigate =
                      s.id === "config" ||
                      (s.id === "select" && courses.length > 0);

                    return (
                      <li key={s.id} className="min-w-0 flex-1 lg:flex-none">
                        <button
                          type="button"
                          disabled={isActive || !canNavigate}
                          aria-current={isActive ? "step" : undefined}
                          onClick={() => {
                            if (isActive || !canNavigate) return;
                            setStep(s.id);
                          }}
                          className={cn(
                            "flex w-full flex-col items-center gap-2 rounded-control p-2 text-center transition-colors lg:flex-row lg:gap-3 lg:text-left",
                            canNavigate && !isActive && "hover:bg-accent",
                            !canNavigate && !isActive && "cursor-default",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-caption font-bold transition-colors",
                              isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : isPast
                                  ? "border-primary bg-card text-primary"
                                  : "border-border bg-card text-muted-foreground",
                            )}
                          >
                            {isPast ? <Icon name="check" size={12} /> : i + 1}
                          </span>
                          <span
                            className={cn(
                              "truncate font-mono text-caps uppercase  transition-colors",
                              isActive
                                ? "font-bold text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {s.label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto lg:overflow-hidden p-3 lg:p-6">
            {step === "config" && (
              <div id="schedule-config" className="h-full">
                <ScheduleConfig
                  sessionProfile={sessionProfile}
                  setSessionProfile={setSessionProfile}
                  onStart={handleAutoLoad}
                />
              </div>
            )}

            {step === "select" && (
              <div id="schedule-selector" className="h-full">
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
                  onSaveManual={handleSaveManualPlan}
                  onBack={() => setStep("config")}
                  isGenerating={isGenerating}
                  isSmartGenerating={isSmartGenerating}
                  cooldown={cooldown}
                />
              </div>
            )}

            {step === "view" && plans.length > 0 && (
              <div id="schedule-viewer" className="h-full">
                <ScheduleViewer
                  plans={plans}
                  currentPlanIndex={currentPlanIndex}
                  setCurrentPlanIndex={setCurrentPlanIndex}
                  onBack={() => {
                    setStep(viewSource === "archive" ? "archive" : "select");
                    setIsManualMode(false);
                  }}
                  onSavePlan={handleSaveManualPlan}
                  isSaving={isSaving}
                  isManualEdit={isManualMode}
                  onUpdatePlan={handleUpdateManualPlan}
                  allPossibleCourses={courses}
                  onExpand={
                    viewSource === "live" && planLimit < 36 && !isManualMode
                      ? () => handleGenerate(true)
                      : undefined
                  }
                  onShuffle={
                    viewSource === "live" && !isManualMode
                      ? () => handleGenerate(false)
                      : undefined
                  }
                  planLimit={planLimit}
                  isGenerating={isGenerating}
                  prodi={sessionProfile.prodi}
                />
              </div>
            )}

            {step === "archive" && (
              <div className="w-full h-full">
                <ScheduleArchive
                  archived={archived}
                  isLocal={isLocalArchive}
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
        onAddCourses={handleAddMultipleMasterCourses}
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
      {isTutorialActive && currentStep && (
        <TutorialModal
          step={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTutorial}
        />
      )}
    </div>
  );
}
