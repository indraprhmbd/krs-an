import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";

interface CurriculumMasterPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  prodi: string;
  semester: number;
}

/**
 * Build a curriculum row by picking courses straight from master_courses,
 * instead of re-typing/pasting the same code+name+sks a second time via
 * Batch Import. Copies the "pick the course, not the section"
 * MasterCatalogDialog.tsx pattern -- curriculum has no class field at all,
 * so grouping by code fits even more directly here.
 */
export function CurriculumMasterPickerDialog({
  isOpen,
  onOpenChange,
  prodi,
  semester,
}: CurriculumMasterPickerDialogProps) {
  const allMasterCourses = useQuery(api.admin.listMasterCourses, { prodi });
  const currentCurriculum = useQuery(api.admin.listCurriculum, {
    prodi,
    semester,
  });
  const addCurriculumItems = useMutation(api.admin.addCurriculumItems);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingCodes = useMemo(
    () => new Set((currentCurriculum || []).map((c) => c.code)),
    [currentCurriculum],
  );

  const groupedCourses = useMemo(() => {
    if (!allMasterCourses) return [];

    const groups: Record<string, { code: string; name: string; sks: number }> =
      {};
    allMasterCourses.forEach((c: any) => {
      if (!groups[c.code]) {
        groups[c.code] = { code: c.code, name: c.name, sks: c.sks };
      }
    });

    return Object.values(groups).filter(
      (g) =>
        g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allMasterCourses, searchQuery]);

  const selectedSks = useMemo(() => {
    return groupedCourses
      .filter((g) => selectedCodes.has(g.code))
      .reduce((sum, g) => sum + g.sks, 0);
  }, [groupedCourses, selectedCodes]);

  const toggleCode = (code: string) => {
    if (existingCodes.has(code)) return;
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const handleAddSelected = async () => {
    const toAdd = groupedCourses.filter((g) => selectedCodes.has(g.code));
    if (toAdd.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await addCurriculumItems({
        prodi,
        semester,
        items: toAdd.map((g) => ({ code: g.code, name: g.name, sks: g.sks })),
      });
      toast.success(
        `${result.inserted} mata kuliah ditambahkan ke kurikulum` +
          (result.skipped > 0
            ? `, ${result.skipped} sudah ada dan dilewati.`
            : "."),
      );
      setSelectedCodes(new Set());
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Gagal menambah: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        size="2xl"
        className="flex h-[85vh] flex-col overflow-hidden"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-title text-foreground">
            <Icon name="database" size={18} className="text-primary" />
            Pilih dari Repositori Master
          </DialogTitle>
          <DialogDescription className="pt-1 text-caps uppercase text-muted-foreground">
            {prodi} | Semester {semester}
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-3 shrink-0">
          <Icon
            name="search"
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari kode atau nama matkul..."
            aria-label="Search master repository"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!allMasterCourses || allMasterCourses.length === 0}
            className="h-10 pl-9 text-caption"
          />
        </div>

        <DialogBody className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
          {groupedCourses.map((group) => {
            const isExisting = existingCodes.has(group.code);
            const isSelected = isExisting || selectedCodes.has(group.code);

            return (
              <button
                key={group.code}
                type="button"
                aria-pressed={isSelected}
                disabled={isExisting}
                onClick={() => toggleCode(group.code)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-card border p-3 text-left transition-colors",
                  isExisting
                    ? "cursor-not-allowed border-border bg-muted/50 opacity-60"
                    : isSelected
                      ? "border-primary bg-muted"
                      : "border-border bg-card hover:bg-accent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1 grid h-4 w-4 shrink-0 place-content-center rounded-sm border border-primary",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {isSelected && <Icon name="check" size={14} />}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-control border border-border bg-muted px-2 py-0.5 font-mono text-caption font-bold text-muted-foreground">
                      {group.code}
                    </span>
                    <Badge variant="outline" className="font-mono text-caption">
                      {group.sks} SKS
                    </Badge>
                    {isExisting && (
                      <Badge className="text-caption">Sudah di kurikulum</Badge>
                    )}
                  </div>
                  <h4 className="text-body font-bold text-foreground">
                    {group.name}
                  </h4>
                </div>
              </button>
            );
          })}

          {groupedCourses.length === 0 && (
            <div className="space-y-2 py-12 text-center">
              <Icon
                name="search"
                size={24}
                className="mx-auto text-muted-foreground"
              />
              <p className="font-mono text-caps uppercase text-muted-foreground">
                {searchQuery
                  ? `Tidak ada komponen yang cocok dengan "${searchQuery}"`
                  : "Belum ada mata kuliah untuk prodi ini"}
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="mt-3 flex w-full shrink-0 flex-col items-center justify-between gap-3 border-t border-border pt-3 sm:flex-row">
          <div className="flex items-center gap-2">
            {selectedCodes.size > 0 && (
              <>
                <Badge className="px-2 py-1 font-mono text-caption">
                  {selectedSks} SKS DIPILIH
                </Badge>
                <Badge
                  variant="outline"
                  className="px-2 py-1 font-mono text-caption"
                >
                  {selectedCodes.size} MATA KULIAH DIPILIH
                </Badge>
              </>
            )}
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-caps uppercase sm:flex-none"
            >
              Batal
            </Button>
            <Button
              disabled={selectedCodes.size === 0 || isSubmitting}
              onClick={handleAddSelected}
              className="flex-1 px-6 text-caps uppercase sm:flex-none"
            >
              {isSubmitting ? "Menambah..." : "Tambah"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
