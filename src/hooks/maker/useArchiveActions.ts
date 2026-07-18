import { toast } from "sonner";
import type { Plan } from "@/types";

interface UseArchiveActionsArgs {
  t: (key: string, vars?: Record<string, string | number>) => string;
  deletePlan: (planId: string) => Promise<void>;
  renamePlan: (planId: string, newName: string) => Promise<void>;
  setPlans: (plans: Plan[]) => void;
  setCurrentPlanIndex: (index: number) => void;
  setViewSource: (source: "live" | "archive") => void;
  setStep: (step: "config" | "select" | "view" | "archive") => void;
}

/** Delete / rename / import-to-viewer for a saved plan. */
export function useArchiveActions({
  t,
  deletePlan,
  renamePlan,
  setPlans,
  setCurrentPlanIndex,
  setViewSource,
  setStep,
}: UseArchiveActionsArgs) {
  const handleDeleteArchived = async (planId: string) => {
    try {
      await deletePlan(planId);
      toast.success(t("toast.plan_removed"));
    } catch (err: any) {
      toast.error(t("toast.delete_failed", { error: err.message }));
    }
  };

  const handleRenameArchived = async (planId: string, newName: string) => {
    try {
      await renamePlan(planId, newName);
      toast.success(t("toast.plan_renamed"));
    } catch (err: any) {
      toast.error(t("toast.rename_failed", { error: err.message }));
    }
  };

  const handleImportArchived = (allPlans: Plan[], index: number) => {
    setPlans(allPlans);
    setCurrentPlanIndex(index);
    setViewSource("archive");
    setStep("view");
    toast.info(t("toast.imported_to_viewer", { count: allPlans.length }));
  };

  return { handleDeleteArchived, handleRenameArchived, handleImportArchived };
}
