import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Plus,
  PlusCircle,
  Trash,
  ChevronsUpDown,
  Check,
  ChevronLeft,
  Brain,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { checkConflicts } from "../../lib/rules";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Course } from "@/types";

interface ScheduleSelectorProps {
  courses: Course[];
  selectedCodes: string[];
  lockedCourses: Record<string, string[]>;
  sessionProfile: { maxSks: number; semester: number; [key: string]: any };
  toggleCourse: (code: string) => void;
  setLockedCourses: (updater: (prev: any) => any) => void;
  handleDeleteCourse: (e: React.MouseEvent, id: string) => void;
  onAddSubject: () => void;
  onGenerate: (tokenized?: boolean) => void;
  onSmartGenerate?: () => void;
  onSaveManual?: (combo: Course[]) => void;
  onBack?: () => void;
  isGenerating: boolean;
  isSmartGenerating: boolean;
  cooldown?: { active: boolean; seconds: number };
}

export function ScheduleSelector({
  courses,
  selectedCodes,
  lockedCourses,
  sessionProfile,
  toggleCourse,
  setLockedCourses,
  handleDeleteCourse,
  onAddSubject,
  onGenerate,
  onSmartGenerate,
  onSaveManual,
  onBack,
  isGenerating,
  isSmartGenerating,
  cooldown,
}: ScheduleSelectorProps) {
  const { t } = useLanguage();
  const grouped = courses.reduce(
    (acc, c) => {
      acc[c.code] = acc[c.code] || [];
      acc[c.code].push(c);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  // Manual Builder Logic
  const currentManualCombination = Object.entries(lockedCourses)
    .map(([code, ids]) => {
      const variations = grouped[code] || [];
      return variations.find((v) => v.id === ids[0]);
    })
    .filter(Boolean) as Course[];

  const { valid: isManualValid, messages: conflictMessages } = checkConflicts(
    currentManualCombination,
  );

  const isManualComplete =
    currentManualCombination.length === selectedCodes.length &&
    selectedCodes.length > 0;

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Header Section */}
      <div className="shrink-0 bg-white/90 backdrop-blur-md p-2 md:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="w-8 h-8 shrink-0 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-sm md:text-lg font-bold font-display text-slate-900 whitespace-nowrap shrink-0">
                Course Catalog
              </h2>
              <div className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-mono font-bold border border-blue-100 shrink-0 w-fit">
                {Object.entries(grouped)
                  .filter(([code]) => selectedCodes.includes(code))
                  .reduce((sum, [code, variations]) => {
                    const lockedIds = lockedCourses[code];
                    const course =
                      lockedIds && lockedIds.length > 0
                        ? variations.find((v) => v.id === lockedIds[0])
                        : variations[0];
                    return sum + (course?.sks || 0);
                  }, 0)}{" "}
                / {sessionProfile.maxSks} SKS
              </div>
            </div>
            <p className="text-[8px] text-slate-400 font-mono uppercase tracking-widest leading-none">
              Semester {sessionProfile.semester} • 2025/2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            onClick={onAddSubject}
            size="sm"
            className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white font-display text-[9px] font-bold rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
          <div className="hidden sm:block">
            <HelpTooltip
              titleKey="help.master_catalog_title"
              descKey="help.master_catalog_desc"
            />
          </div>
          <div className="hidden sm:block w-px h-5 bg-slate-200 mx-0.5" />

          <Button
            onClick={() => onGenerate()}
            disabled={isGenerating || cooldown?.active}
            size="sm"
            variant="outline"
            className="h-8 px-3 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-display text-[9px] font-bold rounded-lg transition-all"
          >
            <Brain
              className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? "animate-pulse" : ""}`}
            />
            Quick Build
          </Button>
          <div className="hidden sm:block">
            <HelpTooltip
              titleKey="help.quick_build_title"
              descKey="help.quick_build_desc"
            />
          </div>

          {onSmartGenerate && (
            <div className="flex items-center gap-1">
              <Button
                onClick={onSmartGenerate}
                disabled={isSmartGenerating || cooldown?.active || isGenerating}
                size="sm"
                className="h-8 px-3 bg-violet-600 hover:bg-violet-700 text-white font-display text-[9px] font-bold rounded-lg transition-all shadow-md shadow-violet-100"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${isSmartGenerating ? "animate-spin" : ""}`}
                  />
                  Smart Generate
                </div>
              </Button>
              <div className="hidden sm:block">
                <HelpTooltip
                  titleKey="help.ai_smart_generate_title"
                  descKey="help.ai_smart_generate_desc"
                />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => onSaveManual?.([])}
            disabled={selectedCodes.length === 0 || isGenerating}
            className="border-blue-200 text-blue-700 hover:bg-blue-50 h-8 px-3 rounded-lg font-display font-bold text-[9px]"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Plotter
          </Button>
          <div className="hidden sm:block">
            <HelpTooltip
              titleKey="help.plotter_title"
              descKey="help.plotter_desc"
            />
          </div>
        </div>
      </div>

      {/* Manual Builder Flash Card */}
      {currentManualCombination.length > 0 && (
        <div
          className={`px-4 py-2 rounded-2xl border transition-all animate-in slide-in-from-top-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar ${
            !isManualValid
              ? "bg-red-50 border-red-100"
              : isManualComplete
                ? "bg-green-50 border-green-100"
                : "bg-blue-50/30 border-blue-100"
          }`}
        >
          <div className="flex items-center gap-2 min-w-fit shrink-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                !isManualValid
                  ? "bg-red-100 text-red-600"
                  : isManualComplete
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
              }`}
            >
              {!isManualValid ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : isManualComplete ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-900 leading-none mb-0.5">
                {!isManualValid
                  ? "Conflict!"
                  : isManualComplete
                    ? "Schedule Ready!"
                    : "Drafting..."}
              </p>
              <p className="text-[8px] text-slate-500 font-medium truncate italic">
                {!isManualValid
                  ? conflictMessages[0]
                  : isManualComplete
                    ? "Configuration is safe."
                    : `${currentManualCombination.length} subjects locked.`}
              </p>
            </div>
          </div>

          <Button
            disabled={!isManualValid || !isManualComplete || isGenerating}
            onClick={() => onSaveManual?.(currentManualCombination)}
            className={`h-7 px-4 rounded-lg font-bold text-[8px] uppercase tracking-wider transition-all ${
              isManualValid && isManualComplete
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-400 opacity-50"
            }`}
          >
            Save Draft
          </Button>
        </div>
      )}

      {/* Course List Cards */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid gap-3 pb-4">
          {Object.entries(grouped).map(([code, variations]) => {
            const isSelected = selectedCodes.includes(code);
            const lockedIds = lockedCourses[code];
            const currentLocked = lockedIds || [];
            const activeCourse =
              lockedIds && lockedIds.length > 0
                ? variations.find((v) => v.id === lockedIds[0])
                : variations[0];

            if (!activeCourse) return null;

            return (
              <div
                key={code}
                className={`group relative overflow-hidden transition-all duration-300 rounded-xl md:rounded-2xl border ${
                  isSelected
                    ? "bg-white border-slate-200 shadow-sm ring-1 ring-blue-50"
                    : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="p-3 md:p-4 flex gap-3 md:gap-4 items-start relative">
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleCourse(code)}
                    className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors mt-0.5 ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : "bg-white text-slate-300 hover:text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[9px] md:text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {code}
                          </span>
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-mono">
                            {activeCourse.sks} SKS
                          </span>
                        </div>
                        <h3
                          className={`font-bold font-display text-xs md:text-sm leading-tight ${isSelected ? "text-slate-900" : "text-slate-500"}`}
                        >
                          {activeCourse.name}
                        </h3>
                      </div>

                      {isSelected && (
                        <div className="md:hidden -mr-1 -mt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-300 hover:text-red-500"
                            onClick={(e) =>
                              handleDeleteCourse(e, activeCourse.id)
                            }
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-full animate-in fade-in slide-in-from-top-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-7 md:h-8 border-slate-200 bg-slate-50/50 hover:bg-white text-[10px] md:text-xs font-mono px-2 rounded-lg"
                            >
                              <span className="truncate">
                                {lockedIds && lockedIds.length > 0
                                  ? lockedIds.length === 1
                                    ? `Class ${variations.find((v) => v.id === lockedIds[0])?.class}`
                                    : `${lockedIds.length} Classes`
                                  : "Auto-Optimize (All)"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[200px] md:w-[300px] p-0 bg-white shadow-2xl rounded-2xl border-none max-h-[300px] overflow-hidden flex flex-col"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <Command className="flex-1 overflow-hidden flex flex-col">
                              <CommandEmpty>No class found.</CommandEmpty>
                              <CommandList className="flex-1 overflow-y-auto px-1 py-1 custom-scrollbar">
                                <CommandGroup>
                                  <CommandItem
                                    value="all"
                                    onSelect={() => {
                                      setLockedCourses((prev: any) => {
                                        const newLocked = { ...prev };
                                        delete newLocked[code];
                                        return newLocked;
                                      });
                                    }}
                                    className="text-xs font-bold text-blue-700 rounded-lg"
                                  >
                                    <div
                                      className={`mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary ${!currentLocked || currentLocked.length === 0 ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}
                                    >
                                      <Check className="h-3 w-3" />
                                    </div>
                                    Auto-Optimize (Any Class)
                                  </CommandItem>
                                  {variations.map((v) => {
                                    const isChecked = currentLocked?.includes(
                                      v.id,
                                    );
                                    return (
                                      <CommandItem
                                        key={v.id}
                                        value={v.id}
                                        onSelect={() => {
                                          setLockedCourses((prev: any) => {
                                            const newLocked = { ...prev };
                                            const current =
                                              newLocked[code] || [];
                                            if (current.includes(v.id)) {
                                              newLocked[code] = current.filter(
                                                (id: string) => id !== v.id,
                                              );
                                              if (newLocked[code].length === 0)
                                                delete newLocked[code];
                                            } else {
                                              newLocked[code] = [
                                                ...current,
                                                v.id,
                                              ];
                                            }
                                            return newLocked;
                                          });
                                        }}
                                        className="text-xs rounded-lg"
                                      >
                                        <div
                                          className={`mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary ${isChecked ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}
                                        >
                                          <Check className="h-3 w-3" />
                                        </div>
                                        <div className="flex flex-col w-full min-w-0">
                                          <div className="flex items-center justify-between w-full">
                                            <span className="font-bold">
                                              Class {v.class}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-mono">
                                              {v.schedule[0]?.day}{" "}
                                              {v.schedule[0]?.start}
                                            </span>
                                          </div>
                                          <span className="text-slate-500 text-[10px] truncate w-full block">
                                            {v.lecturer.split(",")[0]}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="hidden md:flex shrink-0 self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        onClick={(e) => handleDeleteCourse(e, activeCourse.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
                {t("selector.no_subjects")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
