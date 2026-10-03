import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, addHours, startOfHour } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { MonthView } from "../components/calendar/month-view";
import { TimeGridView } from "../components/calendar/time-grid-view";
import {
  EventDialog,
  type EventDialogTarget,
} from "../components/calendar/event-dialog";
import type { CalendarActions } from "../components/calendar/calendar-item";
import {
  useCalendarEvents,
  useDeadlines,
  useUpdateCalendarEvent,
} from "../hooks/useCalendarEvents";
import { useUpdateTodo } from "../hooks/useTodos";
import { fromISODate, toISODate } from "../lib/dates";
import {
  CALENDAR_VIEWS,
  shiftAnchor,
  toCalendarItems,
  visibleDays,
  type CalendarView,
} from "../lib/calendar";
import { cn } from "@/lib/utils";

const VIEW_KEYS: Record<string, CalendarView> = {
  m: "month",
  w: "week",
  d: "day",
};

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return Boolean(
    el &&
    (el.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)),
  );
}

export default function CalendarPage() {
  const [params, setParams] = useSearchParams();
  const view: CalendarView = CALENDAR_VIEWS.includes(
    params.get("view") as CalendarView,
  )
    ? (params.get("view") as CalendarView)
    : "week";
  const dateParam = params.get("date");
  const anchor = useMemo(
    () => (dateParam ? fromISODate(dateParam) : new Date()),
    [dateParam],
  );

  const go = (next: { view?: CalendarView; date?: Date }) => {
    const p = new URLSearchParams(params);
    p.set("view", next.view ?? view);
    p.set("date", toISODate(next.date ?? anchor));
    setParams(p, { replace: true });
  };

  const days = useMemo(() => visibleDays(view, anchor), [view, anchor]);
  const first = days[0];
  const last = days[days.length - 1];

  const { data: events = [] } = useCalendarEvents(
    first.toISOString(),
    addDays(last, 1).toISOString(),
  );
  const { data: deadlines = [] } = useDeadlines(
    toISODate(first),
    toISODate(last),
  );
  const items = useMemo(
    () => toCalendarItems(events, deadlines),
    [events, deadlines],
  );

  const [dialog, setDialog] = useState<EventDialogTarget | null>(null);

  // note: AppLayout shows the detail pane for ?todo=, so the calendar stays where it is
  const openTodo = (id: string) =>
    setParams(
      (prev) => {
        prev.set("todo", id);
        return prev;
      },
      { replace: true },
    );
  const updateEvent = useUpdateCalendarEvent();
  const updateTodo = useUpdateTodo();

  const actions: CalendarActions = {
    onCreate: (draft) => setDialog({ mode: "create", draft }),
    onOpen: (item) => {
      if (item.kind === "deadline") openTodo(item.todo.id);
      else if (!item.event.id.startsWith("temp-")) {
        setDialog({ mode: "edit", event: item.event });
      }
    },
    onMoveItem: (item, start, end) => {
      if (item.kind === "deadline") {
        updateTodo.mutate({
          id: item.todo.id,
          patch: { dueDate: toISODate(start) },
        });
        return;
      }
      if (item.event.id.startsWith("temp-")) return;
      updateEvent.mutate({
        id: item.event.id,
        patch: { startAt: start.toISOString(), endAt: end.toISOString() },
      });
    },
  };

  const newEvent = () => {
    const start = addHours(startOfHour(new Date()), 1);
    const base = view === "day" ? anchor : new Date();
    start.setFullYear(base.getFullYear(), base.getMonth(), base.getDate());
    setDialog({
      mode: "create",
      draft: { start, end: addHours(start, 1), allDay: false },
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        dialog ||
        params.has("todo") ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        isTyping(e.target)
      )
        return;
      const key = e.key.toLowerCase();
      if (VIEW_KEYS[key]) go({ view: VIEW_KEYS[key] });
      else if (key === "t") go({ date: new Date() });
      else if (key === "arrowleft" || key === "j")
        go({ date: shiftAnchor(view, anchor, -1) });
      else if (key === "arrowright" || key === "k")
        go({ date: shiftAnchor(view, anchor, 1) });
      else if (key === "c") newEvent();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const openDay = (day: Date) => go({ view: "day", date: day });

  return (
    <PageShell
      title="Calendar"
      icon={<CalendarDays size={20} />}
      fill
      actions={
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => go({ date: new Date() })}
            title="Today (T)"
            className="h-7 px-2.5 rounded-md text-sm text-muted hover:text-fg hover:bg-tint/5 cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Previous"
              title="Previous (←)"
              onClick={() => go({ date: shiftAnchor(view, anchor, -1) })}
              className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              title="Next (→)"
              onClick={() => go({ date: shiftAnchor(view, anchor, 1) })}
              className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
          <div className="flex items-center p-0.5 rounded-lg bg-tab-track">
            {CALENDAR_VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => go({ view: v })}
                title={`${v[0].toUpperCase()}${v.slice(1)} (${v[0].toUpperCase()})`}
                className={cn(
                  "h-6 px-2 sm:px-2.5 rounded-md text-xs capitalize cursor-pointer",
                  v === view
                    ? "bg-tab-active text-tab-active-fg font-medium shadow-sm"
                    : "text-muted hover:text-fg",
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={newEvent}
            title="New event (C)"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-sm bg-accent text-white hover:bg-accent/90 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Event</span>
          </button>
        </div>
      }
    >
      {view === "month" ? (
        <MonthView
          anchor={anchor}
          days={days}
          items={items}
          actions={actions}
          onDayClick={openDay}
        />
      ) : (
        <TimeGridView
          days={days}
          items={items}
          actions={actions}
          onDayClick={view === "week" ? openDay : undefined}
        />
      )}

      <EventDialog
        target={dialog}
        onClose={() => setDialog(null)}
        onOpenTodo={openTodo}
      />
    </PageShell>
  );
}
