import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
    maxDailySks: number;
  }) => void;
  isGenerating: boolean;
  cooldown?: { active: boolean; seconds: number };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const SKS_PRESETS = [4, 8, 12, 18, 24];

/**
 * A selectable chip. Was a div with onClick in three places, which is not
 * reachable by keyboard and reports no state to a screen reader.
 */
function ToggleChip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 rounded-control border px-3 py-1.5 text-caption font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

/** One labelled block. Every section repeated this heading + hint shape. */
function Field({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body font-bold text-foreground">{label}</span>
        {action}
      </div>
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
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
  const [maxDailySks, setMaxDailySks] = useState(8);

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
      // Groq is the only engine. The picker that used to set this had one
      // selectable option and a permanently disabled Gemini card.
      model: "groq",
      maxDailySks,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        padded={false}
        className="flex flex-col overflow-hidden"
      >
        <DialogHeader className="border-b border-border bg-muted p-4">
          <DialogTitle className="flex items-center gap-2 text-title text-foreground">
            <Icon name="sparkles" size={18} className="text-primary" />
            Preferensi AI
          </DialogTitle>
          <DialogDescription className="text-caption text-muted-foreground">
            Atur preferensi biar AI nyusun jadwal sesuai keinginanmu.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-4">
          <Field
            label="Hari Libur"
            hint="Pilih hari yang pengen kamu kosongin, kalo memungkinkan."
          >
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <ToggleChip
                  key={day}
                  selected={preferredDaysOff.includes(day)}
                  onToggle={() => toggleDay(day)}
                >
                  {day}
                </ToggleChip>
              ))}
            </div>
          </Field>

          <Field
            label="Dosen Favorit"
            hint="AI bakal prioritasi kelas yang dosennya kamu pilih."
          >
            <div className="flex max-h-[150px] flex-wrap gap-2 overflow-y-auto p-1">
              {uniqueLecturers.map((lecturer) => {
                const isSelected = preferredLecturers.includes(lecturer);
                return (
                  <ToggleChip
                    key={lecturer}
                    selected={isSelected}
                    onToggle={() => toggleLecturer(lecturer)}
                  >
                    {lecturer}
                    {isSelected && <Icon name="check" size={12} />}
                  </ToggleChip>
                );
              })}
              {uniqueLecturers.length === 0 && (
                <p className="text-caption italic text-muted-foreground">
                  Belum ada dosen terpilih.
                </p>
              )}
            </div>
          </Field>

          <Field
            label="Instruksi Tambahan"
            hint="Tulis bebas, AI baca ini sama preferensi di atas."
          >
            <Textarea
              placeholder="Misal: hindari kelas jam 7 pagi, kelompokkan jadwal..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="h-20 resize-none text-caption"
            />
          </Field>

          <Field
            label="Batas SKS Harian"
            hint="Maksimal beban SKS per hari. Standarnya 8."
            action={
              <Badge variant="secondary" className="font-mono font-bold">
                {maxDailySks >= 24 ? "UNLIMITED" : `${maxDailySks} SKS`}
              </Badge>
            }
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                aria-label="Daily SKS limit"
                value={maxDailySks}
                onChange={(e) => setMaxDailySks(parseInt(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-control bg-muted accent-primary"
              />
              <div className="flex gap-1">
                {SKS_PRESETS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMaxDailySks(v)}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-control border text-caption font-bold transition-colors",
                      maxDailySks === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        </DialogBody>

        <DialogFooter className="gap-2 border-t border-border p-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating || cooldown?.active}
            className="min-w-[140px] font-bold"
          >
            {isGenerating ? (
              <>
                <Icon name="spinner" size={14} className="animate-spin" />
                Memproses...
              </>
            ) : cooldown?.active ? (
              `Tunggu ${cooldown.seconds}s`
            ) : (
              "Generate dengan AI (1 Token)"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
