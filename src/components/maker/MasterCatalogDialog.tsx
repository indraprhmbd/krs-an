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

interface MasterCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allMasterCourses: any[] | undefined;
  onAddCourses: (courses: any[]) => void;
}

export function MasterCatalogDialog({
  isOpen,
  onOpenChange,
  allMasterCourses,
  onAddCourses,
}: MasterCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // Selection is per course code, not per class/section -- picking a
  // specific class here in addition to picking one in the Select step's own
  // per-course selector was the same choice made twice ("double-picking").
  // Adding a code brings in every section; the student narrows it down to
  // one class later, same as curriculum auto-load already behaves.
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const groupedCourses = useMemo(() => {
    if (!allMasterCourses) return [];

    const groups: Record<
      string,
      {
        code: string;
        name: string;
        sks: number;
        prodi: string;
        classes: any[];
      }
    > = {};

    allMasterCourses.forEach((c) => {
      if (!groups[c.code]) {
        groups[c.code] = {
          code: c.code,
          name: c.name,
          sks: c.sks,
          prodi: c.prodi,
          classes: [],
        };
      }
      groups[c.code].classes.push(c);
    });

    return Object.values(groups).filter(
      (g) =>
        g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [allMasterCourses, searchQuery]);

  // Summed from allMasterCourses, not the search-filtered groupedCourses --
  // a code selected before typing a search that hides its group must still
  // count toward the total.
  const selectedSks = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    for (const c of allMasterCourses || []) {
      if (selectedCodes.has(c.code) && !seen.has(c.code)) {
        seen.add(c.code);
        total += c.sks;
      }
    }
    return total;
  }, [allMasterCourses, selectedCodes]);

  const toggleCode = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const handleAddSelected = () => {
    if (!allMasterCourses) return;
    const toAdd = allMasterCourses.filter((c) => selectedCodes.has(c.code));

    if (toAdd.length > 0) {
      onAddCourses(toAdd);
      setSelectedCodes(new Set());
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
            <Icon name="search" size={18} className="text-primary" />
            Katalog Master
          </DialogTitle>
          <DialogDescription className="pt-1 text-caps uppercase text-muted-foreground">
            Cari dan tambah mata kuliah dari database
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
            aria-label="Search master catalog"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!allMasterCourses || allMasterCourses.length === 0}
            className="h-10 pl-9 text-caption"
          />
        </div>

        <DialogBody className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
          {groupedCourses.map((group) => {
            const isSelected = selectedCodes.has(group.code);
            const lecturers = Array.from(
              new Set(group.classes.map((c) => c.lecturer || "Belum ada dosen")),
            );

            return (
              <button
                key={group.code}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleCode(group.code)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-card border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-muted"
                    : "border-border bg-card hover:bg-accent",
                )}
              >
                {/* Decorative only -- the outer button is the real control,
                    so this is a plain span, not the Checkbox primitive
                    (which renders its own <button> and cannot nest inside
                    one without breaking HTML validity). */}
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
                    <Badge variant="outline" className="text-caption">
                      {group.classes.length} kelas tersedia
                    </Badge>
                  </div>
                  <h4 className="text-body font-bold text-foreground">
                    {group.name}
                  </h4>
                  <p className="truncate text-caption text-muted-foreground">
                    {lecturers.join(", ")}
                  </p>
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
                  : "Belum ada mata kuliah"}
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
              disabled={selectedCodes.size === 0}
              onClick={handleAddSelected}
              className="flex-1 px-6 text-caps uppercase sm:flex-none"
            >
              Tambah
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
