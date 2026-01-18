import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Check, Info, Zap, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import type { Course } from "@/types";
import { Textarea } from "@/components/ui/textarea";

interface SmartGenerateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  selectedCodes: string[];
  onGenerate: (preferences: {
    preferredLecturers: string[];
    preferredDaysOff: string[];
    customInstructions: string;
    model: string;
  }) => void;
  isGenerating: boolean;
  cooldown?: { active: boolean; seconds: number };
}

export function SmartGenerateDialog({
  isOpen,
  onOpenChange,
  courses,
  selectedCodes,
  onGenerate,
  isGenerating,
  cooldown,
}: SmartGenerateDialogProps) {
  const [preferredLecturers, setPreferredLecturers] = useState<string[]>([]);
  const [preferredDaysOff, setPreferredDaysOff] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [aiModel, setAiModel] = useState<"groq" | "gemini">("groq");

  // Sync state - Always force 'groq' for now as Gemini is unavailable
  useEffect(() => {
    setAiModel("groq");
  }, [isOpen]);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Extract unique lecturers from selected courses
  const getLecturers = () => {
    const lecturers = new Set<string>();
    courses
      .filter((c) => selectedCodes.includes(c.code))
      .forEach((c) => {
        if (c.lecturer) {
          // Robust parsing for lecturer names
          // 1. Split by comma (common separator)
          const rawNames = c.lecturer.split(",");

          rawNames.forEach((name) => {
            let cleanName = name.trim();
            // Remove potential extra spaces or weird characters if any
            cleanName = cleanName.replace(/\s+/g, " ");

            if (cleanName.length > 2 && !cleanName.match(/^\d+$/)) {
              // Filter out very short strings or purely numeric artifacts
              lecturers.add(cleanName);
            }
          });
        }
      });
    return Array.from(lecturers).sort();
  };

  const uniqueLecturers = getLecturers();

  const toggleLecturer = (lecturer: string) => {
    setPreferredLecturers((prev) =>
      prev.includes(lecturer)
        ? prev.filter((l) => l !== lecturer)
        : [...prev, lecturer],
    );
  };

  const toggleDay = (day: string) => {
    setPreferredDaysOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    onGenerate({
      preferredLecturers,
      preferredDaysOff,
      customInstructions,
      model: aiModel,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white rounded-3xl p-0 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              Smart Preferences
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Customize how AI should prioritize your schedule generation.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Section 1: Days Off */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900">
              Preferred Days Off
            </label>
            <p className="text-[10px] text-slate-500 -mt-2 mb-2">
              Select days you want to keep free (if possible).
            </p>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => {
                const isSelected = preferredDaysOff.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Lecturers */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900">
              Preferred Lecturers
            </label>
            <p className="text-[10px] text-slate-500 -mt-2 mb-2">
              Select lecturers you prefer. AI will prioritize classes taught by
              them.
            </p>
            <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-1">
              {uniqueLecturers.map((lecturer) => {
                const isSelected = preferredLecturers.includes(lecturer);
                return (
                  <Badge
                    key={lecturer}
                    variant="outline"
                    onClick={() => toggleLecturer(lecturer)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {lecturer}{" "}
                    {isSelected && <Check className="w-3 h-3 ml-1" />}
                  </Badge>
                );
              })}
              {uniqueLecturers.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No specific lecturers found in selection.
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Custom Instructions */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Additional Instructions
              <Info className="w-3 h-3 text-slate-400" />
            </label>
            <Textarea
              placeholder="e.g. Avoid 7 AM classes, Group classes together..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="resize-none h-20 text-xs bg-slate-50 border-slate-200 focus:ring-violet-500"
            />
          </div>

          {/* Section 4: AI Brain Switcher */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-900">AI Brain</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setAiModel("groq")}
                className={`cursor-pointer rounded-2xl border-2 p-3 transition-all ${
                  aiModel === "groq"
                    ? "border-orange-500 bg-orange-50/50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap
                    className={`w-4 h-4 ${aiModel === "groq" ? "text-orange-600" : "text-slate-400"}`}
                  />
                  <span
                    className={`text-xs font-bold ${aiModel === "groq" ? "text-orange-900" : "text-slate-600"}`}
                  >
                    Groq (LPU)
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 leading-tight">
                  Ultra fast reasoning. Best for quick variations. (Llama 3.3)
                </p>
              </div>

              <div
                className={`rounded-2xl border-2 p-3 transition-all border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed group relative`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-400 line-through">
                    Gemini (Flash)
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[8px] px-1 py-0 h-3 border-slate-300 text-slate-500"
                  >
                    UNAVAILABLE
                  </Badge>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">
                  Gemini API is currently down or restricted.
                </p>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded">
                    NOT AVAILABLE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-100 bg-white">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating || cooldown?.active}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-100 font-bold min-w-[140px]"
          >
            {isGenerating
              ? "Reasoning..."
              : cooldown?.active
                ? `Wait ${cooldown.seconds}s`
                : "Generate with AI (1 Token)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
