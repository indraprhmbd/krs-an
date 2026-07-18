import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Course } from "@/types";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { useSession } from "../context/SessionContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { usePlanArchive } from "@/hooks/usePlanArchive";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTutorial, TutorialStep } from "@/hooks/useTutorial";
import { TutorialModal } from "@/components/ui/TutorialModal";
import { useEffect, useRef } from "react";

import { useScheduleSession } from "@/hooks/maker/useScheduleSession";
import { useSmartGenerate } from "@/hooks/maker/useSmartGenerate";
import { useSharePlan } from "@/hooks/maker/useSharePlan";
import { useArchiveActions } from "@/hooks/maker/useArchiveActions";

// Refactored Components
import { ScheduleConfig } from "./maker/ScheduleConfig";
import { ScheduleSelector } from "./maker/ScheduleSelector";
import { ScheduleViewer } from "./maker/ScheduleViewer";
import { ScheduleArchive } from "./maker/ScheduleArchive";
import { SmartGenerateDialog } from "./maker/SmartGenerateDialog";
import { MasterCatalogDialog } from "./maker/MasterCatalogDialog";
import { ShareDialog } from "./maker/ShareDialog";
import type { MakerRailStep } from "./maker/MakerShell";
import { DEFAULT_SEMESTER, coerceSemester } from "@/lib/period";

interface ScheduleMakerProps {
  userData?: {
    _id: string;
    credits: number;
    isAdmin: boolean;
    lastSmartGenerateTime?: number;
    planLimit?: number;
    preferredAiModel?: string;
  };
}

export function ScheduleMaker({ userData }: ScheduleMakerProps) {
  const { t } = useLanguage();
  const {
    step,
    setStep,
    tutorialRequestId,
    isMasterSearchOpen,
    setIsMasterSearchOpen,
    isSmartDialogOpen,
    setIsSmartDialogOpen,
    isShareDialogOpen,
    setIsShareDialogOpen,
    activeShareId,
    activeSharePlanName,
    openShareDialog,
  } = useSession();

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

  // Convex queries
  const allMasterCourses = useQuery(api.admin.listMasterCourses, {
    prodi: sessionProfile.prodi,
  });
  const curriculum = useQuery(api.admin.listCurriculum, {
    prodi: sessionProfile.prodi,
    semester,
  });

  // Plan archive: Convex when signed in, localStorage when not.
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

  const consumeTokenMutation = useMutation(api.users.generateServiceToken);
  const requireAuth = useRequireAuth();

  const session = useScheduleSession({
    t,
    setStep,
    userData,
    savePlan,
    isLocalArchive,
    configKey: `${sessionProfile.prodi}|${semester}`,
  });

  // The step rail shared by config/select/view via MakerShell. Archive is
  // reached from the Navbar rather than being part of this sequence.
  const rail: MakerRailStep[] = [
    { id: "config", label: t("maker.step_config"), canNavigate: true },
    {
      id: "select",
      label: t("maker.step_select"),
      canNavigate: session.courses.length > 0,
    },
    {
      id: "view",
      label: t("maker.step_view"),
      canNavigate: session.plans.length > 0,
    },
  ];

  const smart = useSmartGenerate({
    t,
    userData,
    selectedCodes: session.selectedCodes,
    courses: session.courses,
    maxSks: sessionProfile.maxSks,
    requireAuth,
    setIsSmartDialogOpen,
    setMaxDailySks: session.setMaxDailySks,
    setStep,
  });

  const { handleSharePlan } = useSharePlan({
    archived,
    requireAuth,
    openShareDialog,
    t,
  });

  const { handleDeleteArchived, handleRenameArchived, handleImportArchived } =
    useArchiveActions({
      t,
      deletePlan,
      renamePlan,
      setPlans: session.setPlans,
      setCurrentPlanIndex: session.setCurrentPlanIndex,
      setViewSource: session.setViewSource,
      setStep,
    });

  // --- Tutorial setup ---
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
      targetId: "schedule-selector",
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

  // Sync maker step with the tutorial's step index while it is active.
  useEffect(() => {
    if (!isTutorialActive) return;

    // Step 0: Config. Steps 1-2: Select. Step 3: Viewer.
    if (currentStepIndex === 0 && step !== "config") {
      setStep("config");
    } else if (
      (currentStepIndex === 1 || currentStepIndex === 2) &&
      step !== "select"
    ) {
      setStep("select");
    } else if (currentStepIndex === 3 && step !== "view") {
      // No plans yet at this point in the walkthrough: fall back to select
      // rather than showing an empty viewer.
      setStep(session.plans.length > 0 ? "view" : "select");
    }
  }, [currentStepIndex, isTutorialActive, step, session.plans.length]);

  // Manual trigger from Navbar, via the session store's requestTutorial()
  // rather than a window CustomEvent. Skip the id's initial value (0) so
  // mount does not start the tutorial on its own.
  const tutorialRequested = useRef(0);
  useEffect(() => {
    if (
      tutorialRequestId === 0 ||
      tutorialRequestId === tutorialRequested.current
    )
      return;
    tutorialRequested.current = tutorialRequestId;
    startTutorial();
  }, [tutorialRequestId, startTutorial]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 h-full overflow-y-auto lg:overflow-hidden p-3 lg:px-6 lg:py-3">
            {step === "config" && (
              <div id="schedule-config" className="h-full">
                <ScheduleConfig
                  rail={rail}
                  sessionProfile={sessionProfile}
                  setSessionProfile={setSessionProfile}
                  onStart={() => setStep("select")}
                />
              </div>
            )}

            {step === "select" && (
              <div id="schedule-selector" className="h-full">
                <ScheduleSelector
                  rail={rail}
                  courses={session.courses}
                  selectedCodes={session.selectedCodes}
                  lockedCourses={session.lockedCourses}
                  sessionProfile={sessionProfile}
                  toggleCourse={session.toggleCourse}
                  setLockedCourses={session.setLockedCourses}
                  handleDeleteCourse={session.handleDeleteCourse}
                  onAddSubject={() => setIsMasterSearchOpen(true)}
                  onLoadCurriculum={() =>
                    session.handleAutoLoad(curriculum, allMasterCourses)
                  }
                  onGenerate={(tokenized: boolean = false) =>
                    session.handleGenerate(tokenized, {
                      requireAuth,
                      consumeTokenMutation,
                    })
                  }
                  onSmartGenerate={smart.onInitSmartGenerate}
                  onSaveManual={session.handleSaveManualPlan}
                  isGenerating={session.isGenerating}
                  isSmartGenerating={smart.isSmartGenerating}
                  cooldown={smart.cooldown}
                />
              </div>
            )}

            {step === "view" && session.plans.length > 0 && (
              <div id="schedule-viewer" className="h-full">
                <ScheduleViewer
                  rail={rail}
                  plans={session.plans}
                  currentPlanIndex={session.currentPlanIndex}
                  setCurrentPlanIndex={session.setCurrentPlanIndex}
                  onBack={() => {
                    setStep(
                      session.viewSource === "archive" ? "archive" : "select",
                    );
                    session.setIsManualMode(false);
                  }}
                  onSavePlan={session.handleSaveManualPlan}
                  isSaving={session.isSaving}
                  isManualEdit={session.isManualMode}
                  onUpdatePlan={session.handleUpdateManualPlan}
                  allPossibleCourses={session.courses}
                  onExpand={
                    session.viewSource === "live" &&
                    session.planLimit < 36 &&
                    !session.isManualMode
                      ? () =>
                          session.handleGenerate(true, {
                            requireAuth,
                            consumeTokenMutation,
                          })
                      : undefined
                  }
                  onShuffle={
                    session.viewSource === "live" && !session.isManualMode
                      ? () =>
                          session.handleGenerate(false, {
                            requireAuth,
                            consumeTokenMutation,
                          })
                      : undefined
                  }
                  planLimit={session.planLimit}
                  isGenerating={session.isGenerating}
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
        onAddCourses={(masterCourses: Course[]) =>
          session.handleAddMultipleMasterCourses(masterCourses, () =>
            setIsMasterSearchOpen(false),
          )
        }
      />

      <SmartGenerateDialog
        isOpen={isSmartDialogOpen}
        onOpenChange={setIsSmartDialogOpen}
        courses={session.courses}
        selectedCodes={session.selectedCodes}
        onGenerate={smart.handleRunSmartGenerate}
        isGenerating={smart.isSmartGenerating}
        cooldown={smart.cooldown}
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
