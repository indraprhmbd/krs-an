import { Badge } from "@/components/ui/badge";
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
  ClipboardCheck,
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
} from "@/components/ui/command";
import type { Course } from "@/types";

interface ScheduleSelectorProps {
  courses: Course[];
  selectedCodes: string[];
  lockedCourses: Record<string, string[]>;
  sessionProfile: { maxSks: number };
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

  const totalSelectedSks = Object.entries(grouped)
    .filter(([code]) => selectedCodes.includes(code))
    .reduce((sum, [code, variations]) => {
      const lockedIds = lockedCourses[code];
      const course =
        lockedIds && lockedIds.length > 0
          ? variations.find((v) => v.id === lockedIds[0])
          : variations[0];
      return sum + (course?.sks || 0);
    }, 0);

  const totalSksString = `${totalSelectedSks} / ${sessionProfile.maxSks} SKS`;

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
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 md:px-0">
      {/* Header Section */}
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start gap-6">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            {onBack && (
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                className="w-10 h-10 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-700 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="space-y-1 text-center xl:text-left flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold font-display text-slate-900 tracking-tight truncate">
                {t("selector.title")}
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-center xl:justify-start">
                <Badge
                  variant="outline"
                  className={`px-2 py-0.5 md:px-3 md:py-1 font-mono text-[10px] md:text-xs shrink-0 ${
                    totalSelectedSks > sessionProfile.maxSks
                      ? "border-red-200 text-red-700 bg-red-50"
                      : "border-blue-100 text-blue-700 bg-blue-50"
                  }`}
                >
                  {totalSksString}
                </Badge>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  |
                </span>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">
                  {selectedCodes.length} Subjects
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full xl:w-auto xl:min-w-[320px]">
            {/* Left/Top Action */}
            <Button
              variant="outline"
              onClick={onAddSubject}
              className="sm:col-span-1 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-700 h-9 md:h-10 rounded-xl text-[10px] md:text-xs shadow-sm px-3"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              {t("selector.add_course")}
            </Button>

            {/* Main/Right Action Stack */}
            <div className="sm:col-span-1 flex flex-col gap-1.5">
              <Button
                onClick={() => onGenerate(false)}
                disabled={selectedCodes.length === 0 || isGenerating}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white h-9 md:h-10 px-4 rounded-xl font-display font-bold shadow-md shadow-blue-100 transition-all hover:scale-[1.02] disabled:opacity-50 text-[10px] md:text-xs"
              >
                <Brain
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 ${isGenerating ? "animate-pulse" : ""}`}
                />
                {isGenerating
                  ? t("selector.generating")
                  : t("selector.generate")}
              </Button>

              {onSmartGenerate && (
                <div className="flex items-center w-full">
                  <Button
                    variant="outline"
                    onClick={onSmartGenerate}
                    disabled={
                      selectedCodes.length === 0 ||
                      isSmartGenerating ||
                      isGenerating
                    }
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 h-8 md:h-9 px-3 rounded-l-xl rounded-r-none font-display font-bold shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50 text-[9px] md:text-[10px]"
                  >
                    <Sparkles
                      className={`w-2.5 h-2.5 md:w-3 md:h-3 mr-1.5 ${isSmartGenerating ? "animate-spin" : ""}`}
                    />
                    {isSmartGenerating
                      ? t("selector.thinking")
                      : cooldown?.active
                        ? `Cooldown (${cooldown.seconds}s)`
                        : t("selector.smart_generate")}
                  </Button>
                  <div className="h-8 md:h-9 px-1.5 flex items-center bg-violet-600/10 border-l border-white/20 rounded-r-xl">
                    <HelpTooltip
                      titleKey="help.smart_generate_title"
                      descKey="help.smart_generate_desc"
                    />
                  </div>
                </div>
              )}

              {/* Visual Manual Plotter Button */}
              <Button
                variant="outline"
                onClick={() => onSaveManual?.([])} // Empty combo signals "enter plotter mode"
                disabled={selectedCodes.length === 0 || isGenerating}
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 h-8 md:h-9 px-4 rounded-xl font-display font-bold shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50 text-[9px] md:text-[10px]"
              >
                <PlusCircle className="w-3 md:w-3.5 h-3 md:h-3.5 mr-1.5" />
                Visual Manual Plotter
              </Button>
            </div>
          </div>
        </div>

        {/* Manual Builder Flash Card */}
        {currentManualCombination.length > 0 && (
          <div
            className={`p-4 rounded-3xl border transition-all animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              !isManualValid
                ? "bg-red-50 border-red-100 shadow-sm"
                : isManualComplete
                  ? "bg-green-50 border-green-100 shadow-sm"
                  : "bg-blue-50/30 border-blue-100"
            }`}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  !isManualValid
                    ? "bg-red-100 text-red-600"
                    : isManualComplete
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                }`}
              >
                {!isManualValid ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : isManualComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  {!isManualValid
                    ? "Schedule Conflict Detected"
                    : isManualComplete
                      ? "Custom Schedule Ready!"
                      : "Building Custom Draft..."}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  {!isManualValid
                    ? conflictMessages[0]
                    : isManualComplete
                      ? "This configuration is safe to save."
                      : `${currentManualCombination.length} subjects locked manually.`}
                </p>
              </div>
            </div>

            <Button
              disabled={!isManualValid || !isManualComplete || isGenerating}
              onClick={() => onSaveManual?.(currentManualCombination)}
              className={`w-full sm:w-auto h-9 px-6 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                isManualValid && isManualComplete
                  ? "bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200"
                  : "bg-slate-100 text-slate-400 border-none opacity-50"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 mr-2" />
              Save Manual Plan
            </Button>
          </div>
        )}
      </div>

      {/* Course List Cards */}
      <div className="grid gap-4">
        {Object.entries(grouped).map(([code, variations]) => {
          const isSelected = selectedCodes.includes(code);
          const lockedIds = lockedCourses[code];
          const currentLocked = lockedIds || [];
          // Display logic: show first locked course details if something is locked, else generic first variation
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
                  ? "bg-white border-slate-200 shadow-sm ring-1 ring-blue-100 md:ring-0"
                  : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="p-2.5 md:p-4 flex gap-3 md:gap-4 items-start relative">
                {/* Selection Checkbox (Left) */}
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

                {/* Main Content Area (Right) */}
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  {/* Header: Code/SKS + Trash */}
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
                        className={`font-bold font-display text-xs md:text-sm leading-tight ${
                          isSelected ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {activeCourse.name}
                      </h3>
                    </div>

                    {/* Mobile Only Trash (Top Right) */}
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

                  {/* Selector Logic (Mobile & Desktop) - Now inside the right column */}
                  {isSelected && (
                    <div className="w-full animate-in fade-in slide-in-from-top-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-7 md:h-9 border-slate-200 bg-slate-50/50 hover:bg-white text-[10px] md:text-xs font-mono px-2"
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
                          className="w-[200px] md:w-[300px] p-0 bg-white"
                          align="start"
                        >
                          <Command>
                            <CommandEmpty>No class found.</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-auto">
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  setLockedCourses((prev: any) => {
                                    const newLocked = { ...prev };
                                    if (
                                      !currentLocked ||
                                      currentLocked.length === 0
                                    ) {
                                      delete newLocked[code];
                                    } else {
                                      delete newLocked[code];
                                    }
                                    return newLocked;
                                  });
                                }}
                                className="text-xs font-bold text-blue-700"
                              >
                                <div
                                  className={`mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary ${
                                    !currentLocked || currentLocked.length === 0
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  }`}
                                >
                                  <Check className="h-3 w-3" />
                                </div>
                                Auto-Optimize (Any Class)
                              </CommandItem>
                              {variations.map((v) => {
                                const isChecked = currentLocked?.includes(v.id);
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={v.id}
                                    onSelect={() => {
                                      setLockedCourses((prev: any) => {
                                        const newLocked = { ...prev };
                                        const current = newLocked[code] || [];
                                        if (current.includes(v.id)) {
                                          newLocked[code] = current.filter(
                                            (id: string) => id !== v.id,
                                          );
                                          if (newLocked[code].length === 0)
                                            delete newLocked[code];
                                        } else {
                                          newLocked[code] = [...current, v.id];
                                        }
                                        return newLocked;
                                      });
                                    }}
                                    className="text-xs"
                                  >
                                    <div
                                      className={`mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary ${
                                        isChecked
                                          ? "bg-primary text-primary-foreground"
                                          : "opacity-50 [&_svg]:invisible"
                                      }`}
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
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {/* End Main Content Col */}
                </div>

                {/* Desktop Trash (Far Right, Vertical Center aligned with top or center?) 
                    Ideally it sits on the right of the whole card. 
                    But we have a flex row.
                */}
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
      </div>

      {courses.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
            No subjects loaded. Add from Master Catalog.
          </p>
        </div>
      )}
    </div>
  );
}
