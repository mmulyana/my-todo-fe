import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { clamp, type CalendarItem } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { CalendarActions } from "./calendar-item";
import { DayRow, LANE_STRIDE, useDayDrag } from "./day-rows";

const DAY_HEADER_HEIGHT = 26;

function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, height] as const;
}

export function MonthView({
  anchor,
  days,
  items,
  actions,
  onDayClick,
}: {
  anchor: Date;
  days: Date[];
  items: CalendarItem[];
  actions: CalendarActions;
  onDayClick: (day: Date) => void;
}) {
  const [gridRef, gridHeight] = useElementHeight<HTMLDivElement>();
  const weeks = Array.from({ length: days.length / 7 }, (_, i) =>
    days.slice(i * 7, i * 7 + 7),
  );

  const dateAt = (x: number, y: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const col = clamp(Math.floor(((x - rect.left) / rect.width) * 7), 0, 6);
    const row = clamp(
      Math.floor(((y - rect.top) / rect.height) * weeks.length),
      0,
      weeks.length - 1,
    );
    return days[row * 7 + col] ?? null;
  };
  const drag = useDayDrag({ dateAt, actions });
  const shown = drag.preview(items);

  const rowHeight = gridHeight / weeks.length;
  // note: one lane is kept free for the +N button
  const maxLanes = Math.max(
    1,
    Math.floor((rowHeight - DAY_HEADER_HEIGHT - 4) / LANE_STRIDE) - 1,
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="grid grid-cols-7 border-b border-line shrink-0">
        {weeks[0]?.map((day) => (
          <div
            key={day.toISOString()}
            className="px-2 py-1.5 text-xs font-medium text-muted text-right"
          >
            {format(day, "EEE")}
          </div>
        ))}
      </div>
      <div
        ref={gridRef}
        className="flex-1 min-h-0 grid overflow-hidden"
        style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.map((week) => (
          <DayRow
            key={week[0].toISOString()}
            days={week}
            items={shown}
            maxLanes={maxLanes}
            drag={drag}
            actions={actions}
            month={anchor}
            onDayClick={onDayClick}
            className={cn("border-b border-line last:border-b-0 min-h-0")}
          />
        ))}
      </div>
    </div>
  );
}
