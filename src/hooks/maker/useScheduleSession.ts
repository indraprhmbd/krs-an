import { useState } from "react";
import { generatePlans } from "@/lib/scheduler";
import type { Course, Plan } from "@/types";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * The live schedule-building session: the courses on the table, which codes
 * are selected, which specific classes are locked, and the generated plans.
 *
 * This used to be ~20 separate useState calls and their handlers inlined
 * directly in ScheduleMaker.tsx alongside unrelated concerns (sharing, smart
 * generate, the tutorial). Pulling it into one hook does not shrink the
 * amount of logic, but it does separate "building a schedule" from
 * "everything else the maker screen happens to also do" -- the two were
 * previously impossible to tell apart by reading the component.
 */

interface UseScheduleSessionArgs {
  t: (key: string, vars?: Record<string, string | number>) => string;
  setStep: (step: "config" | "select" | "view" | "archive") => void;
  userData?: { planLimit?: number; preferredAiModel?: string };
  savePlan: (args: {
    name: string;
    plan: Plan;
    isSmartGenerated?: boolean;
    generatedBy?: string;
  }) => Promise<string>;
  isLocalArchive: boolean;
}

export function useScheduleSession({
  t,
  setStep,
  userData,
  savePlan,
  isLocalArchive,
}: UseScheduleSessionArgs) {
  const [courses, setCourses] = useLocalStorage<Course[]>("krs-courses", []);
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
  const [planLimit, setPlanLimit] = useState(userData?.planLimit || 12);
  const [maxDailySks, setMaxDailySks] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAutoLoad = (
    curriculum: { code: string }[] | undefined,
    allMasterCourses: any[] | undefined,
  ) => {
    if (!curriculum || !allMasterCourses) return;
    const mandatoryCodes = new Set(curriculum.map((c) => c.code));
    const filteredCourses = allMasterCourses.filter((c) =>
      mandatoryCodes.has(c.code),
    );

    const coursesWithIds = filteredCourses.map((c: any) => ({
      ...c,
      id: c._id || `${c.code}-${c.class}`,
    }));

    // The toast used to report mandatoryCodes.size -- the number of curriculum
    // rows -- regardless of whether any matching class was actually found in
    // master_courses. A curriculum can exist for a prodi+semester before its
    // sections are imported, so that count was frequently a lie ("N mata
    // kuliah dimuat" when 0 courses actually loaded). Report and select only
    // codes that resolved to a real course.
    const foundCodes = new Set(coursesWithIds.map((c: any) => c.code));

    setCourses(coursesWithIds as any);
    setSelectedCodes(Array.from(foundCodes));
    setStep("select");
    setPlanLimit(12);

    if (foundCodes.size === 0) {
      toast.warning(t("toast.curriculum_empty"));
    } else {
      toast.success(t("toast.curriculum_loaded", { count: foundCodes.size }));
    }
  };

  const handleAddMultipleMasterCourses = (
    masterCourses: any[],
    onDone: () => void,
  ) => {
    const newCourses = masterCourses.map((mc) => ({
      ...mc,
      id: mc._id || `${mc.code}-${mc.class}`,
    }));

    setCourses((prev) => [...prev, ...newCourses]);

    const uniqueNewCodes = [
      ...new Set(masterCourses.map((mc) => mc.code)),
    ].filter((code) => !selectedCodes.includes(code));

    if (uniqueNewCodes.length > 0) {
      setSelectedCodes((prev) => [...prev, ...uniqueNewCodes]);
    }

    // Count/SKS by unique course code, not by row -- masterCourses can carry
    // every class/section for a code, and the toast should read as "N mata
    // kuliah" (courses), matching what the catalog dialog's own selection
    // badges already count, not "N sections."
    const seenCodes = new Set<string>();
    let totalSks = 0;
    for (const mc of masterCourses) {
      if (!seenCodes.has(mc.code)) {
        seenCodes.add(mc.code);
        totalSks += mc.sks || 0;
      }
    }

    toast.success(
      t("toast.courses_added", { count: seenCodes.size, sks: totalSks }),
    );
    onDone();
  };

  const handleGenerate = async (
    tokenized: boolean,
    deps: {
      requireAuth: (reason: string) => boolean;
      consumeTokenMutation: (args: { type: string }) => Promise<unknown>;
    },
  ) => {
    let currentLimit = Math.max(planLimit, userData?.planLimit || 12);

    if (tokenized) {
      if (
        !deps.requireAuth(
          t("auth.expand_plan"),
        )
      ) {
        return;
      }
      if (currentLimit >= 36) {
        toast.error(t("toast.plan_limit"));
        return;
      }
      if (!userData || (userData as any).credits <= 0) {
        toast.error(t("toast.daily_limit"));
        return;
      }
      try {
        await deps.consumeTokenMutation({ type: "expand" });
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
        if (!lockedIds || lockedIds.length === 0) return true;
        return lockedIds.includes(c.id);
      });

      if (activeCourses.length === 0) {
        toast.error(t("toast.no_courses"));
        return;
      }

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
          .slice(0, 12);

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

  const handleSaveManualPlan = async (data: Course[] | Plan) => {
    if (Array.isArray(data) && data.length === 0) {
      const draftCombo = selectedCodes
        .map((code) => {
          const variations = courses.filter((c) => c.code === code);
          const lockedIds = lockedCourses[code] || [];
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

  return {
    courses,
    setCourses,
    selectedCodes,
    setSelectedCodes,
    lockedCourses,
    setLockedCourses,
    plans,
    setPlans,
    currentPlanIndex,
    setCurrentPlanIndex,
    viewSource,
    setViewSource,
    planLimit,
    setPlanLimit,
    maxDailySks,
    setMaxDailySks,
    isGenerating,
    isManualMode,
    setIsManualMode,
    isSaving,
    toggleCourse,
    handleDeleteCourse,
    handleAutoLoad,
    handleAddMultipleMasterCourses,
    handleGenerate,
    handleSaveManualPlan,
    handleUpdateManualPlan,
  };
}
