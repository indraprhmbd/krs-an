import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { TutorialStep } from "@/hooks/useTutorial";

interface TutorialModalProps {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev?: () => void; // Added back navigation
  onSkip: () => void;
}

export function TutorialModal({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TutorialModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Animation trigger
    setIsOpen(true);
    return () => setIsOpen(false);
  }, [step]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop - Darker for focus */}
      <div
        // Same scrim as DialogOverlay. A scrim is neutral shade, not brand:
        // bg-primary/70 would wash the whole page blue.
        className="absolute inset-0 bg-foreground/40 transition-opacity duration-300 animate-in fade-in"
        onClick={onSkip} // Optional: click outside to skip? Maybe safer to not do that for tutorials.
      />

      {/* Modal Content */}
      <Card
        className={`
 relative w-full max-w-lg border border-border bg-card shadow-overlay rounded-card overflow-hidden
 transform transition-all duration-300 ease-out
 ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
 `}
      >
        {/* Media Container (16:9 Aspect Ratio) */}
        <div className="aspect-video w-full bg-muted relative overflow-hidden group">
          {step.image ? (
            step.image.endsWith(".mp4") ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={step.image} type="video/mp4" />
              </video>
            ) : (
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            // Placeholder pattern if no image
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="grid grid-cols-6 gap-2 opacity-5 scale-150">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full bg-foreground" />
                ))}
              </div>
            </div>
          )}

          {/* Close Button on top of image for cleaner look */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <Icon name="close" size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-title md:text-headline text-foreground tracking-tight">
              {step.title}
            </h2>
            <p className="text-body md:text-body text-muted-foreground">
              {step.description}
            </p>
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border mt-2">
            {/* Progress Indicators */}
            <div className="flex items-center gap-1.5 order-2 sm:order-1">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`
 h-1.5 rounded-full transition-all duration-300
 ${idx === currentStepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"}
 `}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              {/* Back Button (optional, only if not first step) */}
              {currentStepIndex > 0 && onPrev && (
                <Button
                  variant="ghost"
                  onClick={onPrev}
                  className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
                >
                  <Icon name="chevron-left" size={16} className="mr-1" />
                  Kembali
                </Button>
              )}

              <Button
                onClick={onNext}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary text-primary-foreground rounded-control px-6"
              >
                {currentStepIndex === totalSteps - 1 ? "Mulai" : "Lanjut"}
                {currentStepIndex !== totalSteps - 1 && (
                  <Icon name="chevron-right" size={16} className="ml-1.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>,
    document.body,
  );
}
