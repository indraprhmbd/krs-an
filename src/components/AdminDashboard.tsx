import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";

import { MasterDataTab } from "./admin/MasterDataTab";
import { CurriculumTab } from "./admin/CurriculumTab";
import { ProdiTab } from "./admin/ProdiTab";
import { IntelligenceScraperDialog } from "./admin/dialogs/IntelligenceScraperDialog";
import { CurriculumImportDialog } from "./admin/dialogs/CurriculumImportDialog";

export function AdminDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const clearMaster = useMutation(api.admin.clearMasterData);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useLocalStorage("admin-active-tab", "master");

  // Auth Check
  if (user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-20">
        <Icon name="spinner" size={28} className="animate-spin text-primary" />
        <p className="font-mono text-caps uppercase text-muted-foreground">
          Authenticating Architect...
        </p>
      </div>
    );
  }

  if (user === null || !user.isAdmin) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-12">
          <Icon name="alert" size={48} className="text-destructive" />

          <div className="space-y-2 text-center">
            <h1 className="text-headline text-foreground">
              Akses Ditolak
            </h1>
            <p className="mx-auto max-w-xs text-muted-foreground">
              Identitas Anda tidak dikenali sebagai{" "}
              <strong>Core Architect</strong>. Akses ke data master universitas
              dibatasi.
            </p>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-4">
            <Button size="lg" onClick={() => (window.location.href = "/")}>
              Kembali
            </Button>

            {user?.tokenIdentifier && (
              <div className="space-y-3 rounded-card border border-border bg-muted p-4">
                <p className="text-center font-mono text-caps uppercase text-muted-foreground">
                  Architect Identity Token
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 break-all rounded-control border border-border bg-card p-2 text-left">
                    <code className="font-mono text-caption text-primary">
                      {user.tokenIdentifier}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Copy token"
                    onClick={() => {
                      navigator.clipboard.writeText(user.tokenIdentifier);
                      toast.success("Token disalin ke papan klip");
                    }}
                  >
                    <Icon name="copy" size={14} />
                  </Button>
                </div>
                <p className="text-center text-caption text-muted-foreground">
                  Use this token with the <code>makeAdmin</code> mutation in
                  your developer console to gain access.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleClearMaster = async () => {
    if (!confirm("This will purge ALL core master data. Proceed?")) return;
    try {
      await clearMaster({});
      toast.success("Data utama dibersihkan.");
    } catch (err: any) {
      toast.error("Pembersihan gagal.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-4 p-4">
        <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-4">
          <div className="space-y-0.5">
            <h1 className="text-headline tracking-tight text-foreground">
              Architectural Core
            </h1>
            <p className="font-mono text-caps uppercase text-muted-foreground">
              Master Data Control Center
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              variant="outline"
              className="flex-1 font-mono text-caps uppercase text-destructive hover:bg-destructive/10 hover:text-destructive md:flex-none"
              onClick={handleClearMaster}
            >
              <Icon name="trash" size={14} />
              <span>Purge Master</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 flex h-auto w-full overflow-hidden rounded-control bg-muted p-1 md:w-auto">
            <TabsTrigger
              value="master"
              className="flex-1 rounded-control px-3 py-2 font-mono text-caps uppercase md:flex-none md:px-6"
            >
              <Icon name="database" size={14} className="mr-2" /> Master Schedule
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="flex-1 rounded-control px-3 py-2 font-mono text-caps uppercase md:flex-none md:px-6"
            >
              <Icon name="database" size={14} className="mr-2" /> Curriculum
            </TabsTrigger>
            <TabsTrigger
              value="prodi"
              className="flex-1 rounded-control px-3 py-2 font-mono text-caps uppercase md:flex-none md:px-6"
            >
              <Icon name="list" size={14} className="mr-2" /> Prodi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="master">
            <MasterDataTab onOpenScraper={() => setIsAiDialogOpen(true)} />
          </TabsContent>

          <TabsContent value="curriculum">
            <CurriculumTab
              onOpenImport={() => setIsCurriculumDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="prodi">
            <ProdiTab />
          </TabsContent>
        </Tabs>

        <IntelligenceScraperDialog
          isOpen={isAiDialogOpen}
          onClose={() => setIsAiDialogOpen(false)}
        />

        <CurriculumImportDialog
          isOpen={isCurriculumDialogOpen}
          onClose={() => setIsCurriculumDialogOpen(false)}
        />
      </div>
    </div>
  );
}
