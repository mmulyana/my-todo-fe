import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  isToday,
  isWeekend,
  min as minDate,
  max as maxDate,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { overlapsDay, packRow, type CalendarItem } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { ItemChip, type CalendarActions } from "./calendar-item";

export const LANE_HEIGHT = 22;
export const LANE_STRIDE = LANE_HEIGHT + 2;

type DayGesture =
  | {
      type: "move";
      item: CalendarItem;
      originDay: Date;
      currentDay: Date;
      startX: number;
      startY: number;
      moved: boolean;
      touch: boolean;
    }
  | { type: "create"; anchorDay: Date; currentDay: Date };

const DRAG_THRESHOLD_PX = 4;

export function useDayDrag({
  dateAt,
  actions,
}: {
  dateAt: (x: number, y: number) => Date | null;
  actions: CalendarActions;
}) {
  const [gesture, setGesture] = useState<DayGesture | null>(null);
  const latest = useRef({ gesture, dateAt, actions });
  latest.current = { gesture, dateAt, actions };
  const active = gesture !== null;

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      const day = latest.current.dateAt(e.clientX, e.clientY);
      setGesture((g) => {
        if (!g || !day) return g;
        if (g.type === "create") return { ...g, currentDay: day };
        if (g.touch) return g;
        const moved =
          g.moved ||
          Math.hypot(e.clientX - g.startX, e.clientY - g.startY) >
            DRAG_THRESHOLD_PX;
        return { ...g, moved, currentDay: day };
      });
    };

    const onUp = () => {
      const { gesture: g, actions: a } = latest.current;
      setGesture(null);
      if (!g) return;
      if (g.type === "move") {
        if (!g.moved) return a.onOpen(g.item);
        const delta = differenceInCalendarDays(g.currentDay, g.originDay);
        if (delta !== 0) {
          a.onMoveItem(
            g.item,
            addDays(g.item.start, delta),
            addDays(g.item.end, delta),
          );
        }
        return;
      }
      if (isSameDay(g.anchorDay, g.currentDay)) return;
      const first = minDate([g.anchorDay, g.currentDay]);
      const last = maxDate([g.anchorDay, g.currentDay]);
      a.onCreate({ start: first, end: addDays(last, 1), allDay: true });
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGesture(null);
    };
    const cancel = () => setGesture(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const grabbing = gesture?.type === "move" && gesture.moved;
  useEffect(() => {
    if (!grabbing) return;
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.cursor = "";
    };
  }, [grabbing]);

  const onItemPointerDown = (item: CalendarItem, e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const touch = e.pointerType === "touch";
    if (!touch) e.preventDefault();
    const day = dateAt(e.clientX, e.clientY) ?? item.start;
    setGesture({
      type: "move",
      item,
      originDay: day,
      currentDay: day,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      touch,
    });
  };

  const onCellPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    const day = dateAt(e.clientX, e.clientY);
    if (!day) return;
    e.preventDefault();
    setGesture({ type: "create", anchorDay: day, currentDay: day });
  };

  const preview = (items: CalendarItem[]): CalendarItem[] => {
    if (gesture?.type !== "move" || !gesture.moved) return items;
    const delta = differenceInCalendarDays(
      gesture.currentDay,
      gesture.originDay,
    );
    if (delta === 0) return items;
    return items.map((item) =>
      item.id === gesture.item.id
        ? {
            ...item,
            start: addDays(item.start, delta),
            end: addDays(item.end, delta),
          }
        : item,
    );
  };

  const inCreateRange = (day: Date) => {
    if (gesture?.type !== "create") return false;
    const first = minDate([gesture.anchorDay, gesture.currentDay]);
    const last = maxDate([gesture.anchorDay, gesture.currentDay]);
    return day >= first && day <= last;
  };

  return {
    preview,
    inCreateRange,
    onItemPointerDown,
    onCellPointerDown,
    draggingId:
      gesture?.type === "move" && gesture.moved ? gesture.item.id : null,
  };
}

export type DayDrag = ReturnType<typeof useDayDrag>;

export function DayRow({
  days,
  items,
  maxLanes,
  drag,
  actions,
  month,
  onDayClick,
  className,
}: {
  days: Date[];
  items: CalendarItem[];
  maxLanes: number;
  drag: DayDrag;
  actions: CalendarActions;
  month?: Date;
  onDayClick?: (day: Date) => void;
  className?: string;
}) {
  const placed = packRow(items, days);
  const cols = days.length;

  const deepest = Array<number>(cols).fill(-1);
  for (const p of placed) {
    for (let c = p.startCol; c < p.startCol + p.span; c++) {
      deepest[c] = Math.max(deepest[c], p.lane);
    }
  }
  const overflows = (c: number) => deepest[c] > maxLanes;
  const visible = placed.filter((p) => {
    if (p.lane < maxLanes) return true;
    if (p.lane > maxLanes) return false;
    for (let c = p.startCol; c < p.startCol + p.span; c++) {
      if (overflows(c)) return false;
    }
    return true;
  });
  const hiddenCount = (c: number) =>
    placed.filter(
      (p) => c >= p.startCol && c < p.startCol + p.span && !visible.includes(p),
    ).length;

  const top = month ? 26 : 2;
  const usedLanes = Math.min(
    maxLanes + 1,
    Math.max(1, ...deepest.map((d) => d + 1)),
  );

  return (
    <div
      className={cn("relative grid", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        minHeight: month ? undefined : top + usedLanes * LANE_STRIDE + 4,
      }}
    >
      {days.map((day) => {
        const outside = month && day.getMonth() !== month.getMonth();
        return (
          <div
            key={day.toISOString()}
            onPointerDown={drag.onCellPointerDown}
            onDoubleClick={() =>
              actions.onCreate({
                start: day,
                end: addDays(day, 1),
                allDay: true,
              })
            }
            className={cn(
              "border-l border-line first:border-l-0 min-w-0",
              isWeekend(day) && "bg-tint/2",
              drag.inCreateRange(day) && "bg-accent/15",
            )}
          >
            {month && (
              <div className="flex justify-end p-1">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onDayClick?.(day)}
                  className={cn(
                    "min-w-5.5 h-5.5 px-1 rounded-full text-xs tabular-nums hover:bg-tint/10 cursor-pointer",
                    outside ? "text-muted/60" : "text-fg/80",
                    isToday(day) && "bg-accent text-white hover:bg-accent/90",
                  )}
                >
                  {day.getDate() === 1 ? format(day, "d MMM") : day.getDate()}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {visible.map((p) => (
        <ItemChip
          key={p.item.id}
          item={p.item}
          continuesBefore={p.continuesBefore}
          continuesAfter={p.continuesAfter}
          dragging={drag.draggingId === p.item.id}
          onPointerDown={(e) => drag.onItemPointerDown(p.item, e)}
          className="absolute"
          style={{
            top: top + p.lane * LANE_STRIDE,
            left: `calc(${(p.startCol / cols) * 100}% + 2px)`,
            width: `calc(${(p.span / cols) * 100}% - 4px)`,
          }}
        />
      ))}

      {days.map((day, c) => {
        const hidden = hiddenCount(c);
        if (!hidden) return null;
        return (
          <OverflowButton
            key={`more-${day.toISOString()}`}
            day={day}
            count={hidden}
            items={items.filter((item) => overlapsDay(item, day))}
            actions={actions}
            style={{
              top: top + maxLanes * LANE_STRIDE,
              left: `calc(${(c / cols) * 100}% + 2px)`,
              width: `calc(${100 / cols}% - 4px)`,
            }}
          />
        );
      })}
    </div>
  );
}

function OverflowButton({
  day,
  count,
  items,
  actions,
  style,
}: {
  day: Date;
  count: number;
  items: CalendarItem[];
  actions: CalendarActions;
  style: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute h-5.5 px-1.5 text-left text-xs text-muted hover:text-fg hover:bg-tint/5 rounded-md cursor-pointer truncate"
          style={style}
        >
          +{count} more
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="px-1 pb-1.5 text-xs font-medium text-muted">
          {format(day, "EEEE, d MMMM")}
        </p>
        <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
          {items.map((item) => (
            <ItemChip
              key={item.id}
              item={item}
              onClick={() => {
                setOpen(false);
                actions.onOpen(item);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
