import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Single owner of the maker's flow step and the state that used to cross
 * component boundaries through side channels.
 *
 * Before this, `step` was prop-drilled App -> Navbar and App -> ScheduleMaker
 * with a dual `externalStep || internalStep` fallback in ScheduleMaker and a
 * `lastArchitectStep` shadow copy in App just to remember where to return
 * after visiting the archive. The tutorial trigger crossed the same
 * Navbar->ScheduleMaker boundary via `window.dispatchEvent`/`addEventListener`
 * -- a global event for something the props already reached. Both are gone;
 * this context is the one place `step` lives, and `requestTutorial()`
 * replaces the window event.
 */

export type MakerStep = "config" | "select" | "view" | "archive";
type ArchitectStep = "config" | "select" | "view";

interface SessionContextValue {
  step: MakerStep;
  setStep: (step: MakerStep) => void;
  /** The last non-archive step, so the Navbar's Architect toggle can return
   * to where the user left off rather than always resetting to config. */
  lastArchitectStep: ArchitectStep;
  restoreArchitectStep: () => void;

  /** Bumped by requestTutorial(); ScheduleMaker watches it to start the
   * walkthrough. A counter (not a boolean) so re-requesting while already
   * active still re-triggers. */
  tutorialRequestId: number;
  requestTutorial: () => void;

  isMasterSearchOpen: boolean;
  setIsMasterSearchOpen: (open: boolean) => void;
  isSmartDialogOpen: boolean;
  setIsSmartDialogOpen: (open: boolean) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (open: boolean) => void;
  activeShareId: string | null;
  activeSharePlanName: string;
  openShareDialog: (shareId: string, planName: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [step, setStepState] = useState<MakerStep>("config");
  const [lastArchitectStep, setLastArchitectStep] =
    useState<ArchitectStep>("config");

  const setStep = useCallback((next: MakerStep) => {
    setStepState(next);
    if (next !== "archive") setLastArchitectStep(next);
  }, []);

  const restoreArchitectStep = useCallback(() => {
    setStepState(lastArchitectStep);
  }, [lastArchitectStep]);

  const [tutorialRequestId, setTutorialRequestId] = useState(0);
  const requestTutorial = useCallback(() => {
    setTutorialRequestId((n) => n + 1);
  }, []);

  const [isMasterSearchOpen, setIsMasterSearchOpen] = useState(false);
  const [isSmartDialogOpen, setIsSmartDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [activeSharePlanName, setActiveSharePlanName] = useState("");

  const openShareDialog = useCallback((shareId: string, planName: string) => {
    setActiveShareId(shareId);
    setActiveSharePlanName(planName);
    setIsShareDialogOpen(true);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      step,
      setStep,
      lastArchitectStep,
      restoreArchitectStep,
      tutorialRequestId,
      requestTutorial,
      isMasterSearchOpen,
      setIsMasterSearchOpen,
      isSmartDialogOpen,
      setIsSmartDialogOpen,
      isShareDialogOpen,
      setIsShareDialogOpen,
      activeShareId,
      activeSharePlanName,
      openShareDialog,
    }),
    [
      step,
      setStep,
      lastArchitectStep,
      restoreArchitectStep,
      tutorialRequestId,
      requestTutorial,
      isMasterSearchOpen,
      isSmartDialogOpen,
      isShareDialogOpen,
      activeShareId,
      activeSharePlanName,
      openShareDialog,
    ],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
