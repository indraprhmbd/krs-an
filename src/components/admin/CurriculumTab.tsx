import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useCurriculumData } from "./hooks/useCurriculumData";
import { useProdiOptions, prodiLabel } from "./hooks/useProdiOptions";
import { CurriculumMasterPickerDialog } from "./dialogs/CurriculumMasterPickerDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface CurriculumTabProps {
  onOpenImport: () => void;
}

export function CurriculumTab({ onOpenImport }: CurriculumTabProps) {
  const [prodi, setProdi] = useLocalStorage(
    "admin-curriculum-prodi",
    "INFORMATIKA",
  );
  const [semester, setSemester] = useLocalStorage("admin-curriculum-semester", 2);

  const { prodiOptions } = useProdiOptions();

  const { search, setSearch, filteredCurriculum } = useCurriculumData(
    prodi,
    semester,
  );

  const removeCurriculum = useMutation(api.admin.removeCurriculumItem);
  const batchDeleteCurriculum = useMutation(api.admin.batchDeleteCurriculum);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleRemove = async (id: any) => {
    try {
      await removeCurriculum({ id });
      toast.success("Item dihapus dari kurikulum");
    } catch (err) {
      toast.error("Gagal menghapus item");
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
      await batchDeleteCurriculum({ ids: selectedIds as any });
      toast.success(`Berhasil menghapus ${selectedIds.length} item.`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Hapus massal gagal: " + err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCurriculum.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCurriculum.map((c: any) => c._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <Card className="border-border overflow-hidden rounded-card">
      <CardHeader className="p-4 md:p-3 border-b border-border bg-muted/30">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 w-full xl:w-auto">
            <div className="space-y-0.5">
              <CardTitle className="text-title text-foreground">
                Curriculum Blueprint
              </CardTitle>
              <CardDescription className="font-mono text-caps uppercase mt-0.5">
                Mandatory Course Mapping (Sem 1-8)
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full">
              <div className="space-y-1">
                <Label className="text-muted-foreground ml-1">
                  Prodi Filter
                </Label>
                <Select value={prodi} onValueChange={setProdi}>
                  <SelectTrigger className="h-9 md:h-8 w-full lg:w-44 rounded-control border-border bg-card">
                    <SelectValue placeholder="Select Prodi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-control border-border shadow-overlay max-h-[300px]">
                    {[...prodiOptions]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => (
                        <SelectItem
                          key={p._id}
                          value={p.name}
                          className="text-caption"
                        >
                          {prodiLabel(p)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground ml-1">
                  Semester
                </Label>
                <Select
                  value={semester.toString()}
                  onValueChange={(val) => setSemester(parseInt(val))}
                >
                  <SelectTrigger className="h-9 md:h-8 w-full lg:w-28 rounded-control border-border bg-card">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent className="rounded-control border-border shadow-overlay">
                    {/* All 8, deliberately: unlike the student planner, an
                        admin needs to reach curriculum for terms that are not
                        currently running. Do not apply validSemesters() here. */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem
                        key={s}
                        value={s.toString()}
                        className="text-caption"
                      >
                        SEMESTER {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <Label className="text-muted-foreground ml-1">
                  Search
                </Label>
                <div className="relative">
                  <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Code/Name..."
                    className="pl-8 h-9 md:h-8 w-full lg:w-48 rounded-control border-border bg-card"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                className="rounded-control px-4 h-10 md:h-9 text-caption"
              >
                <Icon name="trash" className="mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setIsPickerOpen(true)}
              className="w-full xl:w-auto rounded-control border-border px-6 h-10 md:h-9 text-caption"
            >
              <Icon name="database" className="mr-2" />
              Pilih dari Repositori
            </Button>

            <Button
              onClick={onOpenImport}
              className="w-full xl:w-auto bg-primary text-primary-foreground rounded-control px-6 h-10 md:h-9 text-caption"
            >
              <Icon name="plus" className="mr-2" />
              Batch Import
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead className="bg-muted border-b border-border text-caps font-mono uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <Checkbox
                    checked={
                      filteredCurriculum.length > 0 &&
                      selectedIds.length === filteredCurriculum.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Course Name</th>
                <th className="px-4 py-3 text-left">SKS</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCurriculum.map((c: any) => (
                <tr
                  key={c._id}
                  className="hover:bg-accent/50 transition-colors group"
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={selectedIds.includes(c._id)}
                      onCheckedChange={() => toggleSelect(c._id)}
                    />
                  </td>
                  <td className="px-2 md:px-4 py-2 font-mono font-bold text-primary text-caption md:text-caption">
                    {c.code}
                  </td>
                  <td className="px-2 md:px-4 py-2 font-medium min-w-[120px] text-caption md:text-caption">
                    {c.name}
                  </td>
                  <td className="px-2 md:px-4 py-2 text-muted-foreground text-caption md:text-caption">
                    {c.sks}
                  </td>
                  <td className="px-2 md:px-4 py-2 text-right opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive active:bg-muted"
                      onClick={() => handleRemove(c._id)}
                    >
                      <Icon name="trash" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCurriculum.length === 0 && (
            <div className="p-16 text-center text-muted-foreground font-mono text-caps uppercase">
              No curriculum items found.
            </div>
          )}
        </div>
      </CardContent>

      <CurriculumMasterPickerDialog
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        prodi={prodi}
        semester={semester}
      />
    </Card>
  );
}
