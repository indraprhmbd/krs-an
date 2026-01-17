import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  BookOpen,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@clerk/clerk-react";
import { Textarea } from "@/components/ui/textarea";

export function AdminDashboard() {
  const user = useQuery(api.users.getCurrentUser);
  const masterCourses = useQuery(api.admin.listMasterCourses, {});
  const bulkImport = useMutation(api.admin.bulkImportMaster);
  const clearMaster = useMutation(api.admin.clearMasterData);
  const { getToken } = useAuth();

  const [isImporting, setIsImporting] = useState(false);
  const [isAiCleaning, setIsAiCleaning] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

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
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-display font-bold">Access Denied</h1>
        <p className="text-slate-500">
          Only authorized architects can access the core. Use your standard
          terminal.
        </p>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Return to Base
        </Button>
        {user?.tokenIdentifier && (
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-[10px] font-mono text-slate-300 uppercase tracking-widest mb-2">
              Architect Identity Token
            </p>
            <code className="px-3 py-1 bg-slate-50 rounded text-[10px] text-slate-400 font-mono break-all max-w-xs">
              {user.tokenIdentifier}
            </code>
          </div>
        )}
      </div>
    );
  }

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Basic validation
      if (!Array.isArray(data))
        throw new Error("JSON must be an array of courses");

      await bulkImport({ courses: data });
      toast.success(
        `Successfully deployed ${data.length} strategy components.`,
      );
    } catch (err: any) {
      toast.error("Deployment failed: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAiCleanup = async () => {
    if (!rawText.trim()) return;
    setIsAiCleaning(true);
    try {
      const clerkToken = await getToken();
      const baseUrl = import.meta.env.VITE_AI_API_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/process-master-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ text: rawText }),
      });

      if (!res.ok) throw new Error("AI cleaning failed");
      const data = await res.json();

      await bulkImport({ courses: data });
      toast.success(
        `AI successfully cleaned and deployed ${data.length} components.`,
      );
      setIsAiDialogOpen(false);
      setRawText("");
    } catch (err: any) {
      toast.error("Cleanup failed: " + err.message);
    } finally {
      setIsAiCleaning(false);
    }
  };

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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-4xl font-display font-bold tracking-tight italic">
            Architectural Core
          </h1>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em]">
            Master Data Control Center
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="font-mono text-[10px] uppercase tracking-widest border-red-100 text-red-600 hover:bg-red-50"
            onClick={handleClearMaster}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Purge Core
          </Button>
        </div>
      </div>

      <Tabs defaultValue="master" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl mb-8">
          <TabsTrigger
            value="master"
            className="rounded-lg font-mono text-[10px] uppercase tracking-widest px-8"
          >
            <Database className="w-3.5 h-3.5 mr-2" /> Master Schedule
          </TabsTrigger>
          <TabsTrigger
            value="curriculum"
            className="rounded-lg font-mono text-[10px] uppercase tracking-widest px-8"
          >
            <BookOpen className="w-3.5 h-3.5 mr-2" /> Curriculum (1-8)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-6">
          <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="font-display italic">
                    Master Data Repository
                  </CardTitle>
                  <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-1">
                    Global Strategy Database
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAiDialogOpen(true)}
                    className="rounded-xl px-6 font-mono text-[10px] uppercase tracking-widest border-blue-100 text-blue-700 hover:bg-blue-50"
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-2" />
                    AI Architect Tool
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      id="master-import"
                      onChange={handleBulkImport}
                    />
                    <Label htmlFor="master-import">
                      <Button
                        asChild
                        className="bg-slate-900 hover:bg-slate-800 rounded-xl px-6 font-mono text-[10px] uppercase tracking-widest cursor-pointer shadow-lg shadow-slate-100"
                      >
                        <span>
                          {isImporting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 mr-2" />
                          )}
                          Direct Deployment
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-6 py-4 text-left">Code</th>
                      <th className="px-6 py-4 text-left">Course Name</th>
                      <th className="px-6 py-4 text-left">Class</th>
                      <th className="px-6 py-4 text-left">Prodi</th>
                      <th className="px-6 py-4 text-left">SKS</th>
                      <th className="px-6 py-4 text-left">Lecturer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-sans">
                    {masterCourses?.slice(0, 50).map((c: any) => (
                      <tr
                        key={c._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-blue-900">
                          {c.code}
                        </td>
                        <td className="px-6 py-4 font-medium">{c.name}</td>
                        <td className="px-6 py-4 text-slate-500">{c.class}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {c.prodi}
                        </td>
                        <td className="px-6 py-4 font-mono">{c.sks}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs overflow-hidden max-w-[150px] truncate">
                          {c.lecturer}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {masterCourses?.length === 0 && (
                  <div className="p-20 text-center text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                    No strategy components loaded in core database.
                  </div>
                )}
                {(masterCourses?.length ?? 0) > 50 && (
                  <div className="p-4 text-center bg-slate-50 text-[10px] font-mono text-slate-300">
                    Showing first 50 of {masterCourses?.length} components.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum">
          <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-display font-bold text-slate-400">
              Curriculum Engine in Final Tuning
            </h3>
            <p className="text-slate-300 font-mono text-[10px] uppercase tracking-widest mt-2 leading-relaxed">
              Defining semester 1-8 logic and odd/even term filtering.
              <br />
              Deploy curriculum items directly to map codes to semesters.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-3xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-slate-900 italic flex items-center gap-3">
              <Wand2 className="w-6 h-6 text-blue-700" />
              Intelligence Scraper
            </DialogTitle>
            <DialogDescription className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pt-2 border-t border-slate-100">
              Paste raw text from the university portal. AI will architect the
              schema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={rawText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setRawText(e.target.value)
              }
              placeholder="Paste messy schedule text here... (Example: Prodi Informatika, MK: Data Science, Jadwal: Senin 07:00-09:00...)"
              className="min-h-[300px] bg-slate-50 border-none rounded-2xl p-6 font-mono text-xs leading-relaxed focus-visible:ring-blue-700"
            />
            <div className="flex items-center gap-2 p-4 bg-blue-50/50 rounded-xl border border-blue-50">
              <AlertCircle className="w-4 h-4 text-blue-700 flex-shrink-0" />
              <p className="text-[10px] text-blue-900 leading-normal">
                AI will attempt to match:{" "}
                <strong>
                  Code, Name, SKS, Prodi, Class, Lecturer, Room, and Schedule
                </strong>
                . Verify output after deployment.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsAiDialogOpen(false)}
              className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAiCleanup}
              disabled={isAiCleaning || !rawText.trim()}
              className="bg-blue-700 hover:bg-blue-800 text-white font-display font-medium px-8 rounded-xl shadow-lg shadow-blue-100 min-w-[160px]"
            >
              {isAiCleaning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Architecting...
                </>
              ) : (
                "Execute Deployment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
