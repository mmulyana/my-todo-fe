import { useMemo, useState } from "react";
import {
  addWeeks,
  endOfWeek,
  format,
  isSameWeek,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { TimeEntryRow, TimerBar } from "../components/time-tracker";
import { useRunningTimeEntry, useTimeEntries } from "../hooks/useTimeEntries";
import { toISODate } from "../lib/dates";
import { entrySeconds, formatDayLabel, formatDuration } from "../lib/time";
import type { TimeEntry } from "../types";

const weekOf = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

type DayGroup = { key: string; date: Date; entries: TimeEntry[] };

function groupByDay(entries: TimeEntry[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const entry of entries) {
    const date = new Date(entry.startedAt);
    const key = toISODate(date);
    const group = groups.get(key) ?? { key, date, entries: [] };
    group.entries.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()];
}

// note: totals only count finished entries, a running timer is added once stopped
const sumSeconds = (entries: TimeEntry[]) =>
  entries.reduce((total, e) => total + entrySeconds(e, Date.now()), 0);

export default function TimerPage() {
  const [weekStart, setWeekStart] = useState(() => weekOf(new Date()));
  const { from, to } = useMemo(
    () => ({
      from: weekStart.toISOString(),
      to: endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString(),
    }),
    [weekStart],
  );
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });
  const weekLabel = isCurrentWeek
    ? "This week"
    : `${format(weekStart, "d MMM")} – ${format(endOfWeek(weekStart, { weekStartsOn: 1 }), "d MMM")}`;

  const { data: running = null } = useRunningTimeEntry();
  const { data: entries = [], isLoading } = useTimeEntries(from, to);

  // note: the running entry is shown in the timer bar, not in the history
  const finished = useMemo(
    () => entries.filter((e) => e.endedAt && e.id !== running?.id),
    [entries, running?.id],
  );
  const groups = useMemo(() => groupByDay(finished), [finished]);

  const weekTotal = useMemo(() => sumSeconds(finished), [finished]);

  return (
    <PageShell
      title="Timer"
      icon={<Timer size={20} />}
      classNameChildren="px-3 sm:px-4"
      actions={
        <div className="flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            aria-label="Previous week"
            className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setWeekStart(weekOf(new Date()))}
            disabled={isCurrentWeek}
            title="Back to this week"
            className="px-1 text-muted enabled:hover:text-fg enabled:cursor-pointer"
          >
            {weekLabel}
          </button>
          <button
            type="button"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            disabled={isCurrentWeek}
            aria-label="Next week"
            className="p-1 rounded-md text-muted enabled:hover:text-fg enabled:hover:bg-tint/5 enabled:cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="ml-2 font-mono tabular-nums font-medium text-fg">
            {formatDuration(weekTotal)}
          </span>
        </div>
      }
      footer={
        <div className="shrink-0 border-t border-line p-3 sm:p-4">
          <TimerBar />
        </div>
      }
    >
      <div className="w-full flex flex-col gap-4">
        {isLoading ? (
          <p className="text-sm text-muted px-1">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Timer className="w-8 h-8 text-muted/50" />
            <p className="text-sm text-muted">
              No time tracked this week.
              <br />
              Pick a todo below and hit Start.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section
              key={group.key}
              className="rounded-xl border border-line overflow-hidden"
            >
              <header className="flex items-center justify-between px-4 py-2.5 bg-tint/3 border-b border-line text-sm">
                <span className="font-medium text-fg">
                  {formatDayLabel(group.date)}
                </span>
                <span className="text-muted">
                  Total{" "}
                  <span className="font-mono tabular-nums text-fg">
                    {formatDuration(sumSeconds(group.entries))}
                  </span>
                </span>
              </header>
              <div className="divide-y divide-line">
                {group.entries.map((entry) => (
                  <TimeEntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PageShell>
  );
}
