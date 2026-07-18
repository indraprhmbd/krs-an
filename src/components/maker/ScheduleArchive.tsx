import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SpotIcon, type SpotIconName } from "@/components/ui/spot-icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { ArchivedPlan, Plan } from "@/types";
import { MakerShell } from "./MakerShell";
import { cn } from "@/lib/utils";

interface ScheduleArchiveProps {
  archived: ArchivedPlan[] | undefined;
  onImport: (allPlans: Plan[], index: number) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onShare: (id: string) => void;
  /** True when these plans live in localStorage rather than the account. */
  isLocal?: boolean;
}

const EmptyState = ({
  message,
  spot,
}: {
  message: string;
  spot: SpotIconName;
}) => (
  <div className="col-span-full py-12 text-center space-y-4 bg-muted rounded-card border border-border border-dashed">
    <div className="mx-auto flex items-center justify-center">
      <SpotIcon name={spot} size={56} />
    </div>
    <div className="space-y-1">
      <p className="font-bold text-muted-foreground">{message}</p>
      <p className="text-caption text-muted-foreground">
        Jadwal akan muncul di sini setelah dibuat.
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
      className={`group relative border-border/60 transition-all rounded-card overflow-hidden bg-card ${
        isAi ? "hover:border-highlight" : "hover:border-primary"
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
                  className="text-caption font-bold text-foreground bg-muted border border-border rounded px-1.5 py-0.5 w-full outline-none focus:ring-1 ring-ring"
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
                    className="h-6 w-6 shrink-0 text-primary hover:bg-muted"
                    onClick={() => handleSaveRename(plan._id)}
                  >
                    <Icon name="check" size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:bg-muted"
                    onClick={() => setEditingId(null)}
                  >
                    <Icon name="close" size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                <h3 className="text-caption font-bold text-foreground truncate group-hover/title:text-primary transition-colors">
                  {plan.name}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-100 md:opacity-0 md:group-hover/title:opacity-100 text-muted-foreground hover:text-primary transition-all"
                  onClick={() => handleStartEdit(plan)}
                >
                  <Icon name="pencil" size={12} />
                </Button>
              </div>
            )}
            <p className="text-grid font-mono text-muted-foreground mt-0.5">
              {new Date(plan.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}{" "}
              | {plan.data.courses.length} MATKUL
            </p>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-0.5 -mt-1 -mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
                onClick={() => onShare(plan._id)}
              >
                <Icon name="share" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => onDelete(plan._id)}
              >
                <Icon name="trash" size={14} />
              </Button>
            </div>
          )}
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-muted border border-border/50 rounded-control px-2 py-1 flex items-center justify-between">
            <span className="text-caps font-mono text-muted-foreground uppercase">
              SKS
            </span>
            <span className="text-caption font-bold text-foreground">
              {plan.data.courses.reduce((sum, c) => sum + (c.sks || 0), 0)}
            </span>
          </div>
          <div
            className={`flex-1 border rounded-control px-2 py-1 flex items-center justify-between ${
              isAi
                ? "bg-highlight/10 border-highlight/30"
                : "bg-muted/50 border-border"
            }`}
          >
            <span
              className={`text-caps font-mono uppercase ${isAi ? "text-highlight" : "text-primary"}`}
            >
              TIPE
            </span>
            <span
              className={`text-caption font-bold ${isAi ? "text-highlight" : "text-primary"}`}
            >
              {isAi ? "AI" : "MANUAL"}
            </span>
          </div>
        </div>

        {/* Primary Action */}
        <Button
          className={`w-full h-8 rounded-control text-caption font-bold transition-all ${
            isAi
              ? "bg-highlight hover:bg-highlight/90 text-highlight-foreground"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
          onClick={() => onImport(contextPlans, index)}
        >
          Muat ke Penampil
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
  isLocal = false,
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

  const count = archived?.length || 0;

  return (
    <MakerShell
      title="Arsip Jadwal"
      description={
        <div className="flex items-center gap-2">
          <span className="font-mono text-caps uppercase text-muted-foreground">
            Penyimpanan
          </span>
          <span
            className={cn(
              "font-mono text-caption font-bold",
              count >= 30 ? "text-destructive" : "text-primary",
            )}
          >
            {count} / 30
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full border border-border/50 bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-500",
                count >= 25 ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${Math.min((count / 30) * 100, 100)}%` }}
            />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4 pb-6">
        {isLocal && (
          <div className="flex items-start gap-2 rounded-card border border-border bg-muted p-2.5 text-caption text-muted-foreground">
            <Icon name="bookmark" size={14} className="mt-0.5 shrink-0" />
            <p>
              Jadwal disimpan di perangkat ini saja. Masuk untuk menyimpan
              lintas perangkat, membagikannya, dan menggunakan Smart Generate.
              Jadwal di sini bisa diimpor nanti.
            </p>
          </div>
        )}

        <Tabs
          defaultValue={aiPlans.length > 0 ? "ai" : "saved"}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        <div className="sticky top-0 z-20 bg-background pt-2 pb-4 mb-2 shrink-0">
          <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-card">
            <TabsTrigger
              value="ai"
              className="rounded-control font-medium data-[state=active]:bg-card data-[state=active]:text-highlight"
            >
              <Icon name="sparkles" className="mr-2" />
              AI
              {aiPlans.length > 0 && (
                <span className="ml-2 bg-highlight/10 text-highlight px-1.5 py-0.5 rounded-full text-caption font-bold">
                  {aiPlans.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="rounded-control font-medium data-[state=active]:bg-card data-[state=active]:text-primary"
            >
              <Icon name="bookmark" className="mr-2" />
              Tersimpan
              {manualPlans.length > 0 && (
                <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-caption font-bold">
                  {manualPlans.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <EmptyState message="Belum ada jadwal AI" spot="idea" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <EmptyState message="Belum ada jadwal tersimpan" spot="todo-list" />
            )}
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </MakerShell>
  );
}
