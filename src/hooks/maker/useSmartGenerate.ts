import { useAction, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

/**
 * AI generation: cooldown display, the pre-flight checks (selection, credits,
 * rate limit) that a disabled button attribute alone would not enforce, and
 * the run itself. Split out of ScheduleMaker so the credit-spending path can
 * be read and reasoned about on its own.
 */

interface UseSmartGenerateArgs {
  t: (key: string, vars?: Record<string, string | number>) => string;
  userData?: { credits: number; lastSmartGenerateTime?: number };
  selectedCodes: string[];
  courses: unknown[];
  maxSks: number;
  requireAuth: (reason: string) => boolean;
  setIsSmartDialogOpen: (open: boolean) => void;
  setMaxDailySks: (n: number) => void;
  setStep: (step: "config" | "select" | "view" | "archive") => void;
}

export function useSmartGenerate({
  t,
  userData,
  selectedCodes,
  courses,
  maxSks,
  requireAuth,
  setIsSmartDialogOpen,
  setMaxDailySks,
  setStep,
}: UseSmartGenerateArgs) {
  const smartGenerateAction = useAction(api.ai.smartGenerate);
  const updatePreferencesMutation = useMutation(api.users.updatePreferences);
  const [isSmartGenerating, setIsSmartGenerating] = useState(false);

  // Reading Date.now() directly during render is impure (React may re-run a
  // render without re-executing effects, so the value can go stale or drift
  // from what an effect-driven clock would show). Track "now" as state,
  // ticking once a second only while a cooldown is actually running -- this
  // also fixes a latent bug where the countdown display never actively
  // ticked before, only updating when something else happened to re-render.
  const [now, setNow] = useState(() => Date.now());
  const cooldownMs = 30000;
  const cooldownEndsAt = userData?.lastSmartGenerateTime
    ? userData.lastSmartGenerateTime + cooldownMs
    : 0;
  const cooldownActive = cooldownEndsAt > now;

  useEffect(() => {
    if (!cooldownActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [cooldownActive]);

  const cooldown = cooldownActive
    ? { active: true, seconds: Math.ceil((cooldownEndsAt - now) / 1000) }
    : { active: false, seconds: 0 };

  const onInitSmartGenerate = () => {
    if (
      !requireAuth(
        t("auth.smart_generate"),
      )
    ) {
      return;
    }

    // The button is disabled without a selection, but this is the guard that
    // matters: Smart Generate spends a credit and burns the 30s rate limit,
    // and a disabled attribute is not a check.
    if (selectedCodes.length === 0) {
      toast.error(t("toast.needs_courses"));
      return;
    }

    if (!userData || userData.credits <= 0) {
      toast.error(t("toast.no_credits"));
      return;
    }

    if (cooldown.active) {
      toast.error(t("toast.cooldown", { seconds: cooldown.seconds }));
      return;
    }

    setIsSmartGenerating(false);
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
    setMaxDailySks(preferences.maxDailySks);

    try {
      const { model, ...cleanPrefs } = preferences;

      const result = await smartGenerateAction({
        courses: courses as any,
        selectedCodes,
        maxSks,
        preferences: cleanPrefs as any,
        model: model,
      });

      await updatePreferencesMutation({ preferredAiModel: preferences.model });

      if (result.success) {
        toast.success(t("toast.ai_success", { count: result.count }));
        setIsSmartDialogOpen(false);
        setStep("archive");
      }
    } catch (err: any) {
      // Convex only forwards a thrown error's real message to the client when
      // it's a ConvexError (`err.data`); a plain Error gets redacted into an
      // opaque "[CONVEX A(...)] Server Error" wrapper in production. ai.ts's
      // user-facing throws are ConvexError for exactly this reason -- prefer
      // `data` and only fall back to `message` for something unexpected
      // (network failure, etc.) that never went through that path.
      const msg = (typeof err.data === "string" ? err.data : null) || err.message || "";
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

  return {
    isSmartGenerating,
    cooldown,
    onInitSmartGenerate,
    handleRunSmartGenerate,
  };
}
