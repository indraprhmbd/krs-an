import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ClipboardCheck,
  RotateCcw,
  Wand2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { ScheduleGrid } from "../ScheduleGrid";
import type { Plan, Course } from "@/types";
import { checkConflicts } from "../../lib/rules";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { toast } from "sonner";
import { useMemo } from "react";

interface ScheduleViewerProps {
  plans: Plan[];
  currentPlanIndex: number;
  onBack: () => void;
  onSavePlan: (data: any) => void;
  isSaving: boolean;
  isManualEdit?: boolean;
  onUpdatePlan?: (updated: Course[]) => void;
  allPossibleCourses?: Course[];
}

export function ScheduleViewer({
  plans,
  currentPlanIndex,
  onBack,
  onSavePlan,
  isSaving,
  isManualEdit,
  onUpdatePlan,
  allPossibleCourses,
}: ScheduleViewerProps) {
  const currentPlan = plans[currentPlanIndex];
  const totalSKS = currentPlan.courses.reduce(
    (sum, c) => sum + (c.sks || 0),
    0,
  );

  const { valid, messages: conflictMessages } = checkConflicts(
    currentPlan.courses,
  );

  const groupedVariations = useMemo(() => {
    return (
      allPossibleCourses?.reduce(
        (acc, c) => {
          acc[c.code] = acc[c.code] || [];
          acc[c.code].push(c);
          return acc;
        },
        {} as Record<string, Course[]>,
      ) || {}
    );
  }, [allPossibleCourses]);

  const uniqueCodes = useMemo(() => {
    return Array.from(new Set(allPossibleCourses?.map((ac) => ac.code) || []));
  }, [allPossibleCourses]);

  const handleUpdateCourse = (code: string, newVariation: Course) => {
    if (!onUpdatePlan) return;
    const nextCourses = currentPlan.courses.filter((c) => c.code !== code);
    nextCourses.push(newVariation);
    onUpdatePlan(nextCourses);
  };

  const handleReset = () => {
    if (!onUpdatePlan) return;
    onUpdatePlan([]);
    toast.info("Selections cleared. Start fresh!");
  };

  const handleQuickFix = () => {
    if (!onUpdatePlan || !allPossibleCourses) return;

    // Simple greedy fix
    const fixedCombo: Course[] = [];

    for (const code of uniqueCodes) {
      const variations = groupedVariations[code] || [];
      // Find first that doesn't conflict with already picked
      const best =
        variations.find((v) => {
          const { valid } = checkConflicts([...fixedCombo, v]);
          return valid;
        }) || variations[0]; // If all conflict, just pick best available or first

      if (best) {
        fixedCombo.push(best);
      }
    }

    onUpdatePlan(fixedCombo);
    toast.success("Applied quick fix for conflicts!");
  };

  return (
    <div className="h-full flex flex-col gap-4 md:gap-6 animate-in fade-in duration-500 overflow-visible lg:overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .no-print { display: none !important; }
          .bg-slate-50, .bg-slate-50/50, .bg-slate-50\/50 { background-color: white !important; }
          .shadow-xl, .shadow-sm, .shadow-2xl { box-shadow: none !important; }
          .border { border-color: #e2e8f0 !important; }
          .rounded-2xl { border-radius: 8px !important; }
        }
      `,
        }}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm no-print shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="w-9 h-9 shrink-0 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-bold font-display text-slate-900 truncate pr-4">
              {currentPlan.name}
            </h2>
            <p className="text-slate-500 font-mono text-[8px] tracking-widest uppercase truncate mt-0.5">
              {isManualEdit
                ? "MANUAL ASSEMBLER MODE • VISUAL DRAFT"
                : `PLAN ${currentPlanIndex + 1} OF ${plans.length} • OPTIMIZED BY AI`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-3 md:border-l border-slate-100 h-9 shrink-0">
          <div className="text-right min-w-[80px]">
            <p className="text-[7px] font-mono text-slate-400 uppercase tracking-tighter leading-none mb-1">
              ACCUMULATION
            </p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-xl md:text-2xl font-display font-black text-blue-600 leading-none">
                {totalSKS}
              </span>
              <span className="text-[9px] font-bold text-slate-400">SKS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar removed per user request */}

      <div
        id="printable-area"
        className="grid grid-cols-1 lg:grid-cols-[1.2fr_380px] gap-8 items-stretch flex-1 min-h-0 overflow-visible lg:overflow-hidden pb-4"
      >
        <div className="w-full bg-white p-2 rounded-3xl border border-slate-200 shadow-xl shadow-blue-900/5 overflow-auto custom-scrollbar flex flex-col">
          <div className="flex-1">
            <ScheduleGrid courses={currentPlan.courses} />
          </div>
        </div>

        <div className="w-full shrink-0 flex flex-col h-[400px] lg:h-full min-h-0">
          <Card className="border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden rounded-[2.5rem] flex flex-col h-full bg-white/80 backdrop-blur-sm border-2">
            <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-display flex items-center gap-2">
                <span>Course Inventory</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5 rounded-full"
                >
                  {currentPlan.courses.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1.5 no-print">
                <Button
                  size="sm"
                  onClick={() => {
                    if (isManualEdit) {
                      onSavePlan(currentPlan.courses);
                    } else {
                      onSavePlan(currentPlan);
                    }
                  }}
                  disabled={isSaving || (isManualEdit && !valid)}
                  className={`h-7 px-3 font-display text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm ${
                    valid
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <ClipboardCheck
                    className={`w-3 h-3 mr-1 ${isSaving ? "animate-pulse" : ""}`}
                  />
                  {isSaving ? "Saving..." : isManualEdit ? "Commit" : "Save"}
                </Button>
                {isManualEdit && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleReset}
                      title="Reset all"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleQuickFix}
                      title="Quick Fix Conflicts"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-7 px-2 font-mono text-[8px] uppercase tracking-widest bg-white hover:bg-slate-50 border-slate-200 rounded-lg"
                >
                  Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-slate-100/80 text-[11px]">
                {uniqueCodes.map((code) => {
                  const variations = groupedVariations[code] || [];
                  const c = currentPlan.courses.find((cp) => cp.code === code);
                  const isConflicted = c
                    ? conflictMessages.some(
                        (m) => m.includes(c.name) && m.includes(c.class),
                      )
                    : false;

                  if (!c) {
                    const sampleCourse = variations[0];
                    return (
                      <div
                        key={code}
                        className="p-4 bg-slate-50/50 border-l-4 border-l-slate-200 transition-all hover:bg-slate-100/50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-black tracking-widest">
                            {code}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[7px] h-3.5 px-0.5 border-slate-200 text-slate-400 font-extrabold rounded-[2px] tracking-tighter"
                          >
                            UNSELECTED
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-500 text-[11px] leading-tight line-clamp-2 mb-3">
                          {sampleCourse?.name || "Unknown Course"}
                        </h4>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 rounded-xl bg-white shadow-sm"
                            >
                              Select Class
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[280px] p-0 bg-white shadow-2xl rounded-2xl border-none"
                            align="end"
                          >
                            <Command className="rounded-2xl">
                              <CommandGroup className="max-h-[250px] overflow-auto p-1.5">
                                {variations.map((v) => (
                                  <CommandItem
                                    key={v.id}
                                    value={v.id}
                                    onSelect={() => handleUpdateCourse(code, v)}
                                    className="rounded-xl px-3 py-2 cursor-pointer aria-selected:bg-blue-50"
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-[11px] text-slate-900">
                                        Class {v.class}
                                      </span>
                                      <span className="text-slate-500 text-[9px] font-medium truncate italic">
                                        {v.lecturer}
                                      </span>
                                      <span className="text-blue-600 text-[8px] font-mono font-bold mt-0.5">
                                        {v.schedule
                                          .map(
                                            (s: any) => `${s.day} ${s.start}`,
                                          )
                                          .join(", ")}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={code}
                      className={`p-4 transition-colors group flex flex-col gap-2 ${
                        isConflicted ? "bg-red-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">
                              {c.code}
                            </span>
                            {isConflicted && (
                              <Badge
                                variant="destructive"
                                className="text-[8px] h-3.5 px-1.5 font-bold"
                              >
                                CONFLICT
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-[11px] leading-tight line-clamp-2">
                            {c.name}
                          </h4>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 truncate italic">
                            {c.lecturer || "No Lecturer"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 px-1.5 font-mono border-slate-200 text-slate-600 bg-white shrink-0 ml-3 font-bold"
                        >
                          {c.sks} SKS
                        </Badge>
                      </div>

                      {isManualEdit && (
                        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-100/50">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            Class Selection:
                          </span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] font-bold px-3 border-slate-200 bg-white hover:bg-slate-50 rounded-lg"
                              >
                                Class {c.class}
                                <ChevronsUpDown className="ml-1.5 h-3 w-3 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[240px] p-0 bg-white shadow-2xl rounded-2xl border-none"
                              align="end"
                            >
                              <Command className="rounded-2xl">
                                <CommandEmpty>
                                  No variations found.
                                </CommandEmpty>
                                <CommandGroup className="max-h-[250px] overflow-auto p-1.5">
                                  {variations.map((v) => (
                                    <CommandItem
                                      key={v.id}
                                      value={v.id}
                                      onSelect={() =>
                                        handleUpdateCourse(c.code, v)
                                      }
                                      className="rounded-xl px-3 py-2 cursor-pointer aria-selected:bg-blue-50"
                                    >
                                      <div className="flex items-start gap-2 w-full">
                                        <div
                                          className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center border ${
                                            v.id === c.id
                                              ? "bg-blue-600 border-blue-600 text-white"
                                              : "border-slate-200"
                                          }`}
                                        >
                                          {v.id === c.id && (
                                            <Check className="h-2.5 w-2.5" />
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-bold text-[11px] text-slate-900">
                                            Class {v.class}
                                          </span>
                                          <span className="text-slate-500 text-[9px] font-medium truncate">
                                            {v.lecturer}
                                          </span>
                                          <span className="text-blue-600 text-[8px] font-mono font-bold mt-0.5">
                                            {v.schedule
                                              .map(
                                                (s: any) =>
                                                  `${s.day} ${s.start}`,
                                              )
                                              .join(", ")}
                                          </span>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conflict banner removed per user request */}
    </div>
  );
}
