import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface UseSharePlanArgs {
  archived: any[] | undefined;
  requireAuth: (reason: string) => boolean;
  openShareDialog: (shareId: string, planName: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/** Share-link creation: needs a server-side plan row, so it is gated behind
 * auth (a local-only plan cannot be shared until it migrates on sign-in). */
export function useSharePlan({
  archived,
  requireAuth,
  openShareDialog,
  t,
}: UseSharePlanArgs) {
  const createShareLinkMutation = useMutation(api.plans.createShareLink);

  const handleSharePlan = async (planId: string) => {
    const plan = archived?.find((p) => (p as any)._id === planId);
    if (!plan) return;

    if (
      !requireAuth(
        t("auth.share_plan"),
      )
    ) {
      return;
    }

    if ((plan as any).shareId) {
      openShareDialog((plan as any).shareId, plan.name);
      return;
    }

    toast.promise(createShareLinkMutation({ planId: planId as any }), {
      loading: "Generating share link...",
      success: (id) => {
        openShareDialog(id, plan.name);
        return "Link generated!";
      },
      error: "Failed to generate link",
    });
  };

  return { handleSharePlan };
}
