import { useMemo, useState } from "react";
import { startOfDay, startOfWeek, subDays } from "date-fns";
import { Timer } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { TimeEntryRow, TimerBar } from "../components/time-tracker";
import { useRunningTimeEntry, useTimeEntries } from "../hooks/useTimeEntries";
import { toISODate } from "../lib/dates";
import { entrySeconds, formatDayLabel, formatDuration } from "../lib/time";
import type { TimeEntry } from "../types";

const PAGE_DAYS = 14;

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
  const [days, setDays] = useState(PAGE_DAYS);
  const from = useMemo(
    () => startOfDay(subDays(new Date(), days - 1)).toISOString(),
    [days],
  );

  const { data: running = null } = useRunningTimeEntry();
  const { data: entries = [], isLoading, isFetching } = useTimeEntries(from);

  // note: the running entry is shown in the timer bar, not in the history
  const finished = useMemo(
    () => entries.filter((e) => e.endedAt && e.id !== running?.id),
    [entries, running?.id],
  );
  const groups = useMemo(() => groupByDay(finished), [finished]);

  const weekTotal = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    return sumSeconds(
      finished.filter((e) => new Date(e.startedAt).getTime() >= weekStart),
    );
  }, [finished]);

  return (
    <PageShell
      title="Timer"
      icon={<Timer size={20} />}
      classNameChildren="px-3 sm:px-4"
    >
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
        <TimerBar />

        <div className="flex items-center justify-between px-1 text-sm">
          <span className="text-muted">This week</span>
          <span className="font-mono tabular-nums font-medium text-fg">
            {formatDuration(weekTotal)}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted px-1">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Timer className="w-8 h-8 text-muted/50" />
            <p className="text-sm text-muted">
              No time tracked in the last {days} days.
              <br />
              Pick a todo above and hit Start.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <section
              key={group.key}
              className="rounded-xl border border-line overflow-hidden"
            >
              <header className="flex items-center justify-between px-3 py-2 bg-tint/3 border-b border-line text-sm">
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

        {!isLoading && (
          <button
            type="button"
            onClick={() => setDays((d) => d + PAGE_DAYS)}
            disabled={isFetching}
            className="self-center text-sm text-muted hover:text-fg px-3 py-1.5 rounded-md hover:bg-tint/5 disabled:opacity-50 cursor-pointer"
          >
            {isFetching ? "Loading…" : `Load older (${PAGE_DAYS} days)`}
          </button>
        )}
      </div>
    </PageShell>
  );
}
