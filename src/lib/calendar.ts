import {
  addDays,
  addMinutes,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fromISODate, isOverdue } from "./dates";
import type { CalendarEvent, Todo } from "../types";

export type CalendarView = "month" | "week" | "day";

export const CALENDAR_VIEWS: CalendarView[] = ["month", "week", "day"];
export const WEEK_STARTS_ON = 1;
export const HOUR_HEIGHT = 48;
export const SNAP_MINUTES = 15;
export const MINUTES_IN_DAY = 24 * 60;
export const DEFAULT_EVENT_MINUTES = 60;

export type CalendarItem =
  | {
      kind: "event";
      id: string;
      title: string;
      start: Date;
      end: Date;
      allDay: boolean;
      color: string;
      event: CalendarEvent;
    }
  | {
      kind: "deadline";
      id: string;
      title: string;
      start: Date;
      end: Date;
      allDay: true;
      color: string;
      todo: Todo;
    };

export type EventDraft = {
  start: Date;
  end: Date;
  allDay: boolean;
};

const ACCENT = "var(--accent)";

export function eventColor(event: CalendarEvent): string {
  return event.color ?? event.todo?.project?.color ?? ACCENT;
}

export function toCalendarItems(
  events: CalendarEvent[],
  deadlines: Todo[],
): CalendarItem[] {
  const items: CalendarItem[] = events.map((event) => ({
    kind: "event",
    id: event.id,
    title: event.title,
    start: new Date(event.startAt),
    end: new Date(event.endAt),
    allDay: event.allDay,
    color: eventColor(event),
    event,
  }));

  for (const todo of deadlines) {
    if (!todo.dueDate) continue;
    const start = fromISODate(todo.dueDate);
    items.push({
      kind: "deadline",
      id: `deadline-${todo.id}`,
      title: todo.title,
      start,
      end: addDays(start, 1),
      allDay: true,
      color:
        !todo.completed && isOverdue(todo.dueDate)
          ? "var(--danger)"
          : (todo.project?.color ?? "var(--warn)"),
      todo,
    });
  }
  return items;
}

// note: end is exclusive, so the last day an item touches is the day of end - 1ms
export function lastDayOf(item: Pick<CalendarItem, "start" | "end">): Date {
  const last = new Date(Math.max(item.start.getTime(), item.end.getTime() - 1));
  return startOfDay(last);
}

/** All-day and multi-day items live in the day rows, the rest in the time grid. */
export function isSpanning(item: CalendarItem): boolean {
  return item.allDay || !isSameDay(item.start, lastDayOf(item));
}

export function overlapsDay(item: CalendarItem, day: Date): boolean {
  return item.start < addDays(startOfDay(day), 1) && item.end > startOfDay(day);
}

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

export function visibleDays(view: CalendarView, anchor: Date): Date[] {
  let first = startOfDay(anchor);
  let last = first;
  if (view === "week") {
    first = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
    last = endOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
  } else if (view === "month") {
    first = startOfWeek(startOfMonth(anchor), { weekStartsOn: WEEK_STARTS_ON });
    last = endOfWeek(endOfMonth(anchor), { weekStartsOn: WEEK_STARTS_ON });
  }
  const count = differenceInCalendarDays(last, first) + 1;
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}

export function shiftAnchor(
  view: CalendarView,
  anchor: Date,
  direction: 1 | -1,
): Date {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addDays(anchor, 7 * direction);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
  return next;
}

export function rangeLabel(view: CalendarView, anchor: Date): string {
  if (view === "month") return format(anchor, "MMMM yyyy");
  if (view === "day") {
    return format(
      anchor,
      isSameYear(anchor, new Date()) ? "EEEE, d MMMM" : "EEEE, d MMMM yyyy",
    );
  }
  const days = visibleDays("week", anchor);
  const first = days[0];
  const last = days[days.length - 1];
  if (isSameMonth(first, last)) {
    return `${format(first, "d")} – ${format(last, "d MMMM yyyy")}`;
  }
  if (isSameYear(first, last)) {
    return `${format(first, "d MMM")} – ${format(last, "d MMM yyyy")}`;
  }
  return `${format(first, "d MMM yyyy")} – ${format(last, "d MMM yyyy")}`;
}

// ---------------------------------------------------------------------------
// Minutes <-> dates
// ---------------------------------------------------------------------------

export const snapMinutes = (minutes: number) =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function minutesOfDay(date: Date, day: Date): number {
  return clamp(
    (date.getTime() - startOfDay(day).getTime()) / 60_000,
    0,
    MINUTES_IN_DAY,
  );
}

export const dateAtMinutes = (day: Date, minutes: number) =>
  addMinutes(startOfDay(day), minutes);

export const shiftDays = (date: Date, days: number) => addDays(date, days);

// ---------------------------------------------------------------------------
// Day rows: lane packing for all-day / multi-day bars (month view + all-day row)
// ---------------------------------------------------------------------------

export type LaneItem = {
  item: CalendarItem;
  startCol: number;
  span: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export function packRow(items: CalendarItem[], days: Date[]): LaneItem[] {
  const rowStart = startOfDay(days[0]);
  const rowEnd = addDays(startOfDay(days[days.length - 1]), 1);

  const placed = items
    .filter((item) => item.start < rowEnd && item.end > rowStart)
    .map((item) => {
      const startCol = Math.max(
        0,
        differenceInCalendarDays(item.start, rowStart),
      );
      const endCol = Math.min(
        days.length - 1,
        differenceInCalendarDays(lastDayOf(item), rowStart),
      );
      return {
        item,
        startCol,
        span: endCol - startCol + 1,
        lane: 0,
        continuesBefore: item.start < rowStart,
        continuesAfter: lastDayOf(item) >= rowEnd,
      };
    })
    // note: long bars first so they claim the top lanes, then all-day, then by time
    .sort(
      (a, b) =>
        a.startCol - b.startCol ||
        b.span - a.span ||
        Number(isSpanning(b.item)) - Number(isSpanning(a.item)) ||
        a.item.start.getTime() - b.item.start.getTime(),
    );

  const lanes: boolean[][] = [];
  for (const entry of placed) {
    let lane = 0;
    for (; ; lane++) {
      lanes[lane] ??= [];
      let free = true;
      for (let c = entry.startCol; c < entry.startCol + entry.span; c++) {
        if (lanes[lane][c]) {
          free = false;
          break;
        }
      }
      if (free) break;
    }
    for (let c = entry.startCol; c < entry.startCol + entry.span; c++) {
      lanes[lane][c] = true;
    }
    entry.lane = lane;
  }
  return placed;
}

// ---------------------------------------------------------------------------
// Time grid: side-by-side layout for overlapping timed events (week/day view)
// ---------------------------------------------------------------------------

export type PositionedItem = {
  item: CalendarItem;
  startMin: number;
  endMin: number;
  /** 0-1 fraction of the column */
  left: number;
  width: number;
};

const MIN_VISIBLE_MINUTES = 20;

export function layoutDay(items: CalendarItem[], day: Date): PositionedItem[] {
  const timed = items
    .filter((item) => !isSpanning(item) && overlapsDay(item, day))
    .map((item) => ({
      item,
      startMin: minutesOfDay(item.start, day),
      endMin: Math.max(
        minutesOfDay(item.end, day),
        minutesOfDay(item.start, day) + MIN_VISIBLE_MINUTES,
      ),
    }))
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const result: PositionedItem[] = [];
  let cluster: { entry: (typeof timed)[number]; col: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    const cols = columnEnds.length;
    for (const { entry, col } of cluster) {
      result.push({ ...entry, left: col / cols, width: 1 / cols });
    }
    cluster = [];
    columnEnds = [];
  };

  for (const entry of timed) {
    if (entry.startMin >= clusterEnd) flush();
    let col = columnEnds.findIndex((end) => end <= entry.startMin);
    if (col === -1) col = columnEnds.length;
    columnEnds[col] = entry.endMin;
    cluster.push({ entry, col });
    clusterEnd = Math.max(clusterEnd, entry.endMin);
  }
  flush();
  return result;
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
}
