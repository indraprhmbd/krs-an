import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurriculumData } from "./hooks/useCurriculumData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  const handleRemove = async (id: any) => {
    try {
      await removeCurriculum({ id });
      toast.success("Item removed from curriculum");
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col md:flex-row items-end gap-4 w-full xl:w-auto">
            <div className="space-y-1">
              <CardTitle className="text-xl font-display">
                Curriculum Blueprint
              </CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-widest mt-0.5">
                Mandatory Course Mapping (Sem 1-8)
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="space-y-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                  Prodi Filter
                </Label>
                <Input
                  value={prodi}
                  onChange={(e) => setProdi(e.target.value.toUpperCase())}
                  className="h-8 w-32 rounded-lg font-mono text-[9px] uppercase border-slate-200"
                  placeholder="e.g. INF"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                  Search Courses
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input
                    placeholder="Code/Name..."
                    className="pl-8 h-8 w-48 rounded-lg font-mono text-[9px] uppercase border-slate-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[8px] uppercase font-mono tracking-widest text-slate-500">
                  Semester Filter
                </Label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSemester(s)}
                      className={`w-7 h-7 rounded text-[9px] font-mono transition-all ${semester === s ? "bg-white text-blue-700 shadow-sm font-bold" : "hover:bg-white/50 text-slate-500"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={onOpenImport}
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-4 h-9 shadow-lg shadow-blue-100 font-display text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-2" />
            Batch Import
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-mono uppercase tracking-widest text-slate-500">
              <tr>
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
                  <td className="px-4 py-2 font-mono font-bold text-blue-900">
                    {c.code}
                  </td>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 text-slate-500">{c.sks}</td>
                  <td className="px-4 py-2 text-slate-500">{c.term}</td>
                  <td className="px-4 py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={() => handleRemove(c._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
