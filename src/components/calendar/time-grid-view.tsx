import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  addMinutes,
  differenceInMinutes,
  format,
  isToday,
  isWeekend,
} from "date-fns";
import {
  clamp,
  dateAtMinutes,
  DEFAULT_EVENT_MINUTES,
  HOUR_HEIGHT,
  isSpanning,
  layoutDay,
  MINUTES_IN_DAY,
  minutesOfDay,
  SNAP_MINUTES,
  snapMinutes,
  type CalendarItem,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { TimedCard, type CalendarActions } from "./calendar-item";
import { DayRow, useDayDrag } from "./day-rows";

const GUTTER = 56;
const GRID_HEIGHT = 24 * HOUR_HEIGHT;
const ALL_DAY_LANES = 3;
const DRAG_THRESHOLD_PX = 4;
const START_HOUR = 7.5;

const toPx = (minutes: number) => (minutes / 60) * HOUR_HEIGHT;

type GridGesture =
  | { type: "create"; dayIndex: number; anchorMin: number; currentMin: number }
  | {
      type: "move";
      item: CalendarItem;
      dayIndex: number;
      startMin: number;
      duration: number;
      offset: number;
      startX: number;
      startY: number;
      moved: boolean;
    }
  | {
      type: "resize";
      item: CalendarItem;
      dayIndex: number;
      startMin: number;
      endMin: number;
    };

function useNowMinute() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function TimeGridView({
  days,
  items,
  actions,
  onDayClick,
}: {
  days: Date[];
  items: CalendarItem[];
  actions: CalendarActions;
  onDayClick?: (day: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const allDayRef = useRef<HTMLDivElement>(null);
  const now = useNowMinute();
  const cols = days.length;
  const template = `${GUTTER}px repeat(${cols}, minmax(0, 1fr))`;

  // note: start around working hours, late in the day today scrolls further so the now line stays visible
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const visibleHours = el.clientHeight / HOUR_HEIGHT;
    const nowHour = new Date().getHours();
    const showsToday = days.some((d) => isToday(d));
    const hour =
      showsToday && nowHour + 2 > START_HOUR + visibleHours
        ? nowHour + 2 - visibleHours
        : START_HOUR;
    el.scrollTop = hour * HOUR_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols]);

  const allDayDrag = useDayDrag({
    dateAt: (x) => {
      const rect = allDayRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return days[
        clamp(Math.floor(((x - rect.left) / rect.width) * cols), 0, cols - 1)
      ];
    },
    actions,
  });
  const spanning = allDayDrag.preview(items.filter(isSpanning));

  const [gesture, setGesture] = useState<GridGesture | null>(null);
  const latest = useRef({ gesture, actions, days });
  latest.current = { gesture, actions, days };
  const active = gesture !== null;

  const pointAt = (x: number, y: number) => {
    const rect = columnsRef.current!.getBoundingClientRect();
    return {
      dayIndex: clamp(
        Math.floor(((x - rect.left) / rect.width) * cols),
        0,
        cols - 1,
      ),
      minutes: clamp(
        ((y - rect.top) / rect.height) * MINUTES_IN_DAY,
        0,
        MINUTES_IN_DAY,
      ),
    };
  };
  const pointAtRef = useRef(pointAt);
  pointAtRef.current = pointAt;

  useEffect(() => {
    if (!active) return;

    const onMove = (e: PointerEvent) => {
      const p = pointAtRef.current(e.clientX, e.clientY);
      setGesture((g) => {
        if (!g) return g;
        if (g.type === "create") {
          return { ...g, currentMin: snapMinutes(p.minutes) };
        }
        if (g.type === "resize") {
          return {
            ...g,
            endMin: clamp(
              snapMinutes(p.minutes),
              g.startMin + SNAP_MINUTES,
              MINUTES_IN_DAY,
            ),
          };
        }
        const moved =
          g.moved ||
          Math.hypot(e.clientX - g.startX, e.clientY - g.startY) >
            DRAG_THRESHOLD_PX;
        if (!moved) return g;
        const latestStart =
          MINUTES_IN_DAY - Math.min(g.duration, MINUTES_IN_DAY);
        return {
          ...g,
          moved,
          dayIndex: p.dayIndex,
          startMin: clamp(snapMinutes(p.minutes - g.offset), 0, latestStart),
        };
      });
    };

    const onUp = () => {
      const { gesture: g, actions: a, days: d } = latest.current;
      setGesture(null);
      if (!g) return;
      const day = d[g.dayIndex];

      if (g.type === "create") {
        const from = Math.min(g.anchorMin, g.currentMin);
        const to = Math.max(g.anchorMin, g.currentMin);
        if (to - from < SNAP_MINUTES) return;
        a.onCreate({
          start: dateAtMinutes(day, from),
          end: dateAtMinutes(day, to),
          allDay: false,
        });
        return;
      }

      if (g.type === "resize") {
        const end = dateAtMinutes(day, g.endMin);
        if (end.getTime() !== g.item.end.getTime()) {
          a.onMoveItem(g.item, g.item.start, end);
        }
        return;
      }

      if (!g.moved) return a.onOpen(g.item);
      const start = dateAtMinutes(day, g.startMin);
      if (start.getTime() !== g.item.start.getTime()) {
        a.onMoveItem(g.item, start, addMinutes(start, g.duration));
      }
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

  const cursor =
    gesture?.type === "resize" || gesture?.type === "create"
      ? "row-resize"
      : gesture?.type === "move" && gesture.moved
        ? "grabbing"
        : "";
  useEffect(() => {
    if (!cursor) return;
    document.body.style.cursor = cursor;
    return () => {
      document.body.style.cursor = "";
    };
  }, [cursor]);

  // note: touch keeps scrolling the grid, drag gestures are mouse/pen only (same as Analog)
  const onColumnPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    e.preventDefault();
    const p = pointAt(e.clientX, e.clientY);
    const anchor = Math.floor(p.minutes / SNAP_MINUTES) * SNAP_MINUTES;
    setGesture({
      type: "create",
      dayIndex: p.dayIndex,
      anchorMin: anchor,
      currentMin: anchor,
    });
  };

  const onColumnDoubleClick = (e: React.MouseEvent) => {
    const p = pointAt(e.clientX, e.clientY);
    const from = Math.min(
      Math.floor(p.minutes / SNAP_MINUTES) * SNAP_MINUTES,
      MINUTES_IN_DAY - DEFAULT_EVENT_MINUTES,
    );
    actions.onCreate({
      start: dateAtMinutes(days[p.dayIndex], from),
      end: dateAtMinutes(days[p.dayIndex], from + DEFAULT_EVENT_MINUTES),
      allDay: false,
    });
  };

  const onCardPointerDown = (
    item: CalendarItem,
    dayIndex: number,
    e: ReactPointerEvent,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.pointerType === "touch") {
      actions.onOpen(item);
      return;
    }
    e.preventDefault();
    const p = pointAt(e.clientX, e.clientY);
    const startMin = minutesOfDay(item.start, days[dayIndex]);
    setGesture({
      type: "move",
      item,
      dayIndex,
      startMin,
      duration: differenceInMinutes(item.end, item.start),
      offset: p.minutes - startMin,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    });
  };

  const onResizePointerDown = (
    item: CalendarItem,
    dayIndex: number,
    e: ReactPointerEvent,
  ) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    e.stopPropagation();
    e.preventDefault();
    setGesture({
      type: "resize",
      item,
      dayIndex,
      startMin: minutesOfDay(item.start, days[dayIndex]),
      endMin: minutesOfDay(item.end, days[dayIndex]),
    });
  };

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
    >
      {/* sticky header: day names + all-day row stay visible while scrolling */}
      <div className="sticky top-0 z-20 bg-surface border-b border-line">
        <div className="grid" style={{ gridTemplateColumns: template }}>
          <div />
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick?.(day)}
              disabled={!onDayClick}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-sm border-l border-line enabled:cursor-pointer enabled:hover:bg-tint/3",
                isToday(day) ? "text-accent font-medium" : "text-muted",
              )}
            >
              <span className="text-xs uppercase tracking-wide">
                {" "}
                {format(day, "EEE")}{" "}
              </span>
              <span
                className={cn(
                  "min-w-6 h-6 px-1 inline-flex items-center justify-center rounded-full tabular-nums",
                  isToday(day) ? "bg-accent text-white" : "text-fg",
                )}
              >
                {format(day, "d")}
              </span>
            </button>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: template }}>
          <div className="flex h-full items-center justify-center text-[10px] text-muted"></div>
          <div
            ref={allDayRef}
            className="relative before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-line"
            style={{ gridColumn: `span ${cols}` }}
          >
            <DayRow
              days={days}
              items={spanning}
              maxLanes={ALL_DAY_LANES}
              drag={allDayDrag}
              actions={actions}
            />
          </div>
        </div>
      </div>

      <div className="flex" style={{ height: GRID_HEIGHT }}>
        <div className="relative shrink-0" style={{ width: GUTTER }}>
          {Array.from({ length: 23 }, (_, i) => i + 1).map((hour) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        <div
          ref={columnsRef}
          className="relative flex-1 grid"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {/* hour lines */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(to bottom, var(--line) 1px, transparent 1px)`,
              backgroundSize: `100% ${HOUR_HEIGHT}px`,
            }}
          />

          {days.map((day, dayIndex) => {
            const positioned = layoutDay(items, day).map((p) =>
              gesture?.type === "resize" &&
              gesture.item.id === p.item.id &&
              gesture.dayIndex === dayIndex
                ? { ...p, endMin: gesture.endMin }
                : p,
            );
            const nowMin = isToday(day) ? minutesOfDay(now, day) : null;

            return (
              <div
                key={day.toISOString()}
                onPointerDown={onColumnPointerDown}
                onDoubleClick={onColumnDoubleClick}
                className={cn(
                  "relative border-l border-line",
                  isWeekend(day) && "bg-tint/2",
                )}
              >
                {positioned.map((p) => {
                  const resizing =
                    gesture?.type === "resize" && gesture.item.id === p.item.id;
                  const end = resizing
                    ? dateAtMinutes(day, p.endMin)
                    : p.item.end;
                  const height = Math.max(toPx(p.endMin - p.startMin) - 2, 14);
                  return (
                    <div
                      key={p.item.id}
                      className="absolute px-px"
                      style={{
                        top: toPx(p.startMin) + 1,
                        height,
                        left: `${p.left * 100}%`,
                        width: `${p.width * 100}%`,
                      }}
                    >
                      <TimedCard
                        item={p.item}
                        start={p.item.start}
                        end={end}
                        heightPx={height}
                        dragging={
                          gesture?.type === "move" &&
                          gesture.moved &&
                          gesture.item.id === p.item.id
                        }
                        onPointerDown={(e) =>
                          onCardPointerDown(p.item, dayIndex, e)
                        }
                        onResizePointerDown={
                          p.item.kind === "event"
                            ? (e) => onResizePointerDown(p.item, dayIndex, e)
                            : undefined
                        }
                      />
                    </div>
                  );
                })}

                {gesture?.type === "move" &&
                  gesture.moved &&
                  gesture.dayIndex === dayIndex && (
                    <div
                      className="absolute inset-x-0 px-px pointer-events-none z-30"
                      style={{
                        top: toPx(gesture.startMin) + 1,
                        height: Math.max(
                          toPx(
                            Math.min(
                              gesture.duration,
                              MINUTES_IN_DAY - gesture.startMin,
                            ),
                          ) - 2,
                          14,
                        ),
                      }}
                    >
                      <TimedCard
                        item={gesture.item}
                        start={dateAtMinutes(day, gesture.startMin)}
                        end={addMinutes(
                          dateAtMinutes(day, gesture.startMin),
                          gesture.duration,
                        )}
                        heightPx={toPx(gesture.duration)}
                        ghost
                      />
                    </div>
                  )}

                {gesture?.type === "create" &&
                  gesture.dayIndex === dayIndex &&
                  gesture.currentMin !== gesture.anchorMin && (
                    <CreatePreview
                      day={day}
                      from={Math.min(gesture.anchorMin, gesture.currentMin)}
                      to={Math.max(gesture.anchorMin, gesture.currentMin)}
                    />
                  )}

                {nowMin !== null && (
                  <div
                    aria-hidden
                    className="absolute inset-x-0 z-10 pointer-events-none"
                    style={{ top: toPx(nowMin) }}
                  >
                    <div className="relative h-0.5 bg-danger">
                      <span className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-danger" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CreatePreview({
  day,
  from,
  to,
}: {
  day: Date;
  from: number;
  to: number;
}) {
  return (
    <div
      className="absolute inset-x-0 px-px z-20 pointer-events-none"
      style={{ top: toPx(from) + 1, height: Math.max(toPx(to - from) - 2, 4) }}
    >
      <div className="h-full rounded-md border border-accent bg-accent/25 px-1.5 py-1 text-xs text-fg tabular-nums">
        {format(dateAtMinutes(day, from), "HH:mm")} –{" "}
        {format(dateAtMinutes(day, to), "HH:mm")}
      </div>
    </div>
  );
}
