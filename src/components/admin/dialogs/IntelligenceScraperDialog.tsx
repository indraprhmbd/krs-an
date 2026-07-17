import { useState } from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";

interface IntelligenceScraperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IntelligenceScraperDialog({
  isOpen,
  onClose,
}: IntelligenceScraperDialogProps) {
  const { getToken } = useAuth();
  const convex = useConvex(); // Access to imperative Convex calls
  const bulkImport = useMutation(api.admin.bulkImportMaster);
  const saveCache = useMutation(api.ai.saveScraperCache);

  const [scraperMode, setScraperMode] = useState<"ai" | "manual">("manual");
  const [rawText, setRawText] = useState("");
  const [isAiCleaning, setIsAiCleaning] = useState(false);

  // Helper: SHA-256 Hash
  const computeHash = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleManualParse = async () => {
    if (!rawText.trim()) return;
    setIsAiCleaning(true);
    try {
      const dayMap: Record<string, string> = {
        senin: "Mon",
        selasa: "Tue",
        rabu: "Wed",
        kamis: "Thu",
        jumat: "Fri",
        sabtu: "Sat",
        minggu: "Sun",
      };

      const parseSchedule = (scheduleRaw: string) => {
        if (!scheduleRaw) return [];
        return scheduleRaw
          .split(";")
          .map((s: string) => {
            const match = s
              .trim()
              .match(/(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            if (match) {
              let day = match[1].toLowerCase();
              for (const [indo, eng] of Object.entries(dayMap)) {
                if (day.startsWith(indo)) {
                  day = eng;
                  break;
                }
              }
              return {
                day:
                  day.length > 3
                    ? day.charAt(0).toUpperCase() +
                      day.slice(1, 3).toLowerCase()
                    : day,
                start: match[2],
                end: match[3],
              };
            }
            return null;
          })
          .filter(Boolean);
      };

      const lines = rawText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);
      const data: any[] = [];
      let currentCourse: any = null;

      for (const line of lines) {
        const cols = line.split("\t").map((c) => c.trim());

        // A "Main Line" typically has many tabs (columns)
        // We expect: Prodi, Kode, Nama, Kelas, SKS, Jml, Jadwal, Ruang (8 cols)
        // Or sometimes 7 cols if missing one.
        if (cols.length >= 6) {
          // If we have a pending course, push it first
          if (currentCourse) {
            data.push(currentCourse);
          }

          let prodi = "";
          let code = "";
          let name = "";
          let className = "";
          let sks = 0;
          let scheduleRaw = "";
          let room = "";

          if (cols.length >= 8) {
            prodi = cols[0];
            code = cols[1];
            name = cols[2];
            className = cols[3];
            sks = parseInt(cols[4]) || 0;
            scheduleRaw = cols[6] || "";
            room = cols[7] || "-";
          } else if (cols.length >= 7) {
            // Check if first column is "PRODI CODE" (space-separated)
            const firstColParts = cols[0].split(/\s+/);
            if (
              firstColParts.length >= 2 &&
              /^\d+$/.test(firstColParts[firstColParts.length - 1])
            ) {
              code = firstColParts.pop() || "";
              prodi = firstColParts.join(" ");
              name = cols[1];
              className = cols[2];
              sks = parseInt(cols[3]) || 0;
              scheduleRaw = cols[5] || "";
              room = cols[6] || "-";
            } else {
              prodi = cols[0];
              code = cols[1];
              name = cols[2];
              className = cols[3];
              sks = parseInt(cols[4]) || 0;
              scheduleRaw = cols[5] || "";
              room = cols[6] || "-";
            }
          } else {
            // Fallback for 6 columns or other
            prodi = "General";
            code = cols[0];
            name = cols[1];
            className = cols[2];
            sks = parseInt(cols[3]) || 0;
            scheduleRaw = cols[4] || "";
            room = cols[5] || "-";
          }

          currentCourse = {
            code,
            name,
            sks,
            prodi: (prodi || "General").toUpperCase().trim().replace(/\.$/, ""),
            class: className,
            lecturer: "-",
            room,
            schedule: parseSchedule(scheduleRaw),
          };
        } else if (currentCourse) {
          // Lecturer line or "(tidak ada dosen)"
          const lecturerInfo = line.trim();
          if (lecturerInfo) {
            if (currentCourse.lecturer === "-") {
              currentCourse.lecturer = lecturerInfo;
            } else {
              currentCourse.lecturer += ", " + lecturerInfo;
            }
          }
        }
      }

      // Don't forget the last one
      if (currentCourse) {
        data.push(currentCourse);
      }

      if (data.length === 0) throw new Error("No valid data found.");

      await bulkImport({ courses: data });
      toast.success(
        `Successfully parsed and deployed ${data.length} components.`,
      );
      setRawText("");
      onClose();
    } catch (err: any) {
      toast.error("Parsing failed: " + err.message);
    } finally {
      setIsAiCleaning(false);
    }
  };

  const handleAiCleanup = async () => {
    if (!rawText.trim()) return;
    setIsAiCleaning(true);
    try {
      // 1. Check Cache
      const hash = await computeHash(rawText.trim());
      const cachedResponse = await convex.query(api.ai.checkScraperCache, {
        hash,
      });

      let data;

      if (cachedResponse) {
        data = cachedResponse;
        toast.info("Using cached AI result.");
      } else {
        // 2. Fetch if not cached
        const clerkToken = await getToken();
        const baseUrl = import.meta.env.VITE_AI_API_URL?.replace(/\/$/, "");
        const res = await fetch(`${baseUrl}/process-master-data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clerkToken}`,
          },
          body: JSON.stringify({ text: rawText }),
        });

        if (!res.ok) throw new Error("AI cleaning failed");
        data = await res.json();

        // 3. Save Cache
        await saveCache({ hash, response: data });
      }

      await bulkImport({ courses: data });
      toast.success(
        `AI successfully cleaned and deployed ${data.length} components.`,
      );
      setRawText("");
      onClose();
    } catch (err: any) {
      toast.error("Cleanup failed: " + err.message);
    } finally {
      setIsAiCleaning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="4xl">
        <DialogHeader className="mb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-headline text-foreground italic flex items-center gap-3">
                <Icon name="sparkles" size={24} className="text-primary" />
                Intelligence Scraper
              </DialogTitle>
              <DialogDescription className="text-caps font-mono text-muted-foreground uppercase pt-2">
                Architect your database from raw terminal data or pasted sheets.
              </DialogDescription>
            </div>
            <div className="flex bg-muted p-1 rounded-xl">
              <Button
                variant={scraperMode === "manual" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setScraperMode("manual")}
                className={`rounded-lg font-mono text-caps uppercase px-4 ${scraperMode === "manual" ? "bg-card" : ""}`}
              >
                Manual Core
              </Button>
              <Button
                variant={scraperMode === "ai" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setScraperMode("ai")}
                className={`rounded-lg font-mono text-caps uppercase px-4 ${scraperMode === "ai" ? "bg-card" : ""}`}
              >
                AI Architect
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative group">
            <Textarea
              value={rawText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRawText(e.target.value)
              }
              placeholder={
                scraperMode === "manual"
                  ? "Manual Format (Tab Separated):\nProdi [TAB] Kode [TAB] Nama [TAB] Kelas [TAB] SKS [TAB] Kapasitas [TAB] Jadwal [TAB] Ruang\n\nExample:\nTeknik Pertambangan\tESDC\tESDC\tA\t2\t40\tSenin 07:00-09:00\tAL-C-D-1\nDr. Jane Doe (Lecturer on new line)"
                  : "Paste messy schedule text here... AI will analyze and structure it automatically."
              }
              className="min-h-[350px] bg-muted rounded-control p-4 font-mono text-caption focus-visible:ring-ring transition-all group-focus-within:bg-card"
            />
            {scraperMode === "manual" && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const template =
                      "PRODI\tKODE\tNAMA\tKELAS\tSKS\tJUMLAH\tSENIN 07:00-09:00\tRUANG\nNAMA DOSEN";
                    navigator.clipboard.writeText(template);
                    toast.success("Structure template copied to clipboard");
                  }}
                  className="h-7 px-3 text-caps font-mono uppercase text-muted-foreground hover:text-primary hover:bg-muted"
                >
                  <Icon name="copy" size={12} className="mr-2" />
                  Copy Template
                </Button>
              </div>
            )}
          </div>

          <div
            className={`p-3 rounded-control border transition-colors ${scraperMode === "manual" ? "bg-muted border-border" : "bg-muted/50 border-border"}`}
          >
            <div className="flex gap-4 items-start">
              <Icon
                name="alert"
                size={20}
                className={`flex-shrink-0 mt-0.5 ${scraperMode === "manual" ? "text-muted-foreground" : "text-primary"}`}
              />
              <div className="space-y-2">
                <p className="text-caps uppercase text-foreground">
                  {scraperMode === "manual"
                    ? "Deterministic Core Mode"
                    : "AI Intelligence Mode"}
                </p>
                <p
                  className={`text-caption ${scraperMode === "manual" ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {scraperMode === "manual"
                    ? "Directly maps columns from Tab-Separated values (Excel/CSV). Handles empty columns automatically. This method is 100% accurate if your format follows the template."
                    : "Uses Gemini AI to extract structured records from unstructured text. Best for messy portal copies. May require human verification after deployment."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-caps uppercase text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={
              scraperMode === "manual" ? handleManualParse : handleAiCleanup
            }
            disabled={isAiCleaning || !rawText.trim()}
            className="bg-primary hover:opacity-90 text-primary-foreground font-medium px-8 rounded-control min-w-[180px] transition-all"
          >
            {isAiCleaning ? (
              <>
                <Icon name="spinner" className="mr-2 animate-spin" />
                {scraperMode === "manual" ? "Parsing..." : "Architecting..."}
              </>
            ) : (
              <>
                {scraperMode === "manual"
                  ? "Execute Manual Sync"
                  : "Execute AI Deployment"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
