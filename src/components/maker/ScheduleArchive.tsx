import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  History,
  Trash,
  Brain,
  Bookmark,
  Pencil,
  Check,
  X,
  Share2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { ArchivedPlan, Plan } from "@/types";

interface ScheduleArchiveProps {
  archived: ArchivedPlan[] | undefined;
  onImport: (allPlans: Plan[], index: number) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onShare: (id: string) => void;
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
    <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
      <History className="w-6 h-6 text-slate-300" />
    </div>
    <div className="space-y-1">
      <p className="font-display font-bold text-slate-400">{message}</p>
      <p className="text-xs text-slate-400">
        Plans will appear here once created.
      </p>
    </div>
  </div>
);

const PlanCard = ({
  plan,
  isAi,
  contextPlans,
  index,
  editingId,
  editName,
  setEditName,
  handleStartEdit,
  handleSaveRename,
  setEditingId,
  onImport,
  onDelete,
  onShare,
}: {
  plan: ArchivedPlan;
  isAi?: boolean;
  contextPlans: Plan[];
  index: number;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  handleStartEdit: (plan: ArchivedPlan) => void;
  handleSaveRename: (id: string) => void;
  setEditingId: (id: string | null) => void;
  onImport: (allPlans: Plan[], index: number) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
}) => {
  const isEditing = editingId === plan._id;

  return (
    <Card
      key={plan._id}
      className={`group relative border-slate-200/60 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white ${
        isAi
          ? "hover:border-violet-300 shadow-violet-50/50"
          : "hover:border-blue-300 shadow-blue-50/50"
      }`}
    >
      <div className="p-3">
        {/* Compact Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  className="text-xs font-bold text-slate-800 bg-slate-50 border border-blue-200 rounded px-1.5 py-0.5 w-full outline-none focus:ring-1 ring-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename(plan._id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleSaveRename(plan._id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-slate-400 hover:bg-slate-50"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3 className="text-xs font-bold text-slate-800 truncate group-hover/title:text-blue-600 transition-colors">
                  {plan.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-100 md:opacity-0 md:group-hover/title:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
                  onClick={() => handleStartEdit(plan)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
            <p className="text-[8px] font-mono text-slate-400 mt-0.5">
              {new Date(plan.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}{" "}
              • {plan.data.courses.length} MATKUL
            </p>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-0.5 -mt-1 -mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:text-blue-500 hover:bg-blue-50 shrink-0"
                onClick={() => onShare(plan._id)}
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                onClick={() => onDelete(plan._id)}
              >
                <Trash className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-slate-50 border border-slate-100/50 rounded-lg px-2 py-1 flex items-center justify-between">
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
              SKS
            </span>
            <span className="text-[10px] font-bold text-slate-700">
              {plan.data.courses.reduce((sum, c) => sum + (c.sks || 0), 0)}
            </span>
          </div>
          <div
            className={`flex-1 border rounded-lg px-2 py-1 flex items-center justify-between ${
              isAi
                ? "bg-violet-50/50 border-violet-100"
                : "bg-emerald-50/50 border-emerald-100"
            }`}
          >
            <span
              className={`text-[8px] font-mono uppercase tracking-tighter ${isAi ? "text-violet-500" : "text-emerald-500"}`}
            >
              TYPE
            </span>
            <span
              className={`text-[9px] font-bold ${isAi ? "text-violet-700" : "text-emerald-700"}`}
            >
              {isAi ? "AI" : "MANUAL"}
            </span>
          </div>
        </div>

        {/* Primary Action */}
        <Button
          className={`w-full h-8 rounded-lg text-[10px] font-bold shadow-sm transition-all ${
            isAi
              ? "bg-violet-600 hover:bg-violet-700 text-white"
              : "bg-slate-800 hover:bg-slate-900 text-white"
          }`}
          onClick={() => onImport(contextPlans, index)}
        >
          Restore to Grid
        </Button>
      </div>
    </Card>
  );
};

export function ScheduleArchive({
  archived,
  onImport,
  onDelete,
  onRename,
  onShare,
}: ScheduleArchiveProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const aiPlans = archived?.filter((p) => p.isSmartGenerated) || [];
  const manualPlans = archived?.filter((p) => !p.isSmartGenerated) || [];

  const handleStartEdit = (plan: ArchivedPlan) => {
    setEditingId(plan._id);
    setEditName(plan.name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const aiDataPlans = aiPlans.map((p) => p.data);
  const manualDataPlans = manualPlans.map((p) => p.data);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          <h2 className="font-display font-bold text-slate-800 tracking-tight">
            Plan Archive
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Storage Capacity</span>
            <span
              className={`${(archived?.length || 0) >= 30 ? "text-red-500" : "text-blue-600"}`}
            >
              {archived?.length || 0} / 30
            </span>
          </div>
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className={`h-full transition-all duration-500 ${
                (archived?.length || 0) >= 25 ? "bg-red-500" : "bg-blue-600"
              }`}
              style={{
                width: `${Math.min(((archived?.length || 0) / 30) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultValue={aiPlans.length > 0 ? "ai" : "saved"}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100/50 p-1 rounded-2xl">
          <TabsTrigger
            value="ai"
            className="rounded-xl font-display font-medium data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-sm"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Generated
            {aiPlans.length > 0 && (
              <span className="ml-2 bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                {aiPlans.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="rounded-xl font-display font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
          >
            <Bookmark className="w-4 h-4 mr-2" />
            Saved Plans
            {manualPlans.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md text-[10px] font-bold">
                {manualPlans.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiPlans.map((plan, i) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                isAi
                contextPlans={aiDataPlans}
                index={i}
                editingId={editingId}
                editName={editName}
                setEditName={setEditName}
                handleStartEdit={handleStartEdit}
                handleSaveRename={handleSaveRename}
                setEditingId={setEditingId}
                onImport={onImport}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
            {aiPlans.length === 0 && (
              <EmptyState message="No AI generated plans yet" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manualPlans.map((plan, i) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                contextPlans={manualDataPlans}
                index={i}
                editingId={editingId}
                editName={editName}
                setEditName={setEditName}
                handleStartEdit={handleStartEdit}
                handleSaveRename={handleSaveRename}
                setEditingId={setEditingId}
                onImport={onImport}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
            {manualPlans.length === 0 && (
              <EmptyState message="No manually saved plans yet" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
