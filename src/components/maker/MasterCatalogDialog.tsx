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
import { Checkbox } from "@/components/ui/checkbox";

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
  // Selection state: Set of master_course _ids
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(
    new Set(),
  );

  // Grouping logic
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

  const toggleClass = (id: string) => {
    const next = new Set(selectedClassIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedClassIds(next);
  };

  const toggleGroup = (classes: any[]) => {
    const next = new Set(selectedClassIds);
    const allIds = classes.map((c) => c._id);
    const allSelected = allIds.every((id) => next.has(id));

    if (allSelected) {
      // Unselect all
      allIds.forEach((id) => next.delete(id));
    } else {
      // Select all
      allIds.forEach((id) => next.add(id));
    }
    setSelectedClassIds(next);
  };

  const handleAddSelected = () => {
    if (!allMasterCourses) return;
    const toAdd = allMasterCourses.filter((c) => selectedClassIds.has(c._id));

    if (toAdd.length > 0) {
      onAddCourses(toAdd);
      // Reset state
      setSelectedClassIds(new Set());
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
          <DialogDescription className="pt-1 font-mono text-caps uppercase text-muted-foreground">
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
            className="h-10 pl-9 text-caption"
          />
        </div>

        <DialogBody className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
          {groupedCourses.map((group) => {
            const groupIds = group.classes.map((c) => c._id);
            const selectedCountInGroup = groupIds.filter((id) =>
              selectedClassIds.has(id),
            ).length;
            const isAnySelected = selectedCountInGroup > 0;
            const isAllSelected = selectedCountInGroup === groupIds.length;

            return (
              <div
                key={group.code}
                className={cn(
                  "rounded-card border p-3 transition-colors",
                  isAnySelected
                    ? "border-primary bg-muted"
                    : "border-border bg-card",
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    aria-label={`Select all classes for ${group.code}`}
                    checked={
                      isAllSelected || (isAnySelected ? "indeterminate" : false)
                    }
                    onCheckedChange={() => toggleGroup(group.classes)}
                  />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-control border border-border bg-muted px-2 py-0.5 font-mono text-caption font-bold text-muted-foreground">
                          {group.code}
                        </span>
                        <Badge variant="outline" className="font-mono text-caption">
                          {group.sks} SKS
                        </Badge>
                        {isAnySelected && (
                          <Badge className="h-4 px-1.5 text-grid font-bold">
                            {selectedCountInGroup} DIPILIH
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-body font-bold text-foreground">
                        {group.name}
                      </h4>
                    </div>

                    {/* Class Selector Row */}
                    <div className="grid w-full grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                      {group.classes.map((cls) => {
                        const isClsSelected = selectedClassIds.has(cls._id);
                        return (
                          <button
                            key={cls._id}
                            type="button"
                            aria-pressed={isClsSelected}
                            onClick={() => toggleClass(cls._id)}
                            className={cn(
                              "flex min-w-0 flex-col items-start rounded-control border p-2 text-left transition-colors",
                              isClsSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-accent",
                            )}
                          >
                            <span className="text-caps uppercase">
                              Class {cls.class}
                            </span>
                            <span
                              className={cn(
                                "w-full truncate text-caption font-medium",
                                isClsSelected
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {cls.lecturer || "No Lecturer"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
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
                Tidak ada komponen yang cocok dengan "{searchQuery}"
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="mt-3 flex w-full shrink-0 flex-col items-center justify-between gap-3 border-t border-border pt-3 sm:flex-row">
          <div className="flex items-center gap-2">
            {selectedClassIds.size > 0 && (
              <Badge className="px-2 py-1 font-mono text-caption">
                {selectedClassIds.size} KELAS DIPILIH
              </Badge>
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
              disabled={selectedClassIds.size === 0}
              onClick={handleAddSelected}
              className="flex-1 px-6 text-caps uppercase sm:flex-none"
            >
              Add
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
