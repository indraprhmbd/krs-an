import type { Course, DayOfWeek } from "../types";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START_HOUR = 7;
const END_HOUR = 18; // 6 PM
const ROWS_PER_HOUR = 2; // 30 min slots

export function ScheduleGrid({ courses }: { courses: Course[] }) {
  const slots = (END_HOUR - START_HOUR) * ROWS_PER_HOUR;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <div
        className="grid grid-cols-6 border-l"
        style={{ gridTemplateRows: `auto repeat(${slots}, 3.5rem)` }}
      >
        {/* Header */}
        <div className="p-4 border-b border-r bg-slate-50/80"></div>
        {DAYS.map((d) => (
          <div
            key={d}
            className="p-3 border-b border-r font-display font-bold text-center bg-slate-50/80 text-slate-700 text-[11px] uppercase tracking-[0.15em]"
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
            return (
              <div
                key={i}
                className="border-b border-r px-3 text-[10px] text-right text-slate-300 font-mono pt-2 -mt-px h-14"
              >
                {i % 2 === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
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
                  className={`border-b h-14 ${i % 2 === 1 ? "border-slate-50/50" : "border-slate-100"}`}
                ></div>
              ))}
            </div>

            {/* Courses */}
            {courses
              .filter((c) => c.schedule.some((s) => s.day === day))
              .map((c) => {
                return c.schedule
                  .filter((s) => s.day === day)
                  .map((s, idx) => {
                    const startMin =
                      (Number(s.start.split(":")[0]) - START_HOUR) * 60 +
                      Number(s.start.split(":")[1]);
                    const durationMin =
                      Number(s.end.split(":")[0]) * 60 +
                      Number(s.end.split(":")[1]) -
                      (Number(s.start.split(":")[0]) * 60 +
                        Number(s.start.split(":")[1]));

                    const top = (startMin / 30) * 3.5;
                    const height = (durationMin / 30) * 3.5;

                    return (
                      <div
                        key={`${c.id}-${idx}`}
                        className="absolute left-1 right-1 rounded-sm px-3 py-2 text-[10px] border-l-4 shadow-sm flex flex-col justify-start overflow-hidden hover:z-10 transition-all bg-white border-blue-700/20 border-l-blue-700 hover:shadow-md hover:scale-[1.01]"
                        style={{ top: `${top}rem`, height: `${height}rem` }}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-mono font-bold text-blue-900 tracking-tighter truncate">
                            {c.code}
                          </span>
                          <span className="text-[8px] font-mono text-slate-300">
                            {c.class}
                          </span>
                        </div>
                        <span className="font-display font-medium text-slate-900 text-[11px] leading-tight line-clamp-2 mt-1 lowercase first-letter:uppercase">
                          {c.name}
                        </span>
                        <div className="mt-auto pt-2 flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-blue-700" />
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest truncate">
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
