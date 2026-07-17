import { useState, useEffect } from "react";
import { Course, TimeSlot, DayOfWeek } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";

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
      <DialogContent size="xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-title text-foreground italic">
            {course ? "Edit Strategy Component" : "Architect New Course"}
          </DialogTitle>
          <p className="text-caps text-muted-foreground font-mono uppercase pt-1.5 border-t border-border mt-1">
            {course
              ? "Modifying existing data entry"
              : "Defining manual academic resource"}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              Course Code
            </Label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g. CS101"
              className="font-mono bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring rounded-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              Class Name / Group
            </Label>
            <Input
              value={formData.class}
              onChange={(e) =>
                setFormData({ ...formData, class: e.target.value })
              }
              placeholder="e.g. A"
              className="bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring rounded-card"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              Full Course Name
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Advanced AI Management"
              className="bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring font-medium rounded-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              SKS (Credits)
            </Label>
            <Input
              type="number"
              value={formData.sks}
              onChange={(e) =>
                setFormData({ ...formData, sks: Number(e.target.value) })
              }
              className="bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring font-mono rounded-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              Academic Room
            </Label>
            <Input
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
              placeholder="e.g. Lab 01"
              className="bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring rounded-card"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-muted-foreground ml-1">
              Professor / Lecturer
            </Label>
            <Input
              value={formData.lecturer}
              onChange={(e) =>
                setFormData({ ...formData, lecturer: e.target.value })
              }
              placeholder="e.g. Dr. John Doe"
              className="bg-muted border-border h-10 md:h-9 text-caption focus-visible:ring-ring rounded-card"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-caption font-bold flex items-center gap-2">
              <Icon name="clock" className="text-primary" />
              Schedule Slots
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addSlot}
              className="h-8 md:h-7 border-border text-caps font-mono uppercase hover:bg-muted hover:text-primary rounded-card px-4"
            >
              <Icon name="plus" className="mr-2" size={14} />
              Add Segment
            </Button>
          </div>

          <div className="space-y-3">
            {formData.schedule?.map((slot, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted p-4 rounded-card border border-border group relative"
              >
                <div className="w-full sm:w-auto">
                  <select
                    value={slot.day}
                    onChange={(e) =>
                      updateSlot(i, "day", e.target.value as any)
                    }
                    className="w-full sm:w-auto bg-card border border-border rounded-control h-9 md:h-8 px-3 text-caption font-mono focus:ring-1 focus:ring-ring outline-none cursor-pointer"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    type="time"
                    value={slot.start}
                    onChange={(e) =>
                      updateSlot(i, "start", e.target.value as any)
                    }
                    className="h-9 md:h-8 flex-1 sm:w-24 border-border bg-card text-caption font-mono px-2 rounded-control"
                  />
                  <span className="text-muted-foreground text-caption shrink-0">-</span>
                  <Input
                    type="time"
                    value={slot.end}
                    onChange={(e) =>
                      updateSlot(i, "end", e.target.value as any)
                    }
                    className="h-9 md:h-8 flex-1 sm:w-24 border-border bg-card text-caption font-mono px-2 rounded-control"
                  />
                </div>
                {formData.schedule!.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSlot(i)}
                    className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:ml-auto h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-control"
                  >
                    <Icon name="trash" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-mono text-caps uppercase text-muted-foreground h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.code || !formData.name}
            className="bg-primary hover:bg-primary text-primary-foreground font-medium px-6 rounded-card h-9 text-caption"
          >
            {course ? "Sync Changes" : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
