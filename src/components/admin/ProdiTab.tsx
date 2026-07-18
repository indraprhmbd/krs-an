import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useProdiOptions } from "./hooks/useProdiOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { toast } from "sonner";

export function ProdiTab() {
  const { prodiOptions } = useProdiOptions();
  const addProdiOption = useMutation(api.admin.addProdiOption);
  const removeProdiOption = useMutation(api.admin.removeProdiOption);
  const seedProdiOptions = useMutation(api.admin.seedProdiOptions);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const { inserted } = await seedProdiOptions({});
      toast.success(`${inserted} prodi default ditambahkan.`);
    } catch (err: any) {
      toast.error(err.message || "Gagal seed prodi default.");
    } finally {
      setIsSeeding(false);
    }
  };

  const [name, setName] = useState("");
  const [comingSoon, setComingSoon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await addProdiOption({ name, comingSoon });
      toast.success("Prodi ditambahkan.");
      setName("");
      setComingSoon(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah prodi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: any) => {
    try {
      await removeProdiOption({ id });
      toast.success("Prodi dihapus.");
    } catch (err) {
      toast.error("Gagal menghapus prodi.");
    }
  };

  const sorted = [...prodiOptions].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <Card className="border-border overflow-hidden rounded-card">
      <CardHeader className="border-b border-border bg-muted/30 p-4 md:p-3">
        <CardTitle className="text-title text-foreground">Prodi</CardTitle>
        <CardDescription className="mt-0.5 font-mono text-caps uppercase">
          Sumber daftar prodi untuk form konfigurasi dan filter kurikulum
        </CardDescription>

        {sorted.length === 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-card border border-dashed border-border bg-muted p-3">
            <p className="text-caption text-muted-foreground">
              Belum ada data. Isi otomatis dengan daftar prodi bawaan (bisa
              dihapus/diedit lagi setelahnya).
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="shrink-0 rounded-control text-caption"
            >
              {isSeeding ? "Menambah..." : "Seed Default"}
            </Button>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label className="ml-1 text-muted-foreground">Nama Prodi</Label>
            <Input
              placeholder="mis. FAKULTAS EKONOMI DAN BISNIS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 rounded-control border-border bg-card md:h-8"
            />
          </div>
          <label className="flex items-center gap-2 pb-1.5 text-caption text-muted-foreground">
            <Checkbox
              checked={comingSoon}
              onCheckedChange={(v) => setComingSoon(v === true)}
            />
            Coming Soon
          </label>
          <Button
            onClick={handleAdd}
            disabled={isSubmitting || !name.trim()}
            className="h-9 rounded-control bg-primary px-6 text-caption text-primary-foreground md:h-8"
          >
            <Icon name="plus" className="mr-2" />
            Tambah
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {sorted.map((p) => (
            <div
              key={p._id}
              className="group flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-foreground">
                  {p.name}
                </span>
                {p.comingSoon && (
                  <span className="rounded-control border border-border bg-muted px-1.5 py-0.5 font-mono text-grid uppercase text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-100 hover:text-destructive active:bg-muted md:opacity-0 md:group-hover:opacity-100"
                onClick={() => handleRemove(p._id)}
              >
                <Icon name="trash" />
              </Button>
            </div>
          ))}
          {sorted.length === 0 && (
            <div className="p-16 text-center font-mono text-caps uppercase text-muted-foreground">
              Belum ada prodi. Tambah lewat form di atas.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
