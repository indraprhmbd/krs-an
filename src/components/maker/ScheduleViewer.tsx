import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ClipboardCheck,
  RotateCcw,
  Wand2,
  LayoutList,
  Printer,
} from "lucide-react";
import { ScheduleGrid } from "../ScheduleGrid";
import type { Plan, Course } from "@/types";
import { checkConflicts } from "../../lib/rules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { HelpTooltip } from "../ui/HelpTooltip";
import { getProdiConfig } from "../../lib/prodi";

interface ScheduleViewerProps {
  plans: Plan[];
  currentPlanIndex: number;
  setCurrentPlanIndex: (index: number | ((prev: number) => number)) => void;
  onBack: () => void;
  onSavePlan: (data: any) => void;
  isSaving: boolean;
  isManualEdit?: boolean;
  onUpdatePlan?: (updated: Course[]) => void;
  allPossibleCourses?: Course[];
  onExpand?: () => void;
  onShuffle?: () => void;
  planLimit: number;
  isGenerating?: boolean;
  prodi?: string;
}

export function ScheduleViewer({
  plans,
  currentPlanIndex,
  setCurrentPlanIndex,
  onBack,
  onSavePlan,
  isSaving,
  isManualEdit,
  onUpdatePlan,
  allPossibleCourses,
  onExpand,
  onShuffle,
  planLimit,
  isGenerating,
  prodi,
}: ScheduleViewerProps) {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const prodiConfig = getProdiConfig(prodi || "");
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

    const fixedCombo: Course[] = [];
    for (const code of uniqueCodes) {
      const variations = groupedVariations[code] || [];
      const best =
        variations.find((v) => {
          const { valid } = checkConflicts([...fixedCombo, v]);
          return valid;
        }) || variations[0];

      if (best) {
        fixedCombo.push(best);
      }
    }

    onUpdatePlan(fixedCombo);
    toast.success("Applied quick fix for conflicts!");
  };

  const renderInventory = () => (
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
              <Select
                onValueChange={(value) => {
                  const variation = variations.find((v) => v.id === value);
                  if (variation) handleUpdateCourse(code, variation);
                }}
              >
                <SelectTrigger className="w-full h-8 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 rounded-xl bg-white shadow-sm">
                  <SelectValue placeholder="+" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {variations.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      textValue={
                        prodiConfig.isCourseCentric
                          ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                          : `Class ${v.class} • ${v.lecturer.split(",")[0]} • ${v.schedule[0]?.day} ${v.schedule[0]?.start}`
                      }
                      className="rounded-xl px-3 py-2 cursor-pointer focus:bg-blue-50"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] text-slate-900">
                          {prodiConfig.isCourseCentric
                            ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                            : `Class ${v.class}`}
                        </span>
                        {!prodiConfig.isCourseCentric && (
                          <span className="text-slate-500 text-[9px] font-medium truncate italic">
                            {v.lecturer}
                          </span>
                        )}
                        <span
                          className={`text-blue-600 text-[8px] font-mono font-bold mt-0.5 ${prodiConfig.isCourseCentric ? "text-slate-400" : ""}`}
                        >
                          {prodiConfig.isCourseCentric
                            ? `Class ${v.class}`
                            : v.schedule
                                .map((s: any) => `${s.day} ${s.start}`)
                                .join(", ")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {!prodiConfig.isCourseCentric && (
                  <p className="text-[10px] font-medium text-slate-500 mt-1 truncate italic">
                    {c.lecturer || "No Lecturer"}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-[8px] h-4 px-1.5 font-mono border-slate-200 text-slate-600 bg-white shrink-0 ml-3 font-bold"
              >
                {c.sks} SKS
              </Badge>
            </div>

            {isManualEdit && (
              <div className="pt-1 mt-1 border-t border-slate-100/50">
                <Select
                  value={c.id}
                  onValueChange={(value) => {
                    if (value === "remove") {
                      if (onUpdatePlan) {
                        const nextCourses = currentPlan.courses.filter(
                          (curr: any) => curr.code !== c.code,
                        );
                        onUpdatePlan(nextCourses);
                        toast.success(`Removed ${c.code} from schedule`);
                      }
                      return;
                    }
                    const variation = variations.find((v) => v.id === value);
                    if (variation) handleUpdateCourse(c.code, variation);
                  }}
                >
                  <SelectTrigger className="h-7 text-[10px] font-bold px-3 border-slate-200 bg-white hover:bg-slate-50 rounded-lg w-full min-w-[100px]">
                    <span className="truncate w-full text-left block">
                      {prodiConfig.isCourseCentric
                        ? `${c.schedule[0]?.day} ${c.schedule[0]?.start} @ ${c.room || "TBA"}`
                        : `Class ${c.class} • ${c.lecturer.split(",")[0]} • ${c.schedule[0]?.day} ${c.schedule[0]?.start}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem
                      value="remove"
                      className="rounded-xl px-3 py-2 cursor-pointer focus:bg-red-50 text-red-500 font-bold text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span>Minify / Remove Selection</span>
                      </div>
                    </SelectItem>
                    {variations.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.id}
                        textValue={
                          prodiConfig.isCourseCentric
                            ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                            : `Class ${v.class} • ${v.lecturer.split(",")[0]} • ${v.schedule[0]?.day} ${v.schedule[0]?.start}`
                        }
                        className="rounded-xl px-3 py-2 cursor-pointer focus:bg-blue-50"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-[11px] text-slate-900">
                              {prodiConfig.isCourseCentric
                                ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                                : `Class ${v.class}`}
                            </span>
                            {!prodiConfig.isCourseCentric && (
                              <span className="text-slate-500 text-[9px] font-medium truncate">
                                {v.lecturer}
                              </span>
                            )}
                            <span
                              className={`text-blue-600 text-[8px] font-mono font-bold mt-0.5 ${prodiConfig.isCourseCentric ? "text-slate-400" : ""}`}
                            >
                              {prodiConfig.isCourseCentric
                                ? `Class ${v.class}`
                                : v.schedule
                                    .map((s: any) => `${s.day} ${s.start}`)
                                    .join(", ")}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4 animate-in fade-in duration-500 overflow-hidden">
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

      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm no-print shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="w-8 h-8 shrink-0 rounded-lg border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 hidden xs:block max-w-[120px] sm:max-w-none">
            <h2 className="text-[10px] sm:text-sm font-bold font-display text-slate-900 truncate">
              {currentPlan.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 no-print ml-auto">
          {!isManualEdit && plans.length > 1 && (
            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() =>
                  setCurrentPlanIndex((prev) =>
                    prev > 0 ? prev - 1 : plans.length - 1,
                  )
                }
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-[9px] font-bold font-mono px-1">
                {currentPlanIndex + 1}/{plans.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md"
                onClick={() =>
                  setCurrentPlanIndex((prev) =>
                    prev < plans.length - 1 ? prev + 1 : 0,
                  )
                }
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}

          {!isManualEdit && onShuffle && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShuffle}
                  disabled={isGenerating}
                  className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg border-slate-200 text-slate-600 hover:text-blue-600"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline ml-1.5 text-[9px] font-bold uppercase tracking-wider">
                    Shuffle
                  </span>
                </Button>
                <div className="hidden sm:block">
                  <HelpTooltip
                    titleKey="help.shuffle_title"
                    descKey="help.shuffle_desc"
                  />
                </div>
              </div>

              {onExpand && planLimit < 36 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExpand}
                    disabled={isGenerating}
                    className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg border-slate-200 text-slate-600 hover:text-violet-600"
                  >
                    <Sparkles
                      className={`w-3.5 h-3.5 ${isGenerating ? "animate-pulse" : ""}`}
                    />
                    <span className="hidden sm:inline ml-1.5 text-[9px] font-bold uppercase tracking-wider">
                      Expand
                    </span>
                  </Button>
                  <div className="hidden sm:block">
                    <HelpTooltip
                      titleKey="help.expand_title"
                      descKey="help.expand_desc"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {isManualEdit && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickFix}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg border-slate-200 text-slate-600 hover:text-blue-600"
              >
                <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline ml-1.5 text-[9px] font-bold uppercase tracking-wider">
                  Fix Conflicts
                </span>
              </Button>
              <div className="hidden sm:block">
                <HelpTooltip
                  titleKey="help.quick_fix_title"
                  descKey="help.quick_fix_desc"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg border-slate-200 text-slate-600 hover:text-red-600"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline ml-1.5 text-[9px] font-bold uppercase tracking-wider">
                  Reset
                </span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-100 h-8 shrink-0">
          <div className="text-right min-w-[50px]">
            <p className="text-[6px] font-mono text-slate-400 uppercase tracking-tighter leading-none mb-0.5">
              SKS
            </p>
            <span className="text-lg font-display font-black text-blue-600 leading-none">
              {totalSKS}
            </span>
          </div>

          <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden w-8 h-8 rounded-lg bg-blue-50 border-blue-100 text-blue-600 shadow-sm"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 w-[95vw] sm:max-w-[425px] h-[80vh] flex flex-col overflow-hidden rounded-[2.5rem] sm:rounded-3xl bg-white border-none shadow-2xl">
              <DialogHeader className="p-4 border-b shrink-0">
                <DialogTitle className="text-sm font-display flex items-center justify-between pr-8">
                  <div className="flex items-center gap-2">
                    <span>Course Inventory</span>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2 rounded-full text-[10px]">
                      {currentPlan.courses.length}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (isManualEdit) onSavePlan(currentPlan.courses);
                      else onSavePlan(currentPlan);
                      setIsInventoryOpen(false);
                    }}
                    disabled={isSaving || (isManualEdit && !valid)}
                    className={`h-7 px-3 font-display text-[9px] font-black uppercase rounded-lg transition-all ${
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
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                {renderInventory()}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div
        id="printable-area"
        className="flex lg:grid lg:grid-cols-[1.2fr_380px] gap-4 md:gap-8 items-stretch flex-1 min-h-0 overflow-hidden pb-4"
      >
        <div className="w-full bg-white p-1 rounded-2xl md:p-2 md:rounded-3xl border border-slate-200 shadow-sm overflow-auto custom-scrollbar flex flex-col flex-1">
          <div className="flex-1 min-h-0">
            <ScheduleGrid
              courses={currentPlan.courses}
              isCourseCentric={prodiConfig.isCourseCentric}
            />
          </div>
        </div>

        <div className="hidden lg:flex w-full shrink-0 flex-col h-full min-h-0">
          <Card className="border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden rounded-[2.5rem] flex flex-col h-full bg-white border-2">
            <CardHeader className="bg-slate-50 py-3 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-display flex items-center gap-2">
                <span>Course Inventory</span>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 border-none px-2 py-0.5 rounded-full"
                >
                  {currentPlan.courses.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => {
                    if (isManualEdit) onSavePlan(currentPlan.courses);
                    else onSavePlan(currentPlan);
                  }}
                  disabled={isSaving || (isManualEdit && !valid)}
                  className={`h-7 px-3 font-display text-[9px] font-black uppercase rounded-lg transition-all ${
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-7 px-2 font-mono text-[8px] uppercase tracking-widest bg-white hover:bg-slate-50 border-slate-200 rounded-lg"
                >
                  <Printer className="w-3 h-3 mr-1" />
                  Print
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              {renderInventory()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
