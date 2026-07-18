import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMasterData } from "./hooks/useMasterData";
import { useProdiOptions } from "./hooks/useProdiOptions";
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
import { Icon } from "@/components/ui/icon";
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

  const { prodiOptions } = useProdiOptions();

  const updateMaster = useMutation(api.admin.updateMasterCourse);
  const deleteMaster = useMutation(api.admin.deleteMasterCourse);
  const bulkImport = useMutation(api.admin.bulkImportMaster);
  const batchDelete = useMutation(api.admin.batchDeleteMaster);
  const clearMaster = useMutation(api.admin.clearMasterData);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetProdi, setTargetProdi] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const fixProdi = useMutation(api.admin.fixProdiFormatting);
  const moveToProdi = useMutation(api.admin.moveMasterCoursesToProdi);
  const copyToProdi = useMutation(api.admin.copyMasterCoursesToProdi);

  // CRUD Handlers
  const handleEditMaster = (course: any) => {
    setEditingCourse(course);
    setIsEditorOpen(true);
  };

  const handleDeleteMaster = async (id: any) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteMaster({ id });
      toast.success("Mata kuliah berhasil dihapus.");
    } catch (err: any) {
      toast.error("Hapus gagal.");
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
        toast.success("Mata kuliah diperbarui.");
      } else {
        toast.info("Pembuatan individu untuk master belum tersedia.");
      }
      setIsEditorOpen(false);
    } catch (err: any) {
      toast.error("Simpan gagal.");
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
        `Berhasil menyebarkan ${data.length} komponen.`,
      );
    } catch (err: any) {
      toast.error("Penyebaran gagal: " + err.message);
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
            `Berhasil mengimpor ${formattedData.length} data dari CSV.`,
          );
        } catch (err: any) {
          toast.error("Impor CSV gagal: " + err.message);
        } finally {
          setIsImporting(false);
        }
      },
      error: (err) => {
        toast.error("Parse CSV gagal: " + err.message);
        setIsImporting(false);
      },
    });
  };

  const handleFixProdi = async () => {
    setIsFixing(true);
    try {
      const result = await fixProdi();
      toast.success(`Memperbaiki ${result.fixedCount} masalah format.`);
    } catch (err: any) {
      toast.error("Perbaikan gagal: " + err.message);
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
      toast.success(`Berhasil menghapus ${selectedIds.length} item.`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Hapus massal gagal: " + err.message);
    }
  };

  const handleMoveToProdi = async () => {
    if (selectedIds.length === 0 || !targetProdi) return;
    setIsMoving(true);
    try {
      const result = await moveToProdi({
        ids: selectedIds as any,
        prodi: targetProdi,
      });
      toast.success(`${result.count} mata kuliah dipindah ke ${targetProdi}.`);
      setSelectedIds([]);
      setTargetProdi("");
    } catch (err: any) {
      toast.error("Pindah gagal: " + err.message);
    } finally {
      setIsMoving(false);
    }
  };

  const handleCopyToProdi = async () => {
    if (selectedIds.length === 0 || !targetProdi) return;
    setIsCopying(true);
    try {
      const result = await copyToProdi({
        ids: selectedIds as any,
        prodi: targetProdi,
      });
      toast.success(`${result.count} mata kuliah disalin ke ${targetProdi}.`);
      setSelectedIds([]);
      setTargetProdi("");
    } catch (err: any) {
      toast.error("Salin gagal: " + err.message);
    } finally {
      setIsCopying(false);
    }
  };

  const handlePurgeProdi = async () => {
    if (prodiFilter === "all") return;
    if (
      !confirm(`This will purge ALL master data for ${prodiFilter}. Proceed?`)
    )
      return;

    try {
      await clearMaster({ prodi: prodiFilter });
      toast.success(`Data ${prodiFilter} dibersihkan.`);
    } catch (err: any) {
      toast.error("Pembersihan gagal.");
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
      <Card className="border-border overflow-hidden rounded-card">
        <CardHeader className="p-4 border-b border-border bg-muted/30">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
              <CardTitle className="text-title">
                Master Data Repository
              </CardTitle>
              <CardDescription className="font-mono text-caps uppercase mt-0.5 break-words">
                Global Component Database ({totalLoaded} loaded)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto justify-start xl:justify-end">
              {selectedIds.length > 0 && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <Select value={targetProdi} onValueChange={setTargetProdi}>
                    <SelectTrigger className="h-9 w-full rounded-control border-border bg-card sm:h-8 sm:w-44">
                      <SelectValue placeholder="Pindah/salin ke prodi..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-control border-border shadow-card">
                      {[...prodiOptions]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((p) => (
                          <SelectItem
                            key={p._id}
                            value={p.name}
                            className="text-caption"
                          >
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMoveToProdi}
                    disabled={!targetProdi || isMoving}
                    className="rounded-control px-3 font-mono text-caps uppercase border-border h-9 md:h-8"
                  >
                    <Icon name="external-link" size={14} className="mr-2" />
                    {isMoving ? "Memindah..." : `Pindah (${selectedIds.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToProdi}
                    disabled={!targetProdi || isCopying}
                    className="rounded-control px-3 font-mono text-caps uppercase border-border h-9 md:h-8"
                  >
                    <Icon name="copy" size={14} className="mr-2" />
                    {isCopying ? "Menyalin..." : `Salin (${selectedIds.length})`}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBatchDelete}
                    className="w-full sm:w-auto rounded-control px-4 font-mono text-caps uppercase h-9 md:h-8"
                  >
                    <Icon name="trash" size={14} className="mr-2" />
                    Delete ({selectedIds.length})
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFixProdi}
                  disabled={isFixing}
                  className="rounded-control font-mono text-caps uppercase border-border text-primary hover:bg-muted h-9 md:h-8"
                >
                  {isFixing ? (
                    <Icon name="spinner" size={12} className="animate-spin mr-2" />
                  ) : (
                    <Icon name="pencil" size={12} className="mr-2" />
                  )}
                  Fix Format
                </Button>

                <Button
                  variant="outline"
                  onClick={onOpenScraper}
                  className="rounded-control font-mono text-caps uppercase border-border text-primary hover:bg-muted h-9 md:h-8"
                >
                  <Icon name="sparkles" size={12} className="mr-2" />
                  AI Scraper
                </Button>

                {prodiFilter !== "all" && (
                  <Button
                    variant="outline"
                    onClick={handlePurgeProdi}
                    className="rounded-control font-mono text-caps uppercase border-border text-destructive hover:bg-destructive/10 h-9 md:h-8"
                  >
                    <Icon name="trash" size={12} className="mr-2" />
                    Purge {prodiFilter}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:flex gap-2 w-full">
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
                      className="w-full rounded-control px-4 font-mono text-caps uppercase border-border text-muted-foreground hover:bg-muted cursor-pointer h-9 md:h-8"
                    >
                      <span>
                        {isImporting ? (
                          <Icon name="spinner" size={12} className="animate-spin mr-2" />
                        ) : (
                          <Icon name="database" size={12} className="mr-2" />
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
                      className="w-full bg-primary hover:bg-primary/80 text-primary-foreground rounded-control px-4 font-mono text-caps uppercase cursor-pointer h-9 md:h-8"
                    >
                      <span>
                        {isImporting ? (
                          <Icon name="spinner" size={12} className="animate-spin mr-2" />
                        ) : (
                          <Icon name="upload" size={12} className="mr-2" />
                        )}
                        JSON
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 mt-4 pt-4 border-t border-border">
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search code or name..."
                className="pl-10 h-10 rounded-control border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <Select value={prodiFilter} onValueChange={setProdiFilter}>
                <SelectTrigger className="h-10 rounded-control border-border">
                  <SelectValue placeholder="All Prodi" />
                </SelectTrigger>
                <SelectContent className="rounded-control border-border shadow-card max-h-[300px]">
                  <SelectItem value="all" className="text-caption font-bold">
                    All Prodi
                  </SelectItem>
                  {[...prodiOptions]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <SelectItem
                        key={p._id}
                        value={p.name}
                        className="text-caption"
                      >
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-caption">
              <thead className="bg-muted border-b border-border text-caps font-mono uppercase text-muted-foreground">
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
              <tbody className="divide-y divide-border font-sans">
                {(courses || []).map((c: any) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-muted/50 transition-colors group ${selectedIds.includes(c._id) ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-2 md:px-4 py-2.5">
                      <Checkbox
                        checked={selectedIds.includes(c._id)}
                        onCheckedChange={() => toggleSelect(c._id)}
                      />
                    </td>
                    <td className="px-2 md:px-4 py-2.5 font-mono font-bold text-primary">
                      {c.code}
                    </td>
                    <td className="px-2 md:px-4 py-2.5 font-medium min-w-[120px]">
                      {c.name}
                    </td>
                    <td className="px-2 md:px-4 py-2.5 text-muted-foreground">
                      {c.class}
                    </td>
                    <td className="px-2 md:px-4 py-2.5 text-muted-foreground text-caption">
                      {c.prodi}
                    </td>
                    <td className="px-2 md:px-4 py-2.5 font-mono">{c.sks}</td>
                    <td className="px-2 md:px-4 py-2.5 text-muted-foreground text-caption overflow-hidden max-w-[150px] truncate">
                      {c.lecturer}
                    </td>
                    <td className="px-2 md:px-4 py-2.5 text-right opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary active:bg-muted"
                          onClick={() => handleEditMaster(c)}
                        >
                          <Icon name="pencil" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive active:bg-muted"
                          onClick={() => handleDeleteMaster(c._id)}
                        >
                          <Icon name="trash" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(courses || []).length === 0 && !isLoading && (
              <div className="p-16 text-center text-muted-foreground font-mono text-caps uppercase">
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
