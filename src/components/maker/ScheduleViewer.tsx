import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Bookmark, Sparkles } from "lucide-react";
import { ScheduleGrid } from "../ScheduleGrid";
import type { Plan } from "@/types";

interface ScheduleViewerProps {
  plans: Plan[];
  currentPlanIndex: number;
  setCurrentPlanIndex: (index: number | ((prev: number) => number)) => void;
  onBack: () => void;
  onSavePlan: (plan: Plan) => void;
  isSaving: boolean;
  onExpand?: () => void;
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
  onExpand,
  isGenerating,
  userData,
}: ScheduleViewerProps) {
  const currentPlan = plans[currentPlanIndex];
  const totalSKS = currentPlan.courses.reduce(
    (sum, c) => sum + (c.sks || 0),
    0,
  );

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
              PLAN {currentPlanIndex + 1} OF {plans.length} • OPTIMIZED BY AI
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
      <div className="flex items-center justify-center no-print sticky top-20 z-10">
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 p-2 rounded-3xl shadow-xl shadow-blue-900/5">
          {/* Save Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSavePlan(currentPlan)}
            disabled={isSaving}
            className="h-10 px-4 font-display text-[11px] font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-700 rounded-2xl transition-all"
          >
            <Bookmark
              className={`w-4 h-4 mr-2 ${isSaving ? "animate-pulse" : ""}`}
            />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <div className="w-px h-6 bg-slate-200" />

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

            <div className="flex flex-col items-center px-4 min-w-[100px]">
              <span className="text-[11px] font-mono font-bold text-slate-900 tracking-tighter leading-none">
                {String(currentPlanIndex + 1).padStart(2, "0")} /{" "}
                {String(plans.length).padStart(2, "0")}
              </span>
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: Math.min(plans.length, 10) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-2 rounded-full transition-all duration-300 ${
                        i === currentPlanIndex % 10
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

          {plans.length < 24 && onExpand && (
            <>
              <div className="w-px h-6 bg-slate-200" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onExpand}
                disabled={isGenerating || (userData?.credits ?? 0) <= 0}
                className="h-10 px-4 font-display text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-all rounded-2xl disabled:opacity-50"
              >
                <Sparkles
                  className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                />
                {isGenerating ? "Reasoning..." : "Expand"}
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
                {currentPlan.courses.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 hover:bg-slate-50/50 transition-colors group flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">
                        {c.code} • CLASS {c.class}
                      </span>
                      <p className="text-[9px] font-bold text-slate-500 mt-1 truncate">
                        {c.lecturer}
                      </p>
                      <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors text-xs leading-tight">
                        {c.name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[8px] h-4 px-1 font-mono border-slate-200 text-slate-600 bg-white shrink-0"
                    >
                      {c.sks} SKS
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
