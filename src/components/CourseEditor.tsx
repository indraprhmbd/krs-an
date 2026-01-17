import { useState, useEffect } from "react";
import { Course, TimeSlot, DayOfWeek } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Trash2, Plus, Clock } from "lucide-react";

interface CourseEditorProps {
  course?: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
}

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CourseEditor({
  course,
  isOpen,
  onClose,
  onSave,
}: CourseEditorProps) {
  const [formData, setFormData] = useState<Partial<Course>>({
    code: "",
    name: "",
    sks: 3,
    class: "",
    lecturer: "",
    room: "",
    schedule: [{ day: "Mon", start: "07:00", end: "09:00" }],
  });

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        code: "",
        name: "",
        sks: 3,
        class: "",
        lecturer: "",
        room: "",
        schedule: [{ day: "Mon", start: "07:00", end: "09:00" }],
      });
    }
  }, [course, isOpen]);

  const addSlot = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...(prev.schedule || []),
        { day: "Mon", start: "07:00", end: "09:00" },
      ],
    }));
  };

  const removeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule?.filter((_, i) => i !== index),
    }));
  };

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule?.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) return;
    onSave({
      ...(formData as Course),
      id: course?.id || crypto.randomUUID(),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-display font-bold text-slate-900 italic">
            {course ? "Edit Strategy Component" : "Architect New Course"}
          </DialogTitle>
          <p className="text-sm text-slate-400 font-mono uppercase tracking-widest pt-1 border-t border-slate-100">
            {course
              ? "Modifying existing data entry"
              : "Defining manual academic resource"}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Course Code
            </Label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g. CS101"
              className="font-mono bg-slate-50 border-none h-11 focus-visible:ring-blue-700"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Class Name / Group
            </Label>
            <Input
              value={formData.class}
              onChange={(e) =>
                setFormData({ ...formData, class: e.target.value })
              }
              placeholder="e.g. A"
              className="bg-slate-50 border-none h-11 focus-visible:ring-blue-700"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Full Course Name
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Advanced AI Management"
              className="bg-slate-50 border-none h-11 focus-visible:ring-blue-700 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              SKS (Credits)
            </Label>
            <Input
              type="number"
              value={formData.sks}
              onChange={(e) =>
                setFormData({ ...formData, sks: Number(e.target.value) })
              }
              className="bg-slate-50 border-none h-11 focus-visible:ring-blue-700"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Academic Room
            </Label>
            <Input
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
              placeholder="e.g. Lab 01"
              className="bg-slate-50 border-none h-11 focus-visible:ring-blue-700"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Professor / Lecturer
            </Label>
            <Input
              value={formData.lecturer}
              onChange={(e) =>
                setFormData({ ...formData, lecturer: e.target.value })
              }
              placeholder="e.g. Dr. John Doe"
              className="bg-slate-50 border-none h-11 focus-visible:ring-blue-700"
            />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-display font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              Schedule Slots
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addSlot}
              className="h-8 border-slate-200 text-xs font-mono uppercase tracking-widest hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Add Segment
            </Button>
          </div>

          <div className="space-y-3">
            {formData.schedule?.map((slot, i) => (
              <div
                key={i}
                className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100 group"
              >
                <select
                  value={slot.day}
                  onChange={(e) => updateSlot(i, "day", e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg h-9 px-3 text-xs font-mono focus:ring-1 focus:ring-blue-700 outline-none"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) => updateSlot(i, "start", e.target.value)}
                    className="h-9 w-32 border-slate-200 bg-white text-xs font-mono"
                  />
                  <span className="text-slate-300 text-xs">-</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) => updateSlot(i, "end", e.target.value)}
                    className="h-9 w-32 border-slate-200 bg-white text-xs font-mono"
                  />
                </div>
                {formData.schedule!.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(i)}
                    className="ml-auto h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-10 pt-6 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest text-slate-400"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.code || !formData.name}
            className="bg-blue-700 hover:bg-blue-800 text-white font-display font-medium px-8 rounded-xl shadow-lg shadow-blue-100"
          >
            {course ? "Sync Changes" : "Deploy Component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
