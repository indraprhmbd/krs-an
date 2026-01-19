import { Badge } from "@/components/ui/badge";
import type { Course, DayOfWeek } from "../types";
import { checkConflicts } from "../lib/rules";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const START_HOUR = 7;
const END_HOUR = 18; // 6 PM
const ROWS_PER_HOUR = 2; // 30 min slots

export function ScheduleGrid({ courses }: { courses: Course[] }) {
  const slots = (END_HOUR - START_HOUR) * ROWS_PER_HOUR;
  const { messages: conflictMessages } = checkConflicts(courses);

  // A course is conflicted if its name and class appear in any conflict message
  const isConflicted = (c: Course) =>
    conflictMessages.some((m) => m.includes(c.name) && m.includes(c.class));

  return (
    <div className="bg-slate-50/50 rounded-xl overflow-hidden border border-slate-200 shadow-inner p-1 h-full max-h-[80vh] flex flex-col">
      <div className="bg-white rounded-lg border border-slate-100 shadow-2xl shadow-blue-50/50 flex-1 overflow-auto custom-scrollbar relative">
        <div
          className="grid grid-cols-[50px_repeat(6,minmax(100px,1fr))] md:grid-cols-[60px_repeat(6,1fr)] min-w-[700px] md:min-w-0"
          style={{ gridTemplateRows: `auto repeat(${slots}, 1.5rem)` }}
        >
          {/* Header */}
          <div className="p-1.5 border-b border-r bg-slate-50 sticky top-0 left-0 z-30 grid-col-1 grid-row-1"></div>
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="p-1.5 border-b border-r font-display font-bold text-center bg-slate-50 text-slate-500 text-[9px] uppercase tracking-wider sticky top-0 z-20"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {d}
            </div>
          ))}

          {/* Time Column */}
          <div
            className="grid sticky left-0 z-20 bg-white"
            style={{
              gridTemplateRows: `repeat(${slots}, 1fr)`,
              gridColumn: 1,
              gridRow: `2 / span ${slots}`,
            }}
          >
            {Array.from({ length: slots }).map((_, i) => {
              const h = START_HOUR + Math.floor(i / 2);
              const m = i % 2 === 0 ? "00" : "30";
              return (
                <div
                  key={i}
                  className="border-b border-r px-1 text-[8px] text-right text-slate-400 font-mono flex items-center justify-end h-6"
                >
                  {m === "00" ? `${String(h).padStart(2, "0")}:00` : ""}
                </div>
              );
            })}
          </div>

          {/* Days Columns */}
          {DAYS.map((day, dayIdx) => {
            const dayMap: Record<string, string> = {
              mon: "mon",
              senin: "mon",
              tue: "tue",
              selasa: "tue",
              wed: "wed",
              rabu: "wed",
              thu: "thu",
              kamis: "thu",
              fri: "fri",
              jumat: "fri",
              "jum'at": "fri",
              jum: "fri",
              sat: "sat",
              sabtu: "sat",
            };

            return (
              <div
                key={day}
                className="relative"
                style={{
                  gridRow: `2 / span ${slots}`,
                  gridColumn: dayIdx + 2,
                }}
              >
                {/* Vertical border per column */}
                <div className="absolute inset-y-0 right-0 w-px bg-slate-100 z-0"></div>

                {/* Grid lines */}
                <div
                  className="absolute inset-0 grid z-0"
                  style={{ gridTemplateRows: `repeat(${slots}, 1fr)` }}
                >
                  {Array.from({ length: slots }).map((_, i) => (
                    <div
                      key={i}
                      className={`border-b h-6 ${i % 2 === 1 ? "border-slate-50/50" : "border-slate-100"}`}
                    ></div>
                  ))}
                </div>

                {/* Courses */}
                {courses
                  .filter((c) =>
                    c.schedule.some((s) => {
                      const lower = (s.day || "").toLowerCase().trim();
                      const normalized =
                        dayMap[lower] ||
                        dayMap[lower.slice(0, 3)] ||
                        (lower.includes("jum") ? "fri" : lower.slice(0, 3));
                      return normalized === day.toLowerCase();
                    }),
                  )
                  .map((c) => {
                    return c.schedule
                      .filter((s) => {
                        const lower = (s.day || "").toLowerCase().trim();
                        const normalized =
                          dayMap[lower] ||
                          dayMap[lower.slice(0, 3)] ||
                          (lower.includes("jum") ? "fri" : lower.slice(0, 3));
                        return normalized === day.toLowerCase();
                      })
                      .map((s, idx) => {
                        const startMin =
                          (Number(s.start.split(":")[0]) - START_HOUR) * 60 +
                          Number(s.start.split(":")[1]);
                        const durationMin =
                          Number(s.end.split(":")[0]) * 60 +
                          Number(s.end.split(":")[1]) -
                          (Number(s.start.split(":")[0]) * 60 +
                            Number(s.start.split(":")[1]));

                        const top = (startMin / 30) * 1.5;
                        const height = (durationMin / 30) * 1.5;
                        const conflicted = isConflicted(c);

                        return (
                          <div
                            key={`${c.id}-${idx}`}
                            className={`absolute left-[1px] right-[1px] rounded-[2px] p-1 text-[8px] border shadow-sm flex flex-col justify-start overflow-hidden hover:z-40 transition-all ${
                              conflicted
                                ? "bg-red-50 border-red-200 border-l-2 border-l-red-600"
                                : "bg-white hover:bg-blue-50 border-blue-200 border-l-2 border-l-blue-600"
                            }`}
                            style={{ top: `${top}rem`, height: `${height}rem` }}
                          >
                            <div className="flex justify-between items-start mb-0 overflow-hidden leading-none">
                              <span
                                className={`font-mono font-bold truncate mr-0.5 scale-90 origin-left ${conflicted ? "text-red-700" : "text-blue-700"}`}
                              >
                                {c.code}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[6px] h-2.5 px-0.5 shrink-0 rounded-[1px] border-blue-100"
                              >
                                {c.class}
                              </Badge>
                            </div>
                            <span className="font-bold text-slate-800 leading-[1] line-clamp-1 mt-0.5">
                              {c.name}
                            </span>
                            <div className="mt-auto flex items-center justify-between text-[7px] text-slate-500 font-bold font-mono">
                              <span className="truncate">
                                {c.lecturer.split(",")[0].split(" ")[0] ===
                                "Dosen"
                                  ? c.lecturer.split(",")[0]
                                  : c.lecturer.split(",")[0]}
                              </span>
                            </div>
                          </div>
                        );
                      });
                  })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
