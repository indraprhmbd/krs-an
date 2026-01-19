import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
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
  // Selection state: Record<courseCode, selectedClassId>
  const [selectedClasses, setSelectedClasses] = useState<
    Record<string, string>
  >({});
  // Batch selection set: Set of courseCodes
  const [batchSelection, setBatchSelection] = useState<Set<string>>(new Set());

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

  const toggleBatch = (code: string) => {
    const next = new Set(batchSelection);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
      // Auto-pick first class if none selected for this course
      if (
        !selectedClasses[code] &&
        groupedCourses.find((g) => g.code === code)?.classes[0]
      ) {
        setSelectedClasses((prev) => ({
          ...prev,
          [code]: groupedCourses.find((g) => g.code === code)!.classes[0]._id,
        }));
      }
    }
    setBatchSelection(next);
  };

  const handleAddSelected = () => {
    const toAdd: any[] = [];
    batchSelection.forEach((code) => {
      const classId = selectedClasses[code];
      const courseGroup = groupedCourses.find((g) => g.code === code);
      if (courseGroup) {
        const selectedClass =
          courseGroup.classes.find((c) => c._id === classId) ||
          courseGroup.classes[0];
        if (selectedClass) toAdd.push(selectedClass);
      }
    });

    if (toAdd.length > 0) {
      onAddCourses(toAdd);
      // Reset state
      setBatchSelection(new Set());
      setSelectedClasses({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-6 border-none shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-700" />
            Master Catalog
          </DialogTitle>
          <DialogDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pt-1">
            Search and Batch Add Components
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Search code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-10 text-xs focus-visible:ring-blue-700"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {groupedCourses.map((group) => {
            const isSelected = batchSelection.has(group.code);
            const selectedClassId =
              selectedClasses[group.code] || group.classes[0]?._id;
            const selectedClass = group.classes.find(
              (c) => c._id === selectedClassId,
            );

            return (
              <div
                key={group.code}
                className={`p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleBatch(group.code)}
                    className="mt-1 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 font-bold">
                            {group.code}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-white text-[9px] font-mono border-slate-200 text-slate-500"
                          >
                            {group.sks} SKS
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {group.name}
                        </h4>
                      </div>
                    </div>

                    {/* Class Selector Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Class:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.classes.map((cls) => (
                          <button
                            key={cls._id}
                            onClick={() => {
                              setSelectedClasses((prev) => ({
                                ...prev,
                                [group.code]: cls._id,
                              }));
                              if (!batchSelection.has(group.code))
                                toggleBatch(group.code);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                              selectedClassId === cls._id
                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                            }`}
                          >
                            {cls.class}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info Tooltip-like Area */}
                    {selectedClass && (
                      <div className="bg-white/60 rounded-xl p-2 mt-2 border border-blue-100/50">
                        <p className="text-[10px] text-slate-600 flex items-center gap-1.5">
                          <span className="font-bold text-blue-700">
                            Lecturer:
                          </span>
                          <span className="italic">
                            {selectedClass.lecturer}
                          </span>
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {selectedClass.schedule
                            .map((s: any) => `${s.day} ${s.start}-${s.end}`)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {groupedCourses.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                No components found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            {batchSelection.size > 0 && (
              <Badge className="bg-blue-600 text-white font-mono text-[10px] px-2 py-1">
                {batchSelection.size} SELECTED
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              Cancel
            </Button>
            <Button
              disabled={batchSelection.size === 0}
              onClick={handleAddSelected}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] uppercase tracking-widest px-6 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Add to session
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
