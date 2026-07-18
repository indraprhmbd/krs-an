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
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useProdiOptions } from "../hooks/useProdiOptions";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface CurriculumImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurriculumImportDialog({
  isOpen,
  onClose,
}: CurriculumImportDialogProps) {
  const addCurriculum = useMutation(api.admin.addCurriculumItem);

  const [importProdi, setImportProdi] = useLocalStorage(
    "admin-curriculum-import-prodi",
    "INFORMATIKA",
  );
  const [importSemester, setImportSemester] = useLocalStorage(
    "admin-curriculum-import-semester",
    2,
  );
  const [curriculumRawText, setCurriculumRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const { prodiOptions } = useProdiOptions();
  const prodis = [...prodiOptions]
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b));

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
          code: cols[0],
          name: cols[1],
          sks: parseInt(cols[2]) || 0,
        });
        count++;
      }
      toast.success(
        `Berhasil menambah ${count} item ke ${importProdi} Sem ${importSemester}`,
      );
      setCurriculumRawText("");
      onClose();
    } catch (err: any) {
      toast.error("Impor gagal: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="3xl" className="custom-scrollbar">
        <DialogHeader className="mb-6">
          <div className="space-y-1">
            <DialogTitle className="text-headline text-foreground italic flex items-center gap-3">
              <Icon name="database" className="text-primary" size={24} />
              Curriculum Batch Importer
            </DialogTitle>
            <DialogDescription className="text-caps font-mono text-muted-foreground uppercase pt-2">
              Define mandatory courses for a specific semester profile.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Target Prodi
              </Label>
              <Select value={importProdi} onValueChange={setImportProdi}>
                <SelectTrigger className="bg-muted rounded-control h-10">
                  <SelectValue placeholder="Select Prodi" />
                </SelectTrigger>
                <SelectContent className="rounded-control border-border shadow-card">
                  {prodis.map((p) => (
                    <SelectItem key={p} value={p} className="text-caption font-mono">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Target Semester
              </Label>
              <Select
                value={importSemester.toString()}
                onValueChange={(val) => setImportSemester(parseInt(val))}
              >
                <SelectTrigger className="bg-muted rounded-control h-10">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent className="rounded-control border-border shadow-card">
                  {/* All 8, deliberately: an admin imports next term's
                      curriculum before that term starts. Not validSemesters(). */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem
                      key={s}
                      value={s.toString()}
                      className="text-caption font-mono"
                    >
                      SEMESTER {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground italic">
              Course Data Block
            </Label>
            <div className="relative group">
              <Textarea
                value={curriculumRawText}
                onChange={(e) => setCurriculumRawText(e.target.value)}
                placeholder="Paste here: Kode [TAB] Nama [TAB] SKS\nExample:\n123210082	Statistika	3"
                className="min-h-[250px] bg-muted rounded-card p-6 font-mono text-caption focus-visible:ring-ring transition-all group-focus-within:bg-card"
              />
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const template = "KODE\tNAMA MATKUL\tSKS";
                    navigator.clipboard.writeText(template);
                    toast.success("Template kurikulum disalin");
                  }}
                  className="h-7 px-3 text-caps font-mono uppercase text-muted-foreground hover:text-primary hover:bg-muted"
                >
                  <Icon name="copy" className="mr-2" size={12} />
                  Copy Format
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-control border border-border flex gap-3 text-foreground">
            <Icon name="alert" className="mt-0.5" />
            <p className="text-caption">
              <strong>Important:</strong> Pasting items will add them to the
              selection. If you want to replace existing data, remove the
              entries from the table first. Total SKS should be verified after
              import.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-caps uppercase text-muted-foreground"
          >
            Discard
          </Button>
          <Button
            onClick={handleCurriculumBatchImport}
            disabled={isImporting || !curriculumRawText.trim()}
            className="bg-primary text-primary-foreground font-medium px-8 rounded-control shadow-card min-w-[200px]"
          >
            {isImporting ? (
              <>
                <Icon name="spinner" className="mr-2 animate-spin" />
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
