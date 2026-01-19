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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-white rounded-[2.5rem] sm:rounded-3xl p-4 sm:p-6 border-none shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[85vh]">
        <DialogHeader className="mb-4 shrink-0">
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
            const groupIds = group.classes.map((c) => c._id);
            const selectedCountInGroup = groupIds.filter((id) =>
              selectedClassIds.has(id),
            ).length;
            const isAnySelected = selectedCountInGroup > 0;
            const isAllSelected = selectedCountInGroup === groupIds.length;

            return (
              <div
                key={group.code}
                className={`p-4 rounded-2xl border transition-all ${
                  isAnySelected
                    ? "bg-blue-50/50 border-blue-200 shadow-sm"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <Checkbox
                      checked={
                        isAllSelected ||
                        (isAnySelected ? "indeterminate" : false)
                      }
                      onCheckedChange={() => toggleGroup(group.classes)}
                      className="border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=indeterminate]:bg-blue-400"
                    />
                  </div>

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
                          {selectedCountInGroup > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 text-[8px] font-bold border-none h-4 px-1.5">
                              {selectedCountInGroup} CLASSES SELECTED
                            </Badge>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {group.name}
                        </h4>
                      </div>
                    </div>

                    {/* Class Selector Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                      {group.classes.map((cls) => {
                        const isClsSelected = selectedClassIds.has(cls._id);
                        return (
                          <button
                            key={cls._id}
                            onClick={() => toggleClass(cls._id)}
                            className={`flex flex-col items-start p-2 rounded-xl text-left transition-all border ${
                              isClsSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 shadow-sm"
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Class {cls.class}
                            </span>
                            <span
                              className={`text-[9px] font-medium truncate w-full ${
                                isClsSelected
                                  ? "text-blue-100"
                                  : "text-slate-400"
                              }`}
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

        <DialogFooter className="mt-4 sm:mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2">
            {selectedClassIds.size > 0 && (
              <Badge className="bg-blue-600 text-white font-mono text-[9px] px-2 py-1">
                {selectedClassIds.size} CLASSES SELECTED
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              Cancel
            </Button>
            <Button
              disabled={selectedClassIds.size === 0}
              onClick={handleAddSelected}
              className="flex-1 sm:flex-none bg-blue-700 hover:bg-blue-800 text-white font-bold text-[10px] uppercase tracking-widest px-6 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              Add
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
