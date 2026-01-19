import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { ScheduleGrid } from "../ScheduleGrid";
import { HelpTooltip } from "../ui/HelpTooltip";
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
import { ChevronsUpDown, Check } from "lucide-react";

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
  userData?: { credits: number };
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
  userData,
}: ScheduleViewerProps) {
  const currentPlan = plans[currentPlanIndex];
  const totalSKS = currentPlan.courses.reduce(
    (sum, c) => sum + (c.sks || 0),
    0,
  );

  const { valid, messages: conflictMessages } = checkConflicts(
    currentPlan.courses,
  );

  const groupedVariations =
    allPossibleCourses?.reduce(
      (acc, c) => {
        acc[c.code] = acc[c.code] || [];
        acc[c.code].push(c);
        return acc;
      },
      {} as Record<string, Course[]>,
    ) || {};

  const handleUpdateCourse = (code: string, newVariation: Course) => {
    if (!onUpdatePlan) return;
    const nextCourses = currentPlan.courses.map((c) =>
      c.code === code ? newVariation : c,
    );
    onUpdatePlan(nextCourses);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900 truncate pr-4">
              {currentPlan.name}
            </h2>
            <p className="text-slate-500 font-mono text-[9px] tracking-widest uppercase truncate mt-0.5">
              {isManualEdit
                ? "MANUAL ASSEMBLER MODE • VISUAL DRAFT"
                : `PLAN ${currentPlanIndex + 1} OF ${plans.length} • OPTIMIZED BY AI`}
            </p>
          </div>
        </div>

        {/* Right-aligned Total SKS Column - Stable */}
        <div className="flex items-center gap-3 pl-4 md:border-l border-slate-100 h-10 shrink-0">
          <div className="text-right min-w-[100px]">
            <p className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter leading-none mb-1">
              TOTAL ACCUMULATION
            </p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-2xl md:text-3xl font-display font-black text-blue-600 leading-none">
                {totalSKS}
              </span>
              <span className="text-[10px] font-bold text-slate-400">SKS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Floating Controller */}
      <div className="flex items-center justify-center no-print sticky top-20 z-50 w-full px-2">
        <div className="inline-flex flex-wrap items-center justify-center gap-1 md:gap-2 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-1.5 md:p-2 rounded-[2rem] shadow-xl shadow-blue-900/5 max-w-full overflow-hidden">
          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isManualEdit) {
                onSavePlan(currentPlan.courses);
              } else {
                onSavePlan(currentPlan);
              }
            }}
            disabled={isSaving || (isManualEdit && !valid)}
            className={`h-9 md:h-10 px-2 md:px-4 font-display text-[10px] md:text-[11px] font-bold rounded-2xl transition-all ${
              isManualEdit && valid
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            }`}
          >
            {isManualEdit ? (
              <ClipboardCheck
                className={`w-4 h-4 mr-2 ${isSaving ? "animate-pulse" : ""}`}
              />
            ) : (
              <Bookmark
                className={`w-4 h-4 mr-2 ${isSaving ? "animate-pulse" : ""}`}
              />
            )}
            {isSaving ? "Saving..." : isManualEdit ? "Commit & Save" : "Save"}
          </Button>

          <div className="hidden sm:block w-px h-6 bg-slate-200" />

          {/* Slider Core */}
          <div className="flex items-center gap-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPlanIndex === 0}
              onClick={() => setCurrentPlanIndex((prev: number) => prev - 1)}
              className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="flex flex-col items-center px-2 md:px-4 min-w-[70px] md:min-w-[100px]">
              <div className="flex items-center">
                <span className="text-[10px] md:text-[11px] font-mono font-bold text-slate-900 tracking-tighter leading-none">
                  {String(currentPlanIndex + 1).padStart(2, "0")} /{" "}
                  {String(plans.length).padStart(2, "0")}
                </span>
                <HelpTooltip
                  titleKey="help.slider_title"
                  descKey="help.slider_desc"
                />
              </div>
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: Math.min(plans.length, 6) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-1 md:w-2 rounded-full transition-all duration-300 ${
                        i === currentPlanIndex % 6
                          ? "bg-blue-600 w-5"
                          : "bg-slate-200"
                      }`}
                    />
                  ),
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={currentPlanIndex === plans.length - 1}
              onClick={() => setCurrentPlanIndex((prev: number) => prev + 1)}
              className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {onShuffle && (
            <>
              <div className="hidden sm:block w-px h-6 bg-slate-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onShuffle}
                disabled={isGenerating}
                className="h-9 md:h-10 px-2 md:px-4 font-display text-[10px] md:text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-700 rounded-2xl transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                />
                Shuffle
                <HelpTooltip
                  titleKey="help.shuffle_title"
                  descKey="help.shuffle_desc"
                />
              </Button>
            </>
          )}

          {planLimit < 36 && onExpand && (
            <>
              <div className="hidden sm:block w-px h-6 bg-slate-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                disabled={isGenerating || (userData?.credits ?? 0) <= 0}
                className="h-9 md:h-10 px-2 md:px-4 font-display text-[10px] md:text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-all rounded-2xl disabled:opacity-50"
              >
                <Sparkles
                  className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                />
                {isGenerating ? "Generating..." : "Expand Limit (+12)"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div id="printable-area" className="flex flex-col gap-6">
        <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden">
          <ScheduleGrid courses={currentPlan.courses} />
        </div>

        <div className="w-full">
          <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl flex flex-col">
            <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-200 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-display flex items-center gap-2">
                <span>Course Inventory</span>
                <Badge
                  variant="secondary"
                  className="text-[9px] font-mono bg-white"
                >
                  {currentPlan.courses.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="no-print h-7 px-3 font-mono text-[9px] uppercase tracking-widest bg-white hover:bg-slate-50 border-slate-200"
                >
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[400px]">
              <div className="divide-y divide-slate-100 text-[11px]">
                {currentPlan.courses.map((c, i) => {
                  const variations = groupedVariations[c.code] || [];
                  const isConflicted = conflictMessages.some(
                    (m) => m.includes(c.name) && m.includes(c.class),
                  );

                  return (
                    <div
                      key={i}
                      className={`p-3 transition-colors group flex justify-between items-center ${
                        isConflicted ? "bg-red-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            {c.code}
                          </span>
                          {isConflicted && (
                            <Badge
                              variant="destructive"
                              className="text-[8px] h-3 px-1"
                            >
                              CONFLICT
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-xs leading-tight truncate">
                          {c.name}
                        </h4>

                        {isManualEdit ? (
                          <div className="mt-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[9px] font-mono px-2 border-slate-200 bg-white"
                                >
                                  Class {c.class}
                                  <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[200px] p-0 bg-white"
                                align="start"
                              >
                                <Command>
                                  <CommandEmpty>
                                    No variations found.
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-[200px] overflow-auto">
                                    {variations.map((v) => (
                                      <CommandItem
                                        key={v.id}
                                        value={v.id}
                                        onSelect={() =>
                                          handleUpdateCourse(c.code, v)
                                        }
                                        className="text-[10px]"
                                      >
                                        <Check
                                          className={`mr-2 h-3 w-3 ${
                                            v.id === c.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-bold">
                                            Class {v.class}
                                          </span>
                                          <span className="text-slate-400 text-[9px]">
                                            {v.schedule
                                              .map(
                                                (s: any) =>
                                                  `${s.day} ${s.start}`,
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
                        ) : (
                          <p className="text-[9px] font-bold text-slate-500 mt-1 truncate">
                            CLASS {c.class} • {c.lecturer}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[8px] h-4 px-1 font-mono border-slate-200 text-slate-600 bg-white shrink-0 ml-3"
                      >
                        {c.sks} SKS
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Conflict Banner - Desktop/Visual Feedback */}
          {!valid && isManualEdit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-900">
                  Conflict Detected
                </p>
                <ul className="list-disc list-inside">
                  {conflictMessages.map((m, i) => (
                    <li key={i} className="text-xs text-red-700">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
