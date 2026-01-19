import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Copy,
  Database,
  BookOpen,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { MasterDataTab } from "./admin/MasterDataTab";
import { CurriculumTab } from "./admin/CurriculumTab";
import { IntelligenceScraperDialog } from "./admin/dialogs/IntelligenceScraperDialog";
import { CurriculumImportDialog } from "./admin/dialogs/CurriculumImportDialog";

export function AdminDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const clearMaster = useMutation(api.admin.clearMasterData);
  const adminPing = useQuery(api.admin.pingAdmin);

  console.log("DEBUG: Admin Ping Status:", adminPing);

  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isCurriculumDialogOpen, setIsCurriculumDialogOpen] = useState(false);

  // Auth Check
  if (user === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-40 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
          Authenticating Architect...
        </p>
      </div>
    );
  }

  if (user === null || !user.isAdmin) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="flex flex-col items-center justify-center min-h-full py-20 px-4 space-y-8 animate-in zoom-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-red-100 blur-2xl rounded-full opacity-20 animate-pulse" />
            <AlertCircle className="w-16 h-16 text-red-500 relative" />
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-3xl font-display font-bold text-slate-900 italic">
              Access Denied
            </h1>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
              Your identity is not recognized as a{" "}
              <strong>Core Architect</strong>. Access to university master data
              is restricted.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Button
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-display text-sm tracking-wide"
              onClick={() => (window.location.href = "/")}
            >
              Return to Planner
            </Button>

            {user?.tokenIdentifier && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="space-y-1 text-center">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                    Architect Identity Token
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-white rounded-lg border border-slate-100 break-all text-left">
                      <code className="text-[9px] text-blue-700 font-mono leading-tight">
                        {user.tokenIdentifier}
                      </code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-white"
                      onClick={() => {
                        navigator.clipboard.writeText(user.tokenIdentifier);
                        toast.success("Token copied to clipboard");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 text-center leading-normal">
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
      toast.success("Core data purged.");
    } catch (err: any) {
      toast.error("Cleanup failed.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/10">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4">
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
              Architectural Core
            </h1>
            <p className="text-slate-500 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em]">
              Master Data Control Center
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none font-mono text-[9px] uppercase tracking-widest border-red-200 text-red-600 hover:bg-red-50 h-9"
              onClick={handleClearMaster}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              <span className="md:inline">Purge Master</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="master" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl mb-6 w-full md:w-auto h-auto flex overflow-hidden">
            <TabsTrigger
              value="master"
              className="flex-1 md:flex-none rounded-lg font-mono text-[9px] uppercase tracking-widest px-3 md:px-6 py-2"
            >
              <Database className="w-3.5 h-3.5 mr-2" /> Master Schedule
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="flex-1 md:flex-none rounded-lg font-mono text-[9px] uppercase tracking-widest px-3 md:px-6 py-2"
            >
              <BookOpen className="w-3.5 h-3.5 mr-2" /> Curriculum
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
