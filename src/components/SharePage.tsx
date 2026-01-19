import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "./ScheduleGrid";
import {
  ChevronLeft,
  LogIn,
  BookmarkPlus,
  Share2,
  History,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";

export function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [isImporting, setIsImporting] = useState(false);

  const sharedPlan = useQuery(api.plans.getSharedPlan, {
    shareId: shareId || "",
  });

  const savePlanMutation = useMutation(api.plans.savePlan);

  const handleImport = async () => {
    if (!sharedPlan) return;

    setIsImporting(true);
    try {
      await savePlanMutation({
        name: `${sharedPlan.name} (Shared)`,
        data: JSON.stringify(sharedPlan.data),
        isSmartGenerated: sharedPlan.isSmartGenerated,
        generatedBy: sharedPlan.generatedBy,
      });
      toast.success("Plan imported to your account! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      toast.error("Failed to import: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (sharedPlan === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Fetching shared plan...</p>
        </div>
      </div>
    );
  }

  if (sharedPlan === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-none shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-slate-900 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-display font-black">Plan Not Found</h1>
            <p className="text-slate-400 text-sm mt-2">
              The link might be expired or incorrect.
            </p>
          </div>
          <CardContent className="p-8">
            <Button
              className="w-full h-12 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSKS = sharedPlan.data.courses.reduce(
    (sum: number, c: any) => sum + (c.sks || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="w-9 h-9 rounded-xl hover:bg-slate-100"
            >
              <ChevronLeft size={20} />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-slate-900 truncate max-w-[120px] md:max-w-none pr-4">
                {sharedPlan.name}
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase hidden md:block">
                SHARED KRS PLAN • {sharedPlan.data.courses.length} MATKUL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button className="h-9 px-3 md:px-4 rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white gap-2">
                  <LogIn size={14} />
                  <span className="hidden md:inline">Login to Import</span>
                  <span className="md:hidden">Login</span>
                </Button>
              </SignInButton>
            ) : (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="h-9 px-3 md:px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-200"
              >
                <BookmarkPlus size={14} />
                <span className="hidden md:inline">
                  {isImporting ? "Importing..." : "Add to My Archive"}
                </span>
                <span className="md:hidden">
                  {isImporting ? "..." : "Import"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="container max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Banner */}
        {sharedPlan.isSmartGenerated && (
          <div className="bg-violet-600 rounded-3xl p-4 md:p-6 text-white relative overflow-hidden shadow-xl shadow-violet-200">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-violet-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-200">
                    AI Optimized Schedule
                  </span>
                </div>
                <p className="text-lg font-display font-medium max-w-md">
                  This schedule was generated using{" "}
                  <strong>Architect Engine</strong> for maximum time efficiency.
                </p>
              </div>
              <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-8">
                <span className="text-[10px] uppercase font-bold text-violet-200">
                  Total Accumulation
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-black">
                    {totalSKS}
                  </span>
                  <span className="text-sm font-bold opacity-70">SKS</span>
                </div>
              </div>
            </div>
            <Sparkles className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 opacity-50" />
          </div>
        )}

        {!sharedPlan.isSmartGenerated && (
          <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-display font-medium">
                Manual KRS Plan
              </h3>
              <p className="text-slate-400 text-xs">
                Curated by a fellow student
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold">
                  Total SKS
                </p>
                <p className="text-2xl font-display font-black">{totalSKS}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-xl shadow-blue-900/5 overflow-hidden">
              <ScheduleGrid courses={sharedPlan.data.courses} />
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-3xl">
              <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-slate-200 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-display">
                    Inventory
                  </CardTitle>
                  <p className="text-[10px] text-slate-400">
                    {sharedPlan.data.courses.length} courses total
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="no-print h-8 rounded-xl text-[10px] font-bold bg-white"
                >
                  Print Report
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {sharedPlan.data.courses.map((c: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {c.code} • {c.class}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 border-slate-200"
                        >
                          {c.sks} SKS
                        </Badge>
                      </div>
                      <p className="font-bold text-slate-900 text-xs leading-tight mb-1">
                        {c.name}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 mt-1 truncate">
                        {c.lecturer}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <History size={20} />
              </div>
              <h4 className="font-bold text-blue-900">
                Want to make your own?
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                Join 1,000+ students using KRSan to eliminate conflicts and
                maximize academic efficiency.
              </p>
              <Button
                variant="ghost"
                className="w-full justify-start p-0 text-blue-600 font-bold text-xs hover:bg-transparent"
                onClick={() => navigate("/")}
              >
                Get Started for Free →
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="container max-w-5xl mx-auto px-4 py-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.webp"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-display font-black text-slate-900 tracking-tighter">
              KRSan
            </span>
          </div>
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            © 2026 Academic Optimization Systems
          </p>
        </div>
      </footer>
    </div>
  );
}
