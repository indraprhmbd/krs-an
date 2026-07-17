import { useCallback } from "react";
import { useClerk } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";

/**
 * Guard for the few actions that genuinely need an account.
 *
 * Most of the app is public: configuring, selecting courses and generating
 * schedules all run client-side and cost nothing to serve. Only three things
 * need an identity, and each is gated at its call site rather than by hiding
 * the whole app behind a login wall:
 *
 *   - sharing a plan   (needs a server-side row to link to)
 *   - Smart Generate   (spends a daily credit)
 *   - expanding the plan limit (spends a daily credit)
 *
 * Returns a predicate: true when the caller may proceed, false when a sign-in
 * prompt has been shown instead. Use it as an early return.
 *
 *   if (!requireAuth("Sign in to share this plan.")) return;
 */
export function useRequireAuth() {
  const { isAuthenticated } = useConvexAuth();
  const { openSignIn } = useClerk();

  return useCallback(
    (reason: string) => {
      if (isAuthenticated) return true;

      toast("Sign in required", {
        description: reason,
        action: {
          label: "Sign in",
          onClick: () => openSignIn(),
        },
      });
      return false;
    },
    [isAuthenticated, openSignIn],
  );
}
