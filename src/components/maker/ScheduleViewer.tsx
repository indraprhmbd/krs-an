import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ScheduleGrid } from "../ScheduleGrid";
import type { Plan, Course } from "@/types";
import { checkConflicts } from "../../lib/rules";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { getProdiConfig } from "../../lib/prodi";
import { useLanguage } from "../../context/LanguageContext";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  MakerShell,
  type MakerFooterAction,
  type MakerRailStep,
} from "./MakerShell";

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
  rail: MakerRailStep[];
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
  rail,
}: ScheduleViewerProps) {
  const { t } = useLanguage();
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
    toast.info(t("toast.selections_cleared"));
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
    toast.success(t("toast.quick_fix"));
  };

  const renderInventory = () => (
    <div className="divide-y divide-border/80 text-caption">
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
              className="p-4 bg-muted/50 border-l-4 border-l-border transition-all hover:bg-accent/50"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-caps font-mono text-muted-foreground uppercase">
                  {code}
                </span>
                <Badge
                  variant="outline"
                  className="text-grid-meta h-3.5 px-0.5 border-border text-muted-foreground rounded-[2px] tracking-tighter"
                >
                  UNSELECTED
                </Badge>
              </div>
              <h4 className="font-bold text-muted-foreground text-caption line-clamp-2 mb-3">
                {sampleCourse?.name || "Unknown Course"}
              </h4>
              <Select
                onValueChange={(value) => {
                  const variation = variations.find((v) => v.id === value);
                  if (variation) handleUpdateCourse(code, variation);
                }}
              >
                <SelectTrigger className="w-full h-8 border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary rounded-control bg-card">
                  <SelectValue placeholder="+" />
                </SelectTrigger>
                <SelectContent>
                  {variations.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      textValue={
                        prodiConfig.isCourseCentric
                          ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                          : `Class ${v.class} | ${v.lecturer.split(",")[0]} | ${v.schedule[0]?.day} ${v.schedule[0]?.start}`
                      }
                      className="rounded-control px-3 py-2 cursor-pointer focus:bg-muted"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-caption text-foreground">
                          {prodiConfig.isCourseCentric
                            ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                            : `Class ${v.class}`}
                        </span>
                        {!prodiConfig.isCourseCentric && (
                          <span className="text-muted-foreground text-caption font-medium truncate italic">
                            {v.lecturer}
                          </span>
                        )}
                        <span
                          className={`text-primary text-grid font-mono font-bold mt-0.5 ${prodiConfig.isCourseCentric ? "text-muted-foreground" : ""}`}
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
 isConflicted ? "bg-destructive/10" : "hover:bg-muted/50"
 }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-caption font-mono text-muted-foreground uppercase font-bold">
                    {c.code}
                  </span>
                  {isConflicted && (
                    <Badge
                      variant="destructive"
                      className="text-grid h-3.5 px-1.5 font-bold"
                    >
                      CONFLICT
                    </Badge>
                  )}
                </div>
                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-caption line-clamp-2">
                  {c.name}
                </h4>
                {!prodiConfig.isCourseCentric && (
                  <p className="text-caption font-medium text-muted-foreground mt-1 truncate italic">
                    {c.lecturer || "No Lecturer"}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="text-grid h-4 px-1.5 font-mono border-border text-muted-foreground bg-card shrink-0 ml-3 font-bold"
              >
                {c.sks} SKS
              </Badge>
            </div>

            {isManualEdit && (
              <div className="pt-1 mt-1 border-t border-border/50">
                <Select
                  value={c.id}
                  onValueChange={(value) => {
                    if (value === "remove") {
                      if (onUpdatePlan) {
                        const nextCourses = currentPlan.courses.filter(
                          (curr: any) => curr.code !== c.code,
                        );
                        onUpdatePlan(nextCourses);
                        toast.success(t("toast.course_removed_code", { code: c.code }));
                      }
                      return;
                    }
                    const variation = variations.find((v) => v.id === value);
                    if (variation) handleUpdateCourse(c.code, variation);
                  }}
                >
                  <SelectTrigger className="h-7 px-3 border-border bg-card hover:bg-accent rounded-control w-full min-w-[100px]">
                    <span className="truncate w-full text-left block">
                      {prodiConfig.isCourseCentric
                        ? `${c.schedule[0]?.day} ${c.schedule[0]?.start} @ ${c.room || "TBA"}`
                        : `Class ${c.class} | ${c.lecturer.split(",")[0]} | ${c.schedule[0]?.day} ${c.schedule[0]?.start}`}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="remove"
                      className="rounded-control px-3 py-2 cursor-pointer focus:bg-destructive/10 text-destructive font-bold text-caption"
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
                            : `Class ${v.class} | ${v.lecturer.split(",")[0]} | ${v.schedule[0]?.day} ${v.schedule[0]?.start}`
                        }
                        className="rounded-control px-3 py-2 cursor-pointer focus:bg-muted"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="font-bold text-caption text-foreground">
                              {prodiConfig.isCourseCentric
                                ? `${v.schedule[0]?.day} ${v.schedule[0]?.start} @ ${v.room || "TBA"}`
                                : `Class ${v.class}`}
                            </span>
                            {!prodiConfig.isCourseCentric && (
                              <span className="text-muted-foreground text-caption font-medium truncate">
                                {v.lecturer}
                              </span>
                            )}
                            <span
                              className={`text-primary text-grid font-mono font-bold mt-0.5 ${prodiConfig.isCourseCentric ? "text-muted-foreground" : ""}`}
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

  const saveLabel = isSaving ? "Saving..." : isManualEdit ? "Commit" : "Save";
  const handleSave = () => {
    if (isManualEdit) onSavePlan(currentPlan.courses);
    else onSavePlan(currentPlan);
  };

  return (
    <MakerShell
      rail={rail}
      scrollBody={false}
      onBack={onBack}
      backLabel="Back"
      title={currentPlan.name}
      description={
        <span className="font-mono text-caps uppercase text-muted-foreground">
          {totalSKS} SKS
        </span>
      }
      extra={
        !isManualEdit &&
        plans.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <div className="flex items-center gap-0.5 rounded-control bg-muted p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setCurrentPlanIndex((prev) =>
                    prev > 0 ? prev - 1 : plans.length - 1,
                  )
                }
              >
                <Icon name="chevron-left" size={12} />
              </Button>
              <span className="px-1 font-mono text-caption font-bold">
                {currentPlanIndex + 1}/{plans.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setCurrentPlanIndex((prev) =>
                    prev < plans.length - 1 ? prev + 1 : 0,
                  )
                }
              >
                <Icon name="chevron-right" size={12} />
              </Button>
            </div>
            <HelpTooltip titleKey="help.slider_title" descKey="help.slider_desc" />
          </div>
        )
      }
      actions={[
        {
          key: "inventory",
          label: "Course List",
          icon: "list",
          onClick: () => setIsInventoryOpen(true),
        },
      ]}
      footer={
        [
          !isManualEdit &&
            onShuffle && {
              key: "shuffle",
              label: "Shuffle",
              icon: "refresh",
              onClick: onShuffle,
              disabled: isGenerating,
              loading: isGenerating,
              tooltip: {
                titleKey: "help.shuffle_title",
                descKey: "help.shuffle_desc",
              },
            },
          !isManualEdit &&
            onExpand &&
            planLimit < 36 && {
              key: "expand",
              label: "Expand",
              icon: "sparkles",
              variant: "highlight",
              onClick: onExpand,
              disabled: isGenerating,
              loading: isGenerating,
              tooltip: {
                titleKey: "help.expand_title",
                descKey: "help.expand_desc",
              },
            },
          isManualEdit && {
            key: "fix-conflicts",
            label: "Fix Conflicts",
            // Kept distinct from Save's "check" (both appear together in the
            // manual-edit footer): this is an AI-assisted action, same family
            // as Expand.
            icon: "sparkles",
            variant: "highlight",
            onClick: handleQuickFix,
            tooltip: {
              titleKey: "help.quick_fix_title",
              descKey: "help.quick_fix_desc",
            },
          },
          isManualEdit && {
            key: "reset",
            label: "Reset",
            icon: "close",
            onClick: handleReset,
          },
          {
            key: "save",
            label: saveLabel,
            icon: "check",
            onClick: handleSave,
            disabled: isSaving || (isManualEdit && !valid),
            loading: isSaving,
          },
        ].filter(Boolean) as MakerFooterAction[]
      }
    >
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent size="md" padded={false}>
          <DialogHeader className="p-4 border-b border-border shrink-0">
            <DialogTitle className="text-body flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <span>Course Inventory</span>
                <Badge className="border-transparent bg-primary/10 px-2 text-caption text-primary">
                  {currentPlan.courses.length}
                </Badge>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  handleSave();
                  setIsInventoryOpen(false);
                }}
                disabled={isSaving || (isManualEdit && !valid)}
              >
                <Icon name="check" className={isSaving ? "animate-pulse" : ""} size={12} />
                {saveLabel}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">{renderInventory()}</div>
        </DialogContent>
      </Dialog>

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
          /*
            Flatten for ink by moving the tokens, not by naming utilities. The
            rules here used to target .bg-slate-50 / .shadow-xl / .rounded-2xl,
            none of which the app emits any more. Because @theme inline compiles
            bg-card to var(--card), re-pointing the token reaches every surface.
          */
          :root {
            --background: #fff;
            --card: #fff;
            --muted: #fff;
            --accent: #fff;
            --border: #cbd5e1;
            --foreground: #000;
          }
          .shadow-card, .shadow-overlay { box-shadow: none !important; }
        }
      `,
        }}
      />

      <div
        id="printable-area"
        className="flex lg:grid lg:grid-cols-[1.2fr_380px] gap-4 md:gap-8 items-stretch h-full overflow-hidden pb-4"
      >
        <div className="w-full bg-card p-1 rounded-panel md:p-2 md:rounded-panel border border-border overflow-auto custom-scrollbar flex flex-col flex-1">
          <div className="flex-1 min-h-0">
            <ScheduleGrid
              courses={currentPlan.courses}
              isCourseCentric={prodiConfig.isCourseCentric}
            />
          </div>
        </div>

        <div className="hidden lg:flex w-full shrink-0 flex-col h-full min-h-0">
          <Card className="border-border shadow-card overflow-hidden rounded-card flex flex-col h-full bg-card">
            <CardHeader className="bg-muted py-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-caption flex items-center gap-2">
                <span>Course Inventory</span>
                <Badge
                  variant="secondary"
                  className="border-transparent bg-primary/10 px-2 py-0.5 text-primary"
                >
                  {currentPlan.courses.length}
                </Badge>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="h-7 px-2 font-mono text-caps uppercase"
              >
                <Icon name="printer" className="mr-1" size={12} />
                Print
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              {renderInventory()}
            </CardContent>
          </Card>
        </div>
      </div>
    </MakerShell>
  );
}
