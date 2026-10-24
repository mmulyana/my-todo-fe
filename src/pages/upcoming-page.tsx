import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { CollapsibleSection } from "../components/collapsible-section";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { useOverdueTodos, useUpcomingTodos } from "../hooks/useTodos";
import { formatDue, todayISO } from "../lib/dates";
import type { Todo } from "../types";

const DAYS = 14;

export default function UpcomingPage() {
  const { data: overdue = [] } = useOverdueTodos();
  const { data: upcoming = [], isLoading } = useUpcomingTodos(DAYS);

  const days = useMemo(() => {
    const byDay = new Map<string, Todo[]>();
    for (const todo of upcoming) {
      if (!todo.dueDate) continue;
      byDay.set(todo.dueDate, [...(byDay.get(todo.dueDate) ?? []), todo]);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [upcoming]);

  const empty = !isLoading && overdue.length === 0 && days.length === 0;

  return (
    <PageShell
      selectable
      title="Upcoming"
      icon={<CalendarClock size={20} className="text-accent" />}
      subtitle={`Overdue and the next ${DAYS} days`}
      footer={null}
    >
      <div className="space-y-3">
        <CollapsibleSection label="Overdue" count={overdue.length} defaultOpen>
          {overdue.map((todo) => (
            <TodoRow key={todo.id} todo={todo} showProject />
          ))}
        </CollapsibleSection>
        {days.map(([iso, todos]) => (
          <CollapsibleSection
            key={iso}
            label={iso === todayISO() ? "Today" : formatDue(iso)}
            count={todos.length}
            defaultOpen
          >
            {todos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} showProject hideDueDate />
            ))}
          </CollapsibleSection>
        ))}
        {empty && (
          <p className="px-1 pt-6 text-sm text-muted">
            Nothing due in the next {DAYS} days.
          </p>
        )}
      </div>
    </PageShell>
  );
}
