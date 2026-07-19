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
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";
import { useProdiOptions } from "../hooks/useProdiOptions";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { parseUgmBlockFormat } from "@/lib/parsers/ugmBlockParser";

interface UgmFormatImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE = `5	TKF210058  Penerapan Mikroprosesor
  Kelas: FA	2	0		1. Prof. Nazrul Effendy, S.T., MT.,Ph.D.	Rabu, 13:00-14:40`;

export function UgmFormatImportDialog({
  isOpen,
  onClose,
}: UgmFormatImportDialogProps) {
  const bulkImport = useMutation(api.admin.bulkImportMaster);
  const addProdiOption = useMutation(api.admin.addProdiOption);
  const { prodiOptions } = useProdiOptions();

  const [prodi, setProdi] = useLocalStorage("admin-ugm-import-prodi", "");
  const [rawText, setRawText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    const trimmedProdi = prodi.trim();
    if (!trimmedProdi || !rawText.trim()) return;
    setIsImporting(true);
    try {
      const normalizedProdi = trimmedProdi
        .toUpperCase()
        .trim()
        .replace(/\.$/, "");

      const exists = prodiOptions.some((p) => p.name === normalizedProdi);
      if (!exists) {
        try {
          await addProdiOption({ name: normalizedProdi, university: "UGM" });
        } catch {
          // Already exists (race) -- fine, proceed with import either way.
        }
      }

      const data = parseUgmBlockFormat(rawText, normalizedProdi);
      if (data.length === 0) throw new Error("Tidak ada data valid ditemukan.");

      await bulkImport({ courses: data });
      toast.success(
        `Berhasil impor ${data.length} kelas ke ${normalizedProdi}.`,
      );
      setRawText("");
      onClose();
    } catch (err: any) {
      toast.error("Impor gagal: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="4xl">
        <DialogHeader className="mb-6">
          <div className="space-y-1">
            <DialogTitle className="text-headline text-foreground italic flex items-center gap-3">
              <Icon name="database" size={24} className="text-primary" />
              UGM Format Importer
            </DialogTitle>
            <DialogDescription className="text-caps font-mono text-muted-foreground uppercase pt-2">
              Parses UGM's multi-line block export (one course per block, numbered
              lecturers, trailing schedule).
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Target Prodi</Label>
            <Input
              list="ugm-prodi-suggestions"
              value={prodi}
              onChange={(e) => setProdi(e.target.value)}
              placeholder="mis. TEKNIK FISIKA"
              className="h-10 rounded-control border-border bg-muted"
            />
            <datalist id="ugm-prodi-suggestions">
              {prodiOptions.map((p) => (
                <option key={p._id} value={p.name} />
              ))}
            </datalist>
            <p className="text-caption text-muted-foreground">
              Prodi baru otomatis ditambahkan ke daftar jika belum ada.
            </p>
          </div>

          <div className="relative group">
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Tempel data mentah UGM di sini..."
              className="min-h-[350px] bg-muted rounded-control p-4 font-mono text-caption focus-visible:ring-ring transition-all group-focus-within:bg-card"
            />
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(TEMPLATE);
                  toast.success("Contoh format disalin");
                }}
                className="h-7 px-3 text-caps font-mono uppercase text-muted-foreground hover:text-primary hover:bg-muted"
              >
                <Icon name="copy" size={12} className="mr-2" />
                Copy Example
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-control border border-border bg-muted">
            <div className="flex gap-4 items-start">
              <Icon
                name="alert"
                size={20}
                className="flex-shrink-0 mt-0.5 text-muted-foreground"
              />
              <p className="text-caption text-muted-foreground">
                Setiap kelas jadi satu blok multi-baris: baris pertama "kode
                nama", lalu "Kelas: X" berisi SKS dan dosen bernomor. Kelas
                tanpa jadwal (mis. Kerja Praktek) tetap masuk tanpa jadwal.
              </p>
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
            onClick={handleImport}
            disabled={isImporting || !rawText.trim() || !prodi.trim()}
            className="bg-primary hover:opacity-90 text-primary-foreground font-medium px-8 rounded-control min-w-[180px] transition-all"
          >
            {isImporting ? (
              <>
                <Icon name="spinner" className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Execute Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
