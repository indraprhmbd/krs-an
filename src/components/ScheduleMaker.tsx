import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, ChevronLeft, Trash, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, PlusCircle } from "lucide-react";

export function ScheduleMaker() {
  const [step, setStep] = useState<"config" | "select" | "view">("config"); // Removed 'upload' as we removed manual flow
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
  const [lockedCourses, setLockedCourses] = useState<Record<string, string>>(
    {},
  ); // valid courseId keyed by code
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0);

  const [isMasterSearchOpen, setIsMasterSearchOpen] = useState(false);

  // Convex Queries
  const allMasterCourses = useQuery(api.admin.listMasterCourses, {
    prodi: sessionProfile.prodi,
  });
  const curriculum = useQuery(api.admin.listCurriculum, {
    prodi: sessionProfile.prodi,
    semester: sessionProfile.semester,
  });

  const handleGenerate = () => {
    // Filter courses based on Locked selections
    const activeCourses = courses.filter((c) => {
      // If code is not selected, ignore
      if (!selectedCodes.includes(c.code)) return false;

      // Check if this code has a locked selection
      const lockedId = lockedCourses[c.code];

      // If not locked or locked to "any", include all variations
      if (!lockedId || lockedId === "any") return true;

      // If locked to specific ID, only include that one
      return c.id === lockedId;
    });

    const generated = generatePlans(activeCourses, selectedCodes);

    // Check if we have valid plans
    if (generated.length === 0) {
      toast.error(
        "No valid schedules found. Try releasing some locked classes to allow more combinations.",
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

  const handleDeleteCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    toast.success("Academic component removed.");
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

  const handleStartSession = () => {
    handleAutoLoad();
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
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <Badge className="bg-slate-900/5 text-slate-600 hover:bg-slate-900/10 border-slate-200 px-3 py-0.5 rounded-full font-mono text-[9px] tracking-widest mb-1">
            ACADEMIC YEAR 2024/2025
          </Badge>
          <h2 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
            Architect Your Semester
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto leading-relaxed text-sm">
            Select your academic profile or upload a custom architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-display font-bold text-slate-900 leading-tight">
                Academic
                <br />
                <span className="text-slate-400 italic">Configuration.</span>
              </h1>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Define your academic parameters to initialize the intelligent
                scheduler for <strong>2025/2026</strong>.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                    Study Program (Prodi)
                  </Label>
                  <Select
                    value={sessionProfile.prodi}
                    onValueChange={(val) =>
                      setSessionProfile({ ...sessionProfile, prodi: val })
                    }
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-mono text-sm h-10">
                      <SelectValue placeholder="Select Prodi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INFORMATIKA">INFORMATIKA</SelectItem>
                      <SelectItem value="SISTEM INFORMASI" disabled>
                        SISTEM INFORMASI (Coming Soon)
                      </SelectItem>
                      <SelectItem value="TEKNIK ELEKTRO" disabled>
                        TEKNIK ELEKTRO (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                      Semester
                    </Label>
                    <Select
                      value={sessionProfile.semester.toString()}
                      onValueChange={(val) =>
                        setSessionProfile({
                          ...sessionProfile,
                          semester: parseInt(val),
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-50 border-slate-200 font-mono text-sm h-10">
                        <SelectValue placeholder="Sem" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <SelectItem key={s} value={s.toString()}>
                            Semester {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest text-slate-500">
                      Max SKS
                    </Label>
                    <Input
                      type="number"
                      value={sessionProfile.maxSks}
                      onChange={(e) =>
                        setSessionProfile({
                          ...sessionProfile,
                          maxSks: parseInt(e.target.value),
                        })
                      }
                      className="bg-slate-50 border-slate-200 font-mono text-sm h-10"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartSession}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white h-12 rounded-xl font-display font-medium shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]"
              >
                Initialize Session
              </Button>
            </div>
          </div>

          <div className="hidden md:flex flex-col justify-center items-center text-center space-y-6 opacity-50 p-12 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
            <Brain className="w-16 h-16 text-slate-300" />
            <div className="space-y-2 max-w-xs">
              <h3 className="font-display font-bold text-slate-400">
                AI Optimization Engine
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our algorithms will automatically match your requirements
                against the university database to find the perfect schedule
                fit.
              </p>
            </div>
          </div>
        </div>
        <p className="text-center text-[9px] font-mono text-slate-400 uppercase tracking-[0.4em] pt-4">
          POWERED BY THE CORE ARCHITECT ENGINE
        </p>
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
      .reduce((sum, [code, variations]) => {
        // If locked, use locked course SKS, else use first variation SKS (assume same)
        const lockedId = lockedCourses[code];
        const course = lockedId
          ? variations.find((v) => v.id === lockedId)
          : variations[0];
        return sum + (course?.sks || 0);
      }, 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 sticky top-4 z-20">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Curate Your Semester
            </h2>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Badge
                variant="outline"
                className={`px-3 py-1 font-mono text-xs ${totalSelectedSks > sessionProfile.maxSks ? "border-red-200 text-red-700 bg-red-50" : "border-blue-100 text-blue-700 bg-blue-50"}`}
              >
                {totalSelectedSks} / {sessionProfile.maxSks} SKS
              </Badge>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                |
              </span>
              <p className="text-xs text-slate-500 hidden md:block">
                {selectedCodes.length} Subjects Selected
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsMasterSearchOpen(true)}
              className="flex-1 md:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-700 h-11 rounded-xl"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={selectedCodes.length === 0}
              className="flex-1 md:flex-none bg-blue-700 hover:bg-blue-800 text-white h-11 px-8 rounded-xl font-display font-medium shadow-lg shadow-blue-100 transition-all hover:scale-[1.02]"
            >
              <Brain className="w-4 h-4 mr-2" />
              Arrange Schedule
            </Button>
          </div>
        </div>

        {/* Course List Cards */}
        <div className="grid gap-4">
          {Object.entries(grouped).map(([code, variations]) => {
            const isSelected = selectedCodes.includes(code);
            const lockedId = lockedCourses[code];
            const activeCourse = lockedId
              ? variations.find((v) => v.id === lockedId)
              : variations[0]; // Default representation

            if (!activeCourse) return null;

            return (
              <div
                key={code}
                className={`group relative overflow-hidden transition-all duration-300 rounded-2xl border-2 ${isSelected ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-60 hover:opacity-100"}`}
              >
                <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  {/* Selection Checkbox Area */}
                  <div
                    onClick={() => toggleCourse(code)}
                    className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-blue-50 text-blue-700 ring-2 ring-blue-100" : "bg-white text-slate-300 hover:text-slate-400 border border-slate-200"}`}
                  >
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Plus className="w-6 h-6" />
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {code}
                      </span>
                      <h3
                        className={`font-bold font-display truncate ${isSelected ? "text-slate-900" : "text-slate-500"}`}
                      >
                        {activeCourse.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                      <span>{activeCourse.sks} SKS</span>
                      <span className="w-1 h-1 rounded-full bg-slate-200" />
                      <span>{variations.length} Class Options</span>
                    </div>
                  </div>

                  {/* Section Selector (Only visible if selected) */}
                  {isSelected && (
                    <div className="w-full md:w-72 shrink-0 animate-in fade-in slide-in-from-right-4">
                      <Select
                        value={lockedId || "any"}
                        onValueChange={(val) => {
                          setLockedCourses((prev) => {
                            const newLocked = { ...prev };
                            if (val === "any") {
                              delete newLocked[code];
                            } else {
                              newLocked[code] = val;
                            }
                            return newLocked;
                          });
                        }}
                      >
                        <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 hover:bg-white transition-colors text-xs font-mono">
                          <SelectValue placeholder="Optimization: ANY Class" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem
                            value="any"
                            className="font-bold text-blue-700"
                          >
                            Auto-Optimize (Any Class)
                          </SelectItem>
                          {variations.map((v) => (
                            <SelectItem
                              key={v.id}
                              value={v.id}
                              className="text-xs"
                            >
                              <span className="font-bold mr-2">
                                Class {v.class}
                              </span>
                              <span className="text-slate-500">
                                {v.lecturer.split(",")[0]}
                              </span>
                              <span className="ml-auto text-slate-400 font-mono text-[10px] pl-2">
                                {v.schedule[0]?.day} {v.schedule[0]?.start}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Actions */}
                  {isSelected && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        onClick={(e) => handleDeleteCourse(e, activeCourse.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="font-mono text-xs uppercase tracking-widest text-slate-400">
              No subjects loaded. Add from Master Catalog.
            </p>
          </div>
        )}

        <Dialog open={isMasterSearchOpen} onOpenChange={setIsMasterSearchOpen}>
          <DialogContent className="max-w-xl bg-white rounded-3xl p-6 border-none shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-700" />
                Master Catalog
              </DialogTitle>
              <DialogDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-widest pt-1">
                University Component Database
              </DialogDescription>
            </DialogHeader>

            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search code or name..."
                value={masterSearchQuery}
                onChange={(e) => setMasterSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-10 text-xs focus-visible:ring-blue-700"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
              {filteredMaster?.map((c, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 hover:border-blue-100 rounded-xl transition-all cursor-pointer group flex justify-between items-center"
                  onClick={() => handleAddMasterCourse(c)}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                        {c.code}
                      </span>
                      <span className="text-[9px] font-mono text-blue-700 font-bold uppercase">
                        {c.class}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      {c.name}
                    </p>
                    <p className="text-[9px] text-slate-500 italic truncate max-w-[200px]">
                      {c.lecturer}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <Badge
                      variant="outline"
                      className="bg-white text-[9px] font-mono border-slate-200 text-slate-600"
                    >
                      {c.sks} SKS
                    </Badge>
                    <PlusCircle className="w-4 h-4 text-slate-300 group-hover:text-blue-700 transition-colors" />
                  </div>
                </div>
              ))}
              {filteredMaster?.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <Search className="w-5 h-5 text-slate-300 mx-auto" />
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    No components found
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setIsMasterSearchOpen(false)}
                className="font-mono text-[9px] uppercase tracking-widest text-slate-400"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setStep("select")}
              className="w-10 h-10 rounded-xl border-slate-200 hover:bg-slate-50 hover:text-blue-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h2 className="text-2xl font-bold font-display text-slate-900">
                  {currentPlan.name}
                </h2>
                <Badge
                  variant="outline"
                  className="border-blue-100 text-blue-700 bg-blue-50/50 px-2 font-mono text-[9px] uppercase tracking-widest"
                >
                  PRECISE FIT
                </Badge>
              </div>
              <p className="text-slate-500 font-mono text-[9px] tracking-widest uppercase">
                PLAN {currentPlanIndex + 1} OF {plans.length} • {totalSKS} SKS
                TOTAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              disabled={currentPlanIndex === 0}
              onClick={() => setCurrentPlanIndex((prev) => prev - 1)}
              className="h-8 px-3 font-mono text-[10px] uppercase tracking-widest"
            >
              Prev
            </Button>
            <div className="px-3 py-1 text-[10px] font-mono font-bold text-slate-500 border-x border-slate-200">
              {String(currentPlanIndex + 1).padStart(2, "0")}/
              {String(plans.length).padStart(2, "0")}
            </div>
            <Button
              variant="ghost"
              disabled={currentPlanIndex === plans.length - 1}
              onClick={() => setCurrentPlanIndex((prev) => prev + 1)}
              className="h-8 px-3 font-mono text-[10px] uppercase tracking-widest"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xl shadow-blue-50/20 overflow-hidden">
              <ScheduleGrid courses={currentPlan.courses} />
            </div>
          </div>
          <div className="space-y-6">
            <PlanAnalysis plan={currentPlan} />

            <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-200">
                <CardTitle className="text-xs font-display flex items-center justify-between">
                  <span>Course Inventory</span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {currentPlan.courses.length} Items
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 text-[11px]">
                  {currentPlan.courses.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 hover:bg-slate-50/50 transition-colors group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            {c.code}
                          </span>
                          <p className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate max-w-[140px] text-xs">
                            {c.name}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 px-1 font-mono border-slate-200 text-slate-600 bg-white"
                        >
                          {c.sks} SKS
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase">
                        <span className="text-blue-700 font-bold">
                          {c.class}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="truncate">{c.lecturer}</span>
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
