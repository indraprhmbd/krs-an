import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Copy, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CurriculumImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurriculumImportDialog({
  isOpen,
  onClose,
}: CurriculumImportDialogProps) {
  const addCurriculum = useMutation(api.admin.addCurriculumItem);

  const [importProdi, setImportProdi] = useState("INFORMATIKA");
  const [importSemester, setImportSemester] = useState(2);
  const [curriculumRawText, setCurriculumRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleCurriculumBatchImport = async () => {
    if (!curriculumRawText.trim()) return;
    setIsImporting(true);
    try {
      const lines = curriculumRawText.trim().split("\n");
      let count = 0;
      for (const line of lines) {
        const cols = line.split("\t").map((c) => c.trim());
        if (cols.length < 3) continue;

        await addCurriculum({
          prodi: importProdi,
          semester: importSemester,
          term: importSemester % 2 === 0 ? "Even" : "Odd",
          code: cols[0],
          name: cols[1],
          sks: parseInt(cols[2]) || 0,
        });
        count++;
      }
      toast.success(
        `Successfully added ${count} items to ${importProdi} Sem ${importSemester}`,
      );
      setCurriculumRawText("");
      onClose();
    } catch (err: any) {
      toast.error("Import failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-white rounded-3xl p-8 border-none shadow-2xl">
        <DialogHeader className="mb-6">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-display font-bold text-slate-900 italic flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-700" />
              Curriculum Batch Importer
            </DialogTitle>
            <DialogDescription className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pt-2">
              Define mandatory courses for a specific semester profile.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Target Prodi
              </Label>
              <Input
                value={importProdi}
                onChange={(e) => setImportProdi(e.target.value.toUpperCase())}
                className="bg-slate-50 border-none rounded-xl h-10 text-sm"
                placeholder="e.g. INFORMATIKA"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Target Semester
              </Label>
              <Input
                type="number"
                min="1"
                max="8"
                value={importSemester}
                onChange={(e) => setImportSemester(parseInt(e.target.value))}
                className="bg-slate-50 border-none rounded-xl h-10 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-mono tracking-widest text-slate-400 italic">
              Course Data Block
            </Label>
            <div className="relative group">
              <Textarea
                value={curriculumRawText}
                onChange={(e) => setCurriculumRawText(e.target.value)}
                placeholder="Paste here: Kode [TAB] Nama [TAB] SKS\nExample:\n123210082	Statistika	3"
                className="min-h-[250px] bg-slate-50 border-none rounded-2xl p-6 font-mono text-xs leading-relaxed focus-visible:ring-blue-700 transition-all group-focus-within:bg-white group-focus-within:shadow-inner"
              />
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const template = "KODE\tNAMA MATKUL\tSKS";
                    navigator.clipboard.writeText(template);
                    toast.success("Curriculum template copied");
                  }}
                  className="h-7 px-3 text-[9px] font-mono uppercase tracking-widest text-slate-400 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Copy Format
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-700">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              <strong>Important:</strong> Pasting items will add them to the
              selection. If you want to replace existing data, remove the
              entries from the table first. Total SKS should be verified after
              import.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
          >
            Discard
          </Button>
          <Button
            onClick={handleCurriculumBatchImport}
            disabled={isImporting || !curriculumRawText.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-display font-medium px-8 rounded-xl shadow-lg shadow-blue-100 min-w-[200px]"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing Blueprint...
              </>
            ) : (
              "Sync to Blueprint"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
