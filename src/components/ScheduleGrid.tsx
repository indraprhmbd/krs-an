import type { Course, DayOfWeek } from "../types";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 7;
const END_HOUR = 18; // 6 PM
const ROWS_PER_HOUR = 2; // 30 min slots

export function ScheduleGrid({ courses }: { courses: Course[] }) {
  const slots = (END_HOUR - START_HOUR) * ROWS_PER_HOUR;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-h-[70vh] overflow-y-auto custom-scrollbar">
      <div
        className="grid grid-cols-6 border-l min-w-[800px]"
        style={{ gridTemplateRows: `auto repeat(${slots}, 2rem)` }}
      >
        {/* Header */}
        <div className="p-3 border-b border-r bg-slate-50/80 sticky top-0 z-10"></div>
        {DAYS.map((d) => (
          <div
            key={d}
            className="p-2 border-b border-r font-display font-bold text-center bg-slate-50/80 text-slate-700 text-[10px] uppercase tracking-wider sticky top-0 z-10"
          >
            {d}
          </div>
        ))}

        {/* Time Column */}
        <div
          className="row-span-full grid"
          style={{ gridTemplateRows: `repeat(${slots}, 1fr)` }}
        >
          {Array.from({ length: slots }).map((_, i) => {
            const h = START_HOUR + Math.floor(i / 2);
            const m = i % 2 === 0 ? "00" : "30";
            return (
              <div
                key={i}
                className="border-b border-r px-2 text-[9px] text-right text-slate-400 font-mono flex items-center justify-end h-8"
              >
                {m === "00" ? `${String(h).padStart(2, "0")}:00` : ""}
              </div>
            );
          })}
        </div>

        {/* Days Columns */}
        {DAYS.map((day) => (
          <div
            key={day}
            className="relative border-r"
            style={{ gridRow: `2 / span ${slots}` }}
          >
            {/* Grid lines */}
            <div
              className="absolute inset-0 grid"
              style={{ gridTemplateRows: `repeat(${slots}, 1fr)` }}
            >
              {Array.from({ length: slots }).map((_, i) => (
                <div
                  key={i}
                  className={`border-b h-8 ${i % 2 === 1 ? "border-slate-50/50" : "border-slate-100"}`}
                ></div>
              ))}
            </div>

            {/* Courses */}
            {courses
              .filter((c) =>
                c.schedule.some((s) =>
                  s.day.toLowerCase().startsWith(day.toLowerCase().slice(0, 3)),
                ),
              )
              .map((c) => {
                return c.schedule
                  .filter((s) =>
                    s.day
                      .toLowerCase()
                      .startsWith(day.toLowerCase().slice(0, 3)),
                  )
                  .map((s, idx) => {
                    const startMin =
                      (Number(s.start.split(":")[0]) - START_HOUR) * 60 +
                      Number(s.start.split(":")[1]);
                    const durationMin =
                      Number(s.end.split(":")[0]) * 60 +
                      Number(s.end.split(":")[1]) -
                      (Number(s.start.split(":")[0]) * 60 +
                        Number(s.start.split(":")[1]));

                    const top = (startMin / 30) * 2;
                    const height = (durationMin / 30) * 2;

                    return (
                      <div
                        key={`${c.id}-${idx}`}
                        className="absolute left-0.5 right-0.5 rounded-md px-2 py-1.5 text-[9px] border-l-4 shadow-sm flex flex-col justify-start overflow-hidden hover:z-20 transition-all bg-white border-blue-600/10 border-l-blue-600 hover:shadow-md hover:scale-[1.01]"
                        style={{ top: `${top}rem`, height: `${height}rem` }}
                      >
                        <div className="flex justify-between items-start w-full gap-1">
                          <span className="font-mono font-bold text-blue-900 tracking-tighter truncate">
                            {c.code}
                          </span>
                          <span className="text-[7px] font-mono text-slate-400 shrink-0">
                            {c.class}
                          </span>
                        </div>
                        <span className="font-display font-medium text-slate-900 text-[10px] leading-tight line-clamp-1 mt-0.5">
                          {c.name}
                        </span>
                        <div className="mt-auto flex items-center gap-1 opacity-60">
                          <span className="text-[8px] font-mono text-slate-500 truncate">
                            {c.room}
                          </span>
                        </div>
                      </div>
                    );
                  });
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
