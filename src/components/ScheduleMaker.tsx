import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useMutation as useReactQueryMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Loader2,
  Brain,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileJson,
  Edit3,
  Trash,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScheduleGrid } from "./ScheduleGrid";
import { generatePlans } from "@/lib/scheduler";
import type { Course, Plan } from "@/types";
import { PlanAnalysis } from "./PlanAnalysis";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, GraduationCap, Sparkles, PlusCircle } from "lucide-react";
import { CourseEditor } from "./CourseEditor";
import { downloadJSON, parseJSONFile } from "@/lib/data-io";

export function ScheduleMaker() {
  const { getToken } = useAuth();
  const userData = useQuery(api.users.getCurrentUser);
  const generateServiceToken = useMutation(api.users.generateServiceToken);

  const [step, setStep] = useState<"config" | "upload" | "select" | "view">(
    "config",
  );
  const [sessionProfile, setSessionProfile] = useState<{
    prodi: string;
    semester: number;
    maxSks: number;
    useMaster: boolean;
  }>({
    prodi: "INFORMATIKA",
    semester: 2,
    maxSks: 24,
    useMaster: true,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  // Manual CRUD state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isMasterSearchOpen, setIsMasterSearchOpen] = useState(false);

  // Convex Queries
  const allMasterCourses = useQuery(api.admin.listMasterCourses, {
    prodi: sessionProfile.prodi,
  });
  const curriculum = useQuery(api.admin.listCurriculum, {
    prodi: sessionProfile.prodi,
    semester: sessionProfile.semester,
  });

  // AI Backend Mutation
  const aiMutation = useReactQueryMutation({
    mutationFn: async (file: File) => {
      // 1. Check Convex Credits
      const tokenResult = (await generateServiceToken()) as any;
      if (!tokenResult.allowed) throw new Error("Daily limit reached");

      // 2. Call FastAPI
      const clerkToken = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = import.meta.env.VITE_AI_API_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/parse-and-clean`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clerkToken}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Processing failed");
      return res.json();
    },
    onSuccess: (data: Course[]) => {
      setCourses(data);
      // Auto-select unique courses
      const uniqueCodes = Array.from(new Set(data.map((c) => c.code)));
      setSelectedCodes(uniqueCodes);
      setStep("select");
      toast.success("Schedule parsed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to parse PDF");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) aiMutation.mutate(file);
  };

  const handleGenerate = () => {
    const generated = generatePlans(courses, selectedCodes);
    if (generated.length === 0) {
      toast.error(
        "No valid combinations found. Try selecting different classes.",
      );
      return;
    }
    setPlans(generated);
    setCurrentPlanIndex(0);
    setStep("view");
  };

  const toggleCourse = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleManualInput = () => {
    setEditingCourse(null);
    setIsEditorOpen(true);
  };

  const handleEditCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse(course);
    setIsEditorOpen(true);
  };

  const handleDeleteCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    toast.success("Academic component removed.");
  };

  const handleSaveCourse = (course: Course) => {
    setCourses((prev) => {
      const exists = prev.find((c) => c.id === course.id);
      if (exists) {
        return prev.map((c) => (c.id === course.id ? course : c));
      }
      return [...prev, course];
    });

    // Handle auto-selection for new courses
    if (!selectedCodes.includes(course.code)) {
      setSelectedCodes((prev) => [...prev, course.code]);
    }

    if (step === "upload") setStep("select");
    toast.success("Strategy component synced.");
  };

  const handleExportJSON = () => {
    if (courses.length === 0) return;
    downloadJSON(courses, `krsan-data-${Date.now()}.json`);
    toast.success("Strategy data exported.");
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseJSONFile(file);
      setCourses(data);
      const uniqueCodes = Array.from(new Set(data.map((c) => c.code)));
      setSelectedCodes(uniqueCodes);
      setStep("select");
      toast.success("Strategy data imported.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAutoLoad = () => {
    if (!curriculum || !allMasterCourses) return;

    const mandatoryCodes = new Set(curriculum.map((c) => c.code));
    const filteredCourses = allMasterCourses.filter((c) =>
      mandatoryCodes.has(c.code),
    );

    const coursesWithIds = filteredCourses.map((c) => ({
      ...c,
      id: `${c.code}-${c.class}-${Math.random().toString(36).substr(2, 9)}`,
    }));

    setCourses(coursesWithIds as any);
    setSelectedCodes(Array.from(mandatoryCodes));
    setStep("select");
    toast.success(
      `${mandatoryCodes.size} academic components loaded from curriculum.`,
    );
  };

  const handleStartSession = (mode: "master" | "manual") => {
    if (mode === "master") {
      handleAutoLoad();
    } else {
      setStep("upload");
    }
  };

  // Master Search logic
  const [masterSearchQuery, setMasterSearchQuery] = useState("");
  const filteredMaster = allMasterCourses?.filter(
    (c) =>
      c.code.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(masterSearchQuery.toLowerCase()),
  );

  const handleAddMasterCourse = (masterCourse: any) => {
    const newCourse = {
      ...masterCourse,
      id: `${masterCourse.code}-${masterCourse.class}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setCourses((prev) => [...prev, newCourse]);
    if (!selectedCodes.includes(masterCourse.code)) {
      setSelectedCodes((prev) => [...prev, masterCourse.code]);
    }
    toast.success(`${masterCourse.name} added to session.`);
    setIsMasterSearchOpen(false);
  };

  if (step === "config") {
    return (
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
          <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none px-4 py-1 rounded-full font-mono text-[10px] tracking-widest mb-2">
            ACADEMIC YEAR 2024/2025
          </Badge>
          <h2 className="text-4xl font-bold font-display text-slate-900 tracking-tight italic">
            Architect Your Semester
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
            Begin your planning session by selecting your academic profile or
            uploading a custom schedule architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Master Data Option */}
          <Card
            className={`relative group transition-all duration-500 border-2 ${sessionProfile.useMaster ? "border-blue-700 bg-blue-50/10 shadow-2xl shadow-blue-50" : "border-slate-100 hover:border-blue-200"}`}
            onClick={() =>
              setSessionProfile((p) => ({ ...p, useMaster: true }))
            }
          >
            <CardHeader className="p-8">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                <GraduationCap
                  className={`w-7 h-7 ${sessionProfile.useMaster ? "text-blue-700" : "text-slate-400"}`}
                />
              </div>
              <CardTitle className="text-xl font-display mb-2">
                University Master
              </CardTitle>
              <CardDescription>
                Auto-load courses from the university curriculum. Precision
                engineered.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                    Prodi
                  </Label>
                  <Input
                    value={sessionProfile.prodi}
                    onChange={(e) =>
                      setSessionProfile((p) => ({
                        ...p,
                        prodi: e.target.value.toUpperCase(),
                      }))
                    }
                    className="bg-white/50 border-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                    Semester
                  </Label>
                  <Input
                    type="number"
                    value={sessionProfile.semester}
                    onChange={(e) =>
                      setSessionProfile((p) => ({
                        ...p,
                        semester: parseInt(e.target.value),
                      }))
                    }
                    className="bg-white/50 border-slate-100"
                  />
                </div>
              </div>
              <Button
                onClick={() => handleStartSession("master")}
                disabled={!sessionProfile.useMaster}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-12 shadow-lg shadow-blue-100"
              >
                Sync University Data
              </Button>
            </CardContent>
          </Card>

          {/* Manual/Upload Option */}
          <Card
            className={`relative group transition-all duration-500 border-2 ${!sessionProfile.useMaster ? "border-slate-900 bg-slate-50 shadow-2xl shadow-slate-200" : "border-slate-100 hover:border-slate-200"}`}
            onClick={() =>
              setSessionProfile((p) => ({ ...p, useMaster: false }))
            }
          >
            <CardHeader className="p-8">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                <Sparkles
                  className={`w-7 h-7 ${!sessionProfile.useMaster ? "text-slate-900" : "text-slate-400"}`}
                />
              </div>
              <CardTitle className="text-xl font-display mb-2">
                Custom Architect
              </CardTitle>
              <CardDescription>
                Upload your own PDF or start from an empty canvas. Complete
                freedom.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 flex items-end grow">
              <Button
                variant="outline"
                onClick={() => handleStartSession("manual")}
                disabled={sessionProfile.useMaster}
                className="w-full border-slate-200 hover:bg-white hover:text-slate-900 rounded-xl h-12"
              >
                Manual Architecture
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-300 uppercase tracking-[0.4em] pt-10">
          POWERED BY THE CORE ARCHITECT ENGINE
        </p>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
            Generate Your Vision
          </h2>
          <p className="text-slate-500">
            Upload your academic PDF and let our AI architect your ideal
            semester.
          </p>
        </div>

        <Card className="border-2 border-dashed border-slate-200 bg-white/50 hover:bg-white hover:border-blue-200 transition-all duration-300">
          <CardContent className="pt-16 pb-16 text-center">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="pdf-upload"
              onChange={handleFileUpload}
              disabled={aiMutation.isPending}
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer group flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                {aiMutation.isPending ? (
                  <Loader2 className="w-8 h-8 text-blue-700 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-700 transition-colors" />
                )}
              </div>
              <CardTitle className="text-xl font-display mb-2">
                {aiMutation.isPending
                  ? "Analyzing Documents..."
                  : "Select Document"}
              </CardTitle>
              <CardDescription className="max-w-xs mx-auto mb-6 leading-relaxed">
                Drag and drop your academic PDF or click to browse. Let AI
                architect your semester.
              </CardDescription>
              <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg mb-8">
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  {userData?.credits ?? 5} TOKENS REMAINING
                </span>
              </div>
            </label>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={handleManualInput}
                className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-blue-700 transition-colors gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Manual Architecture
              </Button>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-200" />
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="json-import"
                  onChange={handleImportJSON}
                />
                <label htmlFor="json-import">
                  <Button
                    variant="ghost"
                    asChild
                    className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-blue-700 transition-colors gap-2 cursor-pointer"
                  >
                    <span>
                      <FileJson className="w-3.5 h-3.5" /> Import Strategy
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em]">
          INTELLIGENT ACADEMIC COMPOSER
        </p>

        <CourseEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          course={editingCourse}
          onSave={handleSaveCourse}
        />
      </div>
    );
  }

  if (step === "select") {
    const grouped = courses.reduce(
      (acc, c) => {
        acc[c.code] = acc[c.code] || [];
        acc[c.code].push(c);
        return acc;
      },
      {} as Record<string, Course[]>,
    );

    const totalSelectedSks = Object.entries(grouped)
      .filter(([code]) => selectedCodes.includes(code))
      .reduce((sum, [_, variations]) => sum + (variations[0]?.sks || 0), 0);

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
                Curate Your Semester
              </h2>
              <Badge
                variant="outline"
                className={`px-3 py-1 font-mono text-xs ${totalSelectedSks > sessionProfile.maxSks ? "border-red-200 text-red-700 bg-red-50" : "border-blue-100 text-blue-700 bg-blue-50"}`}
              >
                {totalSelectedSks} / {sessionProfile.maxSks} SKS
              </Badge>
            </div>
            <p className="text-slate-500">
              Select the courses you wish to include in your strategy.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            size="xl"
            disabled={
              totalSelectedSks > sessionProfile.maxSks ||
              selectedCodes.length === 0
            }
            className="gap-3 bg-blue-700 hover:bg-blue-800 text-base px-8 h-14 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            <Brain className="w-5 h-5" />
            Engineer Schedule
          </Button>
        </div>

        <Dialog open={isMasterSearchOpen} onOpenChange={setIsMasterSearchOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-display font-bold text-slate-900 italic flex items-center gap-3">
                <Search className="w-6 h-6 text-blue-700" />
                Master Catalog
              </DialogTitle>
              <DialogDescription className="text-[11px] font-mono text-slate-400 uppercase tracking-widest pt-2">
                Search the entire university catalog for this prodi.
              </DialogDescription>
            </DialogHeader>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by code or name... (e.g. Algoritma)"
                value={masterSearchQuery}
                onChange={(e) => setMasterSearchQuery(e.target.value)}
                className="pl-12 bg-slate-50 border-none rounded-xl h-12 focus-visible:ring-blue-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {filteredMaster?.map((c, i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100 rounded-xl transition-all cursor-pointer group flex justify-between items-center"
                  onClick={() => handleAddMasterCourse(c)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-100 text-slate-500">
                        {c.code}
                      </span>
                      <span className="text-[10px] font-mono text-blue-700 font-bold uppercase tracking-wider">
                        {c.class}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-slate-400 italic">
                      {c.lecturer}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <Badge
                      variant="outline"
                      className="bg-white text-[10px] font-mono border-slate-100"
                    >
                      {c.sks} SKS
                    </Badge>
                    <PlusCircle className="w-5 h-5 text-slate-200 group-hover:text-blue-700 transition-colors" />
                  </div>
                </div>
              ))}
              {filteredMaster?.length === 0 && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                    No components found
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 pt-6 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setIsMasterSearchOpen(false)}
                className="font-mono text-[10px] uppercase tracking-widest"
              >
                Close Catalog
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Add from Master Data */}
          <Card
            onClick={() => setIsMasterSearchOpen(true)}
            className="border-2 border-dashed border-blue-200 bg-blue-50/20 hover:bg-white hover:border-blue-400 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[180px] group shadow-sm hover:shadow-md"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 border border-blue-100 group-hover:border-blue-300 transition-colors shadow-sm">
              <PlusCircle className="w-6 h-6 text-blue-500 group-hover:text-blue-700" />
            </div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-blue-600 group-hover:text-blue-900 font-bold text-center px-4">
              Add from Master Data
            </span>
          </Card>

          {/* Add Manual Option */}
          <Card
            onClick={handleManualInput}
            className="border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[180px] group"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 border border-slate-100 group-hover:border-blue-100 transition-colors shadow-sm">
              <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-700" />
            </div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-700">
              Manual Architecture
            </span>
          </Card>

          {Object.entries(grouped).map(([code, options]) => (
            <Card
              key={code}
              className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden group relative ${
                selectedCodes.includes(code)
                  ? "border-blue-700 bg-blue-50/10 shadow-xl shadow-blue-50/50"
                  : "border-slate-100 hover:border-blue-200 hover:shadow-lg"
              }`}
              onClick={() => toggleCourse(code)}
            >
              <CardHeader className="p-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                  <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600 uppercase tracking-tighter">
                    {code}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedCodes.includes(code)
                        ? "bg-blue-700 border-blue-700"
                        : "border-slate-200 group-hover:border-blue-200"
                    }`}
                  >
                    {selectedCodes.includes(code) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg font-display leading-tight group-hover:text-blue-700 transition-colors mb-2 pr-12">
                  {options[0].name}
                </CardTitle>

                {/* Edit/Delete Overlays */}
                <div className="absolute top-16 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-100 hover:text-blue-700 bg-white/80 backdrop-blur"
                    onClick={(e) => handleEditCourse(e, options[0])}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-100 hover:text-red-500 hover:bg-red-50 bg-white/80 backdrop-blur"
                    onClick={(e) => handleDeleteCourse(e, options[0].id)}
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {options.length} Variations
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-100 gap-4">
          <Button
            variant="link"
            onClick={() => setStep("upload")}
            className="text-slate-400 hover:text-blue-700 font-mono text-xs uppercase tracking-widest gap-2"
          >
            <ChevronLeft className="w-3 h-3" /> Start Over
          </Button>

          <Button
            variant="outline"
            onClick={handleExportJSON}
            className="gap-2 font-mono text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50 hover:text-blue-700 h-10 px-6 rounded-xl"
          >
            <Download className="w-3.5 h-3.5" /> Export Strategy
          </Button>
        </div>

        <CourseEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          course={editingCourse}
          onSave={handleSaveCourse}
        />
      </div>
    );
  }

  if (step === "view" && plans.length > 0) {
    const currentPlan = plans[currentPlanIndex];
    const totalSKS = currentPlan.courses.reduce(
      (sum, c) => sum + (c.sks || 0),
      0,
    );

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep("select")}
              className="w-12 h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-bold font-display text-slate-900">
                  {currentPlan.name}
                </h2>
                <Badge
                  variant="outline"
                  className="border-blue-100 text-blue-700 bg-blue-50/50 px-3 font-mono text-[10px] uppercase tracking-widest"
                >
                  PROFESSIONAL LOOK
                </Badge>
              </div>
              <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">
                STRATEGY {currentPlanIndex + 1} OF {plans.length} • {totalSKS}{" "}
                SKS TOTAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <Button
              variant="ghost"
              disabled={currentPlanIndex === 0}
              onClick={() => setCurrentPlanIndex((prev) => prev - 1)}
              className="h-10 px-4 font-mono text-[10px] uppercase tracking-widest"
            >
              Prev
            </Button>
            <div className="px-4 py-1 text-xs font-mono font-bold text-slate-400 border-x border-slate-200">
              {String(currentPlanIndex + 1).padStart(2, "0")}/
              {String(plans.length).padStart(2, "0")}
            </div>
            <Button
              variant="ghost"
              disabled={currentPlanIndex === plans.length - 1}
              onClick={() => setCurrentPlanIndex((prev) => prev + 1)}
              className="h-10 px-4 font-mono text-[10px] uppercase tracking-widest"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-2xl shadow-blue-50/20 overflow-hidden">
              <ScheduleGrid courses={currentPlan.courses} />
            </div>
          </div>
          <div className="space-y-8">
            <PlanAnalysis plan={currentPlan} />

            <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-sm font-display flex items-center justify-between">
                  <span>Course Inventory</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {currentPlan.courses.length} Items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 text-sm">
                  {currentPlan.courses.map((c, i) => (
                    <div
                      key={i}
                      className="p-5 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {c.code}
                        </p>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                          {c.class}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                        {c.name}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-300 uppercase truncate pr-4">
                          {c.lecturer}
                        </span>
                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1 rounded">
                          {c.sks} SKS
                        </span>
                      </div>
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

  return null;
}
