import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurriculumData } from "./hooks/useCurriculumData";
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
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface CurriculumTabProps {
  onOpenImport: () => void;
}

export function CurriculumTab({ onOpenImport }: CurriculumTabProps) {
  const [prodi, setProdi] = useState("INFORMATIKA");
  const [semester, setSemester] = useState(2);

  const { search, setSearch, filteredCurriculum } = useCurriculumData(
    prodi,
    semester,
  );

  const removeCurriculum = useMutation(api.admin.removeCurriculumItem);
  const batchDeleteCurriculum = useMutation(api.admin.batchDeleteCurriculum);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleRemove = async (id: any) => {
    try {
      await removeCurriculum({ id });
      toast.success("Item removed from curriculum");
    } catch (err) {
      toast.error("Failed to remove item");
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
      toast.success(`Successfully deleted ${selectedIds.length} items.`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Batch delete failed: " + err.message);
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
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4 w-full xl:w-auto">
            <div className="space-y-0.5">
              <CardTitle className="text-xl font-display text-slate-900">
                Curriculum Blueprint
              </CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-widest mt-0.5">
                Mandatory Course Mapping (Sem 1-8)
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 w-full">
              <div className="space-y-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500 ml-1">
                  Prodi Filter
                </Label>
                <Select value={prodi} onValueChange={setProdi}>
                  <SelectTrigger className="h-9 md:h-8 w-full lg:w-44 rounded-xl lg:rounded-lg font-mono text-[9px] uppercase border-slate-200 bg-white">
                    <SelectValue placeholder="Select Prodi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
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

              <div className="space-y-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500 ml-1">
                  Semester
                </Label>
                <Select
                  value={semester.toString()}
                  onValueChange={(val) => setSemester(parseInt(val))}
                >
                  <SelectTrigger className="h-9 md:h-8 w-full lg:w-28 rounded-xl lg:rounded-lg font-mono text-[9px] uppercase border-slate-200 bg-white">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <SelectItem
                        key={s}
                        value={s.toString()}
                        className="text-[10px]"
                      >
                        SEMESTER {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500 ml-1">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Code/Name..."
                    className="pl-8 h-9 md:h-8 w-full lg:w-48 rounded-xl lg:rounded-lg font-mono text-[9px] uppercase border-slate-200 bg-white"
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
                className="rounded-xl px-4 h-10 md:h-9 shadow-lg font-display text-xs"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}

            <Button
              onClick={onOpenImport}
              className="w-full xl:w-auto bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-6 h-10 md:h-9 shadow-lg shadow-blue-100 font-display text-xs"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Batch Import
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono uppercase tracking-widest text-slate-500">
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
                <th className="px-4 py-3 text-left">Term</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCurriculum.map((c: any) => (
                <tr
                  key={c._id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-4 py-2">
                    <Checkbox
                      checked={selectedIds.includes(c._id)}
                      onCheckedChange={() => toggleSelect(c._id)}
                    />
                  </td>
                  <td className="px-2 md:px-4 py-2 font-mono font-bold text-blue-900 text-[10px] md:text-xs">
                    {c.code}
                  </td>
                  <td className="px-2 md:px-4 py-2 font-medium min-w-[120px] text-[10px] md:text-xs">
                    {c.name}
                  </td>
                  <td className="px-2 md:px-4 py-2 text-slate-500 text-[10px] md:text-xs">
                    {c.sks}
                  </td>
                  <td className="px-2 md:px-4 py-2 text-slate-500 text-[10px] md:text-xs">
                    {c.term}
                  </td>
                  <td className="px-2 md:px-4 py-2 text-right opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 active:bg-slate-50"
                      onClick={() => handleRemove(c._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCurriculum.length === 0 && (
            <div className="p-16 text-center text-slate-400 font-mono text-[9px] uppercase tracking-[0.2em]">
              No curriculum items found.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
