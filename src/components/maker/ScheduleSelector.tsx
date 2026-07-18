import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "../../context/LanguageContext";
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
import { formatSchedule } from "@/lib/schedule-format";
import {
  MakerShell,
  type MakerFooterAction,
  type MakerRailStep,
} from "./MakerShell";

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
  onLoadCurriculum?: () => void;
  onGenerate: (tokenized?: boolean) => void;
  onSmartGenerate?: () => void;
  onSaveManual?: (combo: Course[]) => void;
  isGenerating: boolean;
  isSmartGenerating: boolean;
  cooldown?: { active: boolean; seconds: number };
  rail: MakerRailStep[];
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
  onLoadCurriculum,
  onGenerate,
  onSmartGenerate,
  onSaveManual,
  isGenerating,
  isSmartGenerating,
  cooldown,
  rail,
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

  const totalSks = Object.entries(grouped)
    .filter(([code]) => selectedCodes.includes(code))
    .reduce((sum, [code, variations]) => {
      const lockedIds = lockedCourses[code];
      const course =
        lockedIds && lockedIds.length > 0
          ? variations.find((v) => v.id === lockedIds[0])
          : variations[0];
      return sum + (course?.sks || 0);
    }, 0);

  return (
    <MakerShell
      rail={rail}
      title={t("selector.title")}
      description={
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-control border border-highlight/30 bg-highlight/10 px-1.5 py-0.5 font-mono text-caption font-bold text-highlight">
            {totalSks} / {sessionProfile.maxSks} SKS
          </span>
          <span className="font-mono text-caps uppercase text-muted-foreground">
            Semester {coerceSemester(sessionProfile.semester)} | {ACADEMIC_YEAR}
          </span>
        </div>
      }
      actions={[
        onLoadCurriculum && {
          key: "load-curriculum",
          label: t("selector.load_curriculum"),
          icon: "database",
          onClick: onLoadCurriculum,
        },
        {
          key: "add-course",
          label: t("selector.add_course"),
          icon: "plus",
          onClick: onAddSubject,
          tooltip: {
            titleKey: "help.master_catalog_title",
            descKey: "help.master_catalog_desc",
          },
        },
      ].filter(Boolean) as MakerFooterAction[]}
      footer={
        [
          {
            key: "quick-build",
            label: t("selector.quick_build"),
            // Distinct from Smart Generate's "sparkles": this is the free,
            // instant local build, not an AI call.
            icon: "refresh",
            onClick: () => onGenerate(),
            disabled: !hasSelection || isGenerating || cooldown?.active,
            disabledReason: !hasSelection
              ? t("selector.needs_courses")
              : undefined,
            loading: isGenerating,
            tooltip: {
              titleKey: "help.quick_build_title",
              descKey: "help.quick_build_desc",
            },
          },
          onSmartGenerate && {
            key: "smart-generate",
            label: t("selector.smart_generate"),
            icon: "sparkles",
            variant: "highlight",
            onClick: onSmartGenerate,
            // Without a selection there is nothing to schedule, and Smart
            // Generate spends a credit plus a 30s rate limit to find that
            // out. The other generators are free, so they only need the
            // same guard for consistency.
            disabled:
              !hasSelection ||
              isSmartGenerating ||
              cooldown?.active ||
              isGenerating,
            disabledReason: !hasSelection
              ? t("selector.needs_courses")
              : undefined,
            loading: isSmartGenerating,
            tooltip: {
              titleKey: "help.ai_smart_generate_title",
              descKey: "help.ai_smart_generate_desc",
            },
          },
          {
            key: "plotter",
            label: t("selector.plotter"),
            // Manual assembly, not "add another course" -- pencil reads as
            // hand-editing rather than duplicating the add-subject "plus".
            icon: "pencil",
            onClick: () => onSaveManual?.([]),
            disabled: !hasSelection || isGenerating,
            disabledReason: !hasSelection
              ? t("selector.needs_courses")
              : undefined,
            tooltip: {
              titleKey: "help.plotter_title",
              descKey: "help.plotter_desc",
            },
          },
        ].filter(Boolean) as MakerFooterAction[]
      }
    >
      <div className="grid gap-2 pb-4 lg:grid-cols-2">
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
                className={`group relative overflow-hidden transition-colors rounded-card border ${
                  isSelected
                    ? "bg-card border-primary"
                    : "bg-muted/50 border-border hover:border-border/80"
                }`}
              >
                <div className="p-2.5 flex gap-2.5 items-start relative">
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleCourse(code)}
                    className={`shrink-0 w-7 h-7 rounded-control flex items-center justify-center cursor-pointer transition-colors mt-0.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border"
                    }`}
                  >
                    {isSelected ? (
                      <Icon name="check" size={14} />
                    ) : (
                      <Icon name="plus" size={14} />
                    )}
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-caption rounded-control bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {code}
                          </span>
                          <span className="text-caption text-muted-foreground font-mono">
                            {activeCourse.sks} SKS
                          </span>
                        </div>
                        <h3
                          className={`font-bold text-caption ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
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
                          <SelectTrigger className="w-full justify-between h-7 border-border bg-muted/50 px-2 hover:bg-card rounded-control text-caption font-mono">
                            <SelectValue>
                              {lockedIds && lockedIds.length > 0
                                ? lockedIds.length === 1
                                  ? prodiConfig.isCourseCentric
                                    ? (() => {
                                        const v = variations.find(
                                          (v) => v.id === lockedIds[0],
                                        );
                                        return v
                                          ? `${formatSchedule(v.schedule)} @ ${v.room || "TBA"}`
                                          : "";
                                      })()
                                    : t("selector.class_label", {
                                        class:
                                          variations.find(
                                            (v) => v.id === lockedIds[0],
                                          )?.class || "",
                                      })
                                  : t("selector.options_count", {
                                      count: lockedIds.length,
                                    })
                                : prodiConfig.isCourseCentric
                                  ? t("selector.auto_assigned")
                                  : t("selector.auto_all")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="rounded-card shadow-card">
                            <SelectItem
                              value="all"
                              className="text-caption font-bold text-primary rounded-control focus:bg-muted"
                            >
                              {prodiConfig.isCourseCentric
                                ? t("selector.auto_select_day")
                                : t("selector.auto_optimize")}
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
                                          ? `${formatSchedule(v.schedule)} @ ${v.room || "TBA"}`
                                          : `Class ${v.class}`}
                                      </span>
                                      {!prodiConfig.isCourseCentric && (
                                        <span className="text-caption text-muted-foreground font-mono">
                                          {formatSchedule(v.schedule)}
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
                                      <span className="text-muted-foreground text-caption w-full block">
                                        {v.lecturer}
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
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-control"
                        onClick={(e) => handleDeleteCourse(e, activeCourse.id)}
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {courses.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center lg:col-span-2">
              <img
                src="/assets/Empty-course-pana.svg"
                alt=""
                width={750}
                height={500}
                loading="lazy"
                decoding="async"
                className="h-40 w-full max-w-xs"
              />
              <p className="text-title text-foreground">
                {t("selector.no_subjects_title")}
              </p>
              <p className="max-w-xs text-body-sm text-muted-foreground">
                {t("selector.no_subjects_desc")}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                {onLoadCurriculum && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadCurriculum}
                  >
                    <Icon name="database" size={14} />
                    {t("selector.load_curriculum")}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onAddSubject}>
                  <Icon name="plus" size={14} />
                  {t("selector.add_course")}
                </Button>
              </div>
            </div>
          )}
      </div>
    </MakerShell>
  );
}
