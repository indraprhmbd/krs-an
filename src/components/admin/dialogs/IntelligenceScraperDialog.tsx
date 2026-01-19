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
import { Wand2, Copy, Loader2, AlertCircle } from "lucide-react";
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
  // Safe access to ai.saveCache if it exists, otherwise use bulkImport as a valid mutation reference
  // (unlikely to be called if ai.saveCache is missing, but keeps hook valid)
  const saveCache = useMutation(
    (api as any).ai?.saveCache || api.admin.bulkImportMaster,
  );

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
      const blocks = rawText.trim().split(/\n\s*\n/);
      const data: any[] = [];

      blocks.forEach((block) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l);
        if (lines.length < 1) return;

        const mainLine = lines[0];
        const lecturer = lines[1] || "-";
        const cols = mainLine.split("\t").map((c) => c.trim());
        if (cols.length < 6) return;

        let prodi, code, name, className, sks, scheduleRaw, room;

        if (cols.length >= 8) {
          prodi = cols[0] || "General";
          code = cols[1] || "N/A";
          name = cols[2] || "Untitled";
          className = cols[3] || "-";
          sks = parseInt(cols[4]) || 0;
          scheduleRaw = cols[6] || "";
          room = cols[7] || "-";
        } else {
          prodi = "General";
          code = cols[0] || "N/A";
          name = cols[1] || "Untitled";
          className = cols[2] || "-";
          sks = parseInt(cols[3]) || 0;
          scheduleRaw = cols[5] || "";
          room = cols[6] || "-";
        }

        const dayMap: Record<string, string> = {
          senin: "Mon",
          selasa: "Tue",
          rabu: "Wed",
          kamis: "Thu",
          jumat: "Fri",
          sabtu: "Sat",
          minggu: "Sun",
        };

        const scheduleParts = scheduleRaw
          ? scheduleRaw
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
              .filter(Boolean)
          : [];

        data.push({
          code,
          name,
          sks,
          prodi: (prodi || "General").toUpperCase().trim().replace(/\.$/, ""),
          class: className,
          lecturer,
          room,
          schedule: scheduleParts,
        });
      });

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
      const checkCacheFunc = (api as any).ai?.checkCache;
      const cachedResponse = checkCacheFunc
        ? await convex.query(checkCacheFunc, { hash })
        : null;

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
      <DialogContent className="max-w-4xl bg-white rounded-3xl p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-display font-bold text-slate-900 italic flex items-center gap-3">
                <Wand2 className="w-6 h-6 text-blue-700" />
                Intelligence Scraper
              </DialogTitle>
              <DialogDescription className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pt-2">
                Architect your database from raw terminal data or pasted sheets.
              </DialogDescription>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <Button
                variant={scraperMode === "manual" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setScraperMode("manual")}
                className={`rounded-lg font-mono text-[9px] uppercase tracking-wider px-4 ${scraperMode === "manual" ? "bg-white shadow-sm" : ""}`}
              >
                Manual Core
              </Button>
              <Button
                variant={scraperMode === "ai" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setScraperMode("ai")}
                className={`rounded-lg font-mono text-[9px] uppercase tracking-wider px-4 ${scraperMode === "ai" ? "bg-white shadow-sm" : ""}`}
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
              className="min-h-[350px] bg-slate-50 border-none rounded-2xl p-6 font-mono text-xs leading-relaxed focus-visible:ring-blue-700 transition-all group-focus-within:bg-white group-focus-within:shadow-inner"
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
                  className="h-7 px-3 text-[9px] font-mono uppercase tracking-widest text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy Template
                </Button>
              </div>
            )}
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${scraperMode === "manual" ? "bg-slate-50 border-slate-100" : "bg-blue-50/50 border-blue-50"}`}
          >
            <div className="flex gap-4 items-start">
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${scraperMode === "manual" ? "text-slate-400" : "text-blue-700"}`}
              />
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-tight text-slate-900">
                  {scraperMode === "manual"
                    ? "Deterministic Core Mode"
                    : "AI Intelligence Mode"}
                </p>
                <p
                  className={`text-[10px] leading-relaxed ${scraperMode === "manual" ? "text-slate-500" : "text-blue-900"}`}
                >
                  {scraperMode === "manual"
                    ? "Directly maps columns from Tab-Separated values (Excel/CSV). Handles empty columns automatically. This method is 100% accurate if your format follows the template."
                    : "Uses Gemini AI to extract structured records from unstructured text. Best for messy portal copies. May require human verification after deployment."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
          >
            Cancel
          </Button>
          <Button
            onClick={
              scraperMode === "manual" ? handleManualParse : handleAiCleanup
            }
            disabled={isAiCleaning || !rawText.trim()}
            className={`${scraperMode === "manual" ? "bg-slate-900 shadow-slate-200" : "bg-blue-700 shadow-blue-100"} hover:opacity-90 text-white font-display font-medium px-8 rounded-xl shadow-lg min-w-[180px] transition-all`}
          >
            {isAiCleaning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
