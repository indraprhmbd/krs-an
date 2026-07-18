import { useState, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export interface TutorialStep {
  targetId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  image?: string; // Optional image/gif URL
}

interface UseTutorialProps {
  tutorialId: string; // Unique ID for this specific tutorial flow
  steps: TutorialStep[];
}

export function useTutorial({ tutorialId, steps }: UseTutorialProps) {
  // Persist if user has seen this specific tutorial
  const [hasSeenTutorial, setHasSeenTutorial] = useLocalStorage<boolean>(
    `has_seen_tutorial_${tutorialId}`,
    false,
  );

  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Auto-start temporarily disabled. Flip this back to `!hasSeenTutorial`
  // to re-enable the first-run onboarding walkthrough.
  const AUTO_START_DISABLED = true;

  useEffect(() => {
    if (AUTO_START_DISABLED) return;
    // Small delay to ensure UI is ready
    const timer = setTimeout(() => {
      if (!hasSeenTutorial) {
        setIsActive(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasSeenTutorial]);

  const startTutorial = () => {
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const endTutorial = () => {
    setIsActive(false);
    setHasSeenTutorial(true);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const skipTutorial = () => {
    endTutorial();
  };

  const resetTutorial = () => {
    setHasSeenTutorial(false);
    startTutorial();
  };

  return {
    isActive,
    currentStepIndex,
    currentStep: steps[currentStepIndex],
    totalSteps: steps.length,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    resetTutorial,
    hasSeenTutorial, // expose if needed for UI badges etc
  };
}
