import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "../../context/LanguageContext";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@/types";
import { getProdiConfig } from "../../lib/prodi";
import { ACADEMIC_YEAR, coerceSemester } from "@/lib/period";

interface ScheduleSelectorProps {
  courses: Course[];
  selectedCodes: string[];
  lockedCourses: Record<string, string[]>;
  sessionProfile: {
    maxSks: number;
    semester: number;
    prodi: string;
    [key: string]: any;
  };
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
  const prodiConfig = getProdiConfig(sessionProfile.prodi);

  // Every generator needs at least one selected course. Guarding here rather
  // than at each button keeps them from disagreeing.
  const hasSelection = selectedCodes.length > 0;

  const grouped = courses.reduce(
    (acc, c) => {
      acc[c.code] = acc[c.code] || [];
      acc[c.code].push(c);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  return (
    <div className="h-full flex flex-col gap-3 md:gap-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Header Section */}
      <div className="shrink-0 bg-card/90 p-2 md:p-3 rounded-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          {onBack && (
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="w-8 h-8 shrink-0 rounded-control border-border hover:bg-muted"
            >
              <Icon name="chevron-left" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-body md:text-title text-foreground whitespace-nowrap shrink-0">
                {t("selector.title")}
              </h2>
              <div className="px-1.5 py-0.5 bg-muted text-primary rounded-md text-caption font-mono font-bold border border-border shrink-0 w-fit">
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
            <p className="text-caps text-muted-foreground font-mono uppercase">
              Semester {coerceSemester(sessionProfile.semester)} |{" "}
              {ACADEMIC_YEAR}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <Button onClick={onAddSubject} size="sm" className="h-8 px-3">
            <Icon name="plus" size={14} />
            {t("selector.add_course")}
          </Button>
          <div className="hidden sm:block">
            <HelpTooltip
              titleKey="help.master_catalog_title"
              descKey="help.master_catalog_desc"
            />
          </div>
          <div className="hidden sm:block w-px h-5 bg-border mx-0.5" />

          <Button
            onClick={() => onGenerate()}
            disabled={!hasSelection || isGenerating || cooldown?.active}
            title={!hasSelection ? t("selector.needs_courses") : undefined}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Icon
              name="sparkles"
              size={14}
              className={isGenerating ? "animate-pulse" : undefined}
            />
            {t("selector.quick_build")}
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
                // Without a selection there is nothing to schedule, and Smart
                // Generate spends a credit plus a 30s rate limit to find that
                // out. The other generators are free, so they only need the
                // same guard for consistency.
                disabled={
                  !hasSelection ||
                  isSmartGenerating ||
                  cooldown?.active ||
                  isGenerating
                }
                title={!hasSelection ? t("selector.needs_courses") : undefined}
                size="sm"
                className="h-8 px-3"
              >
                <Icon
                  name="sparkles"
                  size={14}
                  className={isSmartGenerating ? "animate-spin" : undefined}
                />
                {t("selector.smart_generate")}
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
            disabled={!hasSelection || isGenerating}
            title={!hasSelection ? t("selector.needs_courses") : undefined}
            size="sm"
            className="h-8 px-3"
          >
            <Icon name="plus" size={14} />
            {t("selector.plotter")}
          </Button>
          <div className="hidden sm:block">
            <HelpTooltip
              titleKey="help.plotter_title"
              descKey="help.plotter_desc"
            />
          </div>
        </div>
      </div>

      {/* Course List Cards */}

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
                className={`group relative overflow-hidden transition-all duration-300 rounded-card border ${
 isSelected
 ? "bg-card border-border ring-1 ring-ring"
 : "bg-muted/50 border-border hover:border-border"
 }`}
              >
                <div className="p-3 md:p-4 flex gap-3 md:gap-4 items-start relative">
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleCourse(code)}
                    className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-control flex items-center justify-center cursor-pointer transition-colors mt-0.5 ${
 isSelected
 ? "bg-muted text-primary ring-1 ring-ring"
 : "bg-card text-muted-foreground hover:text-muted-foreground border border-border"
 }`}
                  >
                    {isSelected ? (
                      <Icon name="check" />
                    ) : (
                      <Icon name="plus" />
                    )}
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-caption bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {code}
                          </span>
                          <span className="text-caption text-muted-foreground font-mono">
                            {activeCourse.sks} SKS
                          </span>
                        </div>
                        <h3
                          className={`font-bold text-caption md:text-body ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {activeCourse.name}
                        </h3>
                      </div>

                      {isSelected && (
                        <div className="md:hidden -mr-1 -mt-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) =>
                              handleDeleteCourse(e, activeCourse.id)
                            }
                          >
                            <Icon name="trash" size={14} />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="w-full animate-in fade-in slide-in-from-top-1">
                        <Select
                          value={
                            lockedIds && lockedIds.length > 0 ? "locked" : "all"
                          }
                          onValueChange={(value) => {
                            if (value === "all") {
                              setLockedCourses((prev: any) => {
                                const newLocked = { ...prev };
                                delete newLocked[code];
                                return newLocked;
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full justify-between h-7 md:h-8 border-border bg-muted/50 hover:bg-card md: px-2 rounded-control">
                            <SelectValue>
                              {lockedIds && lockedIds.length > 0
                                ? lockedIds.length === 1
                                  ? prodiConfig.isCourseCentric
                                    ? (() => {
                                        const v = variations.find(
                                          (v) => v.id === lockedIds[0],
                                        );
                                        return `${v?.schedule[0]?.day} ${v?.schedule[0]?.start} @ ${v?.room || "TBA"}`;
                                      })()
                                    : `Class ${variations.find((v) => v.id === lockedIds[0])?.class}`
                                  : `${lockedIds.length} Options`
                                : prodiConfig.isCourseCentric
                                  ? "Auto-Assigned"
                                  : "Auto (All)"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-card shadow-card">
                            <SelectItem
                              value="all"
                              className="text-caption font-bold text-primary rounded-control focus:bg-muted"
                            >
                              {prodiConfig.isCourseCentric
                                ? "Auto-Select Day"
                                : "Auto-Optimize (Any Class)"}
                            </SelectItem>
                            {variations.map((v) => {
                              const isChecked = currentLocked?.includes(v.id);
                              return (
                                <div
                                  key={v.id}
                                  className="flex items-center px-2 hover:bg-muted cursor-pointer"
                                  onClick={() => {
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
                                >
                                  <div
                                    className={`mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary shrink-0 ${isChecked ? "bg-primary text-primary-foreground" : "opacity-50"}`}
                                  >
                                    {isChecked && <Icon name="check" size={12} />}
                                  </div>
                                  <div className="flex flex-col w-full min-w-0 py-2">
                                    <div className="flex items-center justify-between w-full">
                                      <span
                                        className={`font-bold text-caption ${prodiConfig.isCourseCentric ? "text-foreground" : "text-muted-foreground"}`}
                                      >
                                        {prodiConfig.isCourseCentric
                                          ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                                          : `Class ${v.class}`}
                                      </span>
                                      {!prodiConfig.isCourseCentric && (
                                        <span className="text-caption text-muted-foreground font-mono">
                                          {v.schedule[0]?.day}{" "}
                                          {v.schedule[0]?.start}
                                        </span>
                                      )}
                                      {prodiConfig.isCourseCentric && (
                                        <span className="text-caption text-muted-foreground font-mono">
                                          {prodiConfig.isFloatingDay
                                            ? "Original"
                                            : "Class"}{" "}
                                          {v.class}
                                        </span>
                                      )}
                                    </div>
                                    {!prodiConfig.isCourseCentric && (
                                      <span className="text-muted-foreground text-caption truncate w-full block">
                                        {v.lecturer.split(",")[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="hidden md:flex shrink-0 self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-control"
                        onClick={(e) => handleDeleteCourse(e, activeCourse.id)}
                      >
                        <Icon name="trash" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Icon
                name="database"
                size={24}
                className="text-muted-foreground"
              />
              <p className="text-title text-foreground">
                {t("selector.no_subjects_title")}
              </p>
              <p className="max-w-xs text-body-sm text-muted-foreground">
                {t("selector.no_subjects_desc")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddSubject}
                className="mt-1"
              >
                <Icon name="plus" size={14} />
                {t("selector.add_course")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
