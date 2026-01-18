import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMasterData } from "./hooks/useMasterData";
import { CourseEditor } from "./CourseEditor";
import { Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/Pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Wand2,
  FileSpreadsheet,
  Upload,
  Loader2,
  Edit3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface MasterDataTabProps {
  onOpenScraper: () => void;
}

export function MasterDataTab({ onOpenScraper }: MasterDataTabProps) {
  const {
    courses,
    search,
    setSearch,
    prodiFilter,
    setProdiFilter,
    status,
    isLoading,
    totalLoaded,
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = useMasterData();

  const updateMaster = useMutation(api.admin.updateMasterCourse);
  const deleteMaster = useMutation(api.admin.deleteMasterCourse);
  const bulkImport = useMutation(api.admin.bulkImportMaster);
  const batchDelete = useMutation(api.admin.batchDeleteMaster);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fixProdi = useMutation(api.admin.fixProdiFormatting);

  // CRUD Handlers
  const handleEditMaster = (course: any) => {
    setEditingCourse(course);
    setIsEditorOpen(true);
  };

  const handleDeleteMaster = async (id: any) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteMaster({ id });
      toast.success("Course deleted successfully.");
    } catch (err: any) {
      toast.error("Delete failed.");
    }
  };

  const handleSaveCourse = async (course: any) => {
    try {
      if ((editingCourse as any)?._id) {
        // Update existing
        const { _id, _creationTime, ...updates } = course;
        await updateMaster({
          id: (editingCourse as any)._id,
          updates: updates as any,
        });
        toast.success("Course updated.");
      } else {
        toast.info("Individual creation for master not implemented yet.");
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error("Save failed.");
    }
  };

  // Import Handlers
  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

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

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formattedData = results.data.map((row: any) => {
            const scheduleRaw = row.schedule || "";
            const scheduleParts = scheduleRaw
              .split(";")
              .map((s: string) => {
                const match = s
                  .trim()
                  .match(/(\w+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
                if (match) {
                  return { day: match[1], start: match[2], end: match[3] };
                }
                return null;
              })
              .filter(Boolean);

            return {
              code: row.code,
              name: row.name,
              sks: Number(row.sks),
              prodi: row.prodi,
              class: row.class,
              lecturer: row.lecturer,
              room: row.room,
              capacity: row.capacity ? Number(row.capacity) : undefined,
              schedule: scheduleParts,
            };
          });

          await bulkImport({ courses: formattedData as any });
          toast.success(
            `Successfully imported ${formattedData.length} records from CSV.`,
          );
        } catch (err: any) {
          toast.error("CSV Import failed: " + err.message);
        } finally {
          setIsImporting(false);
        }
      },
      error: (err) => {
        toast.error("CSV Parse failed: " + err.message);
        setIsImporting(false);
      },
    });
  };

  const handleFixProdi = async () => {
    setIsFixing(true);
    try {
      const result = await fixProdi();
      toast.success(`Fixed ${result.fixedCount} formatting issues.`);
    } catch (err: any) {
      toast.error("Fix failed: " + err.message);
    } finally {
      setIsFixing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} items?`)
    ) {
      return;
    }

    try {
      await batchDelete({ ids: selectedIds as any });
      toast.success(`Successfully deleted ${selectedIds.length} items.`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Batch delete failed: " + err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === courses?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(courses?.map((c: any) => c._id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-display">
                Master Data Repository
              </CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-widest mt-0.5 break-words">
                Global Component Database ({totalLoaded} loaded)
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-start xl:justify-end">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                  className="rounded-xl px-4 font-mono text-[9px] uppercase tracking-widest h-8"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete ({selectedIds.length})
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleFixProdi}
                disabled={isFixing}
                className="rounded-xl px-4 font-mono text-[9px] uppercase tracking-widest border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
              >
                {isFixing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : (
                  <Wand2 className="w-3 h-3 mr-2" />
                )}
                Fix Format
              </Button>

              <Button
                variant="outline"
                onClick={onOpenScraper}
                className="rounded-xl px-4 font-mono text-[9px] uppercase tracking-widest border-blue-200 text-blue-700 hover:bg-blue-50 h-8"
              >
                <Wand2 className="w-3 h-3 mr-2" />
                AI Scraper
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-import"
                  onChange={handleCsvImport}
                />
                <Label htmlFor="csv-import">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl px-4 font-mono text-[9px] uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer h-8"
                  >
                    <span>
                      {isImporting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <FileSpreadsheet className="w-3 h-3 mr-2" />
                      )}
                      CSV
                    </span>
                  </Button>
                </Label>
              </div>

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
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 font-mono text-[9px] uppercase tracking-widest cursor-pointer shadow-lg shadow-slate-100 h-8"
                  >
                    <span>
                      {isImporting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-3 h-3 mr-2" />
                      )}
                      JSON
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4 pt-4 border-t border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by code or name..."
                className="pl-10 h-10 rounded-xl border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={prodiFilter} onValueChange={setProdiFilter}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="All Prodi" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
                  <SelectItem value="all" className="text-[10px] font-bold">
                    All Prodi
                  </SelectItem>
                  {[
                    "INFORMATIKA",
                    "SISTEM INFORMASI",
                    "TEKNIK INDUSTRI",
                    "TEKNIK KIMIA",
                    "TEKNIK LINGKUNGAN",
                    "TEKNIK PERTAMBANGAN",
                    "TEKNIK GEOLOGI",
                    "MANAJEMEN",
                    "AKUNTANSI",
                    "EKONOMI PEMBANGUNAN",
                    "ILMU KOMUNIKASI",
                    "HUBUNGAN INTERNASIONAL",
                    "ADMINISTRASI BISNIS",
                  ]
                    .sort()
                    .map((p) => (
                      <SelectItem key={p} value={p} className="text-[10px]">
                        {p}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox
                      checked={
                        courses &&
                        courses.length > 0 &&
                        selectedIds.length === courses.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Course Name</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Prodi</th>
                  <th className="px-4 py-3 text-left">SKS</th>
                  <th className="px-4 py-3 text-left">Lecturer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {(courses || []).map((c: any) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(c._id) ? "bg-blue-50/30" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <Checkbox
                        checked={selectedIds.includes(c._id)}
                        onCheckedChange={() => toggleSelect(c._id)}
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-900">
                      {c.code}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{c.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{c.class}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-[10px]">
                      {c.prodi}
                    </td>
                    <td className="px-4 py-2.5 font-mono">{c.sks}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-[10px] overflow-hidden max-w-[150px] truncate">
                      {c.lecturer}
                    </td>
                    <td className="px-4 py-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-blue-600"
                          onClick={() => handleEditMaster(c)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteMaster(c._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(courses || []).length === 0 && !isLoading && (
              <div className="p-16 text-center text-slate-400 font-mono text-[9px] uppercase tracking-[0.2em]">
                {status === "LoadingFirstPage"
                  ? "Booting Database..."
                  : "No components found matching your search."}
              </div>
            )}
          </div>

          {/* Numbered Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrev={prevPage}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
          />
        </CardContent>
      </Card>

      <CourseEditor
        course={editingCourse as any}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCourse}
      />
    </div>
  );
}
