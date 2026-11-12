import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lightbulb, Sun } from "lucide-react";
import { TodaySuggestionsSheet } from "../components/today-suggestions-sheet";
import { TodoFilterMenu } from "../components/todo-filter-menu";
import {
  CROSS_PROJECT_CATEGORIES,
  useProjectFilterOptions,
  useTodoFilters,
} from "../hooks/useTodoFilters";
import { applyFilters } from "@/lib/todo-filters";
import { PageShell } from "../components/page-shell";
import { DesktopTodoInput } from "../components/desktop-todo-input";
import type { View } from "../types";
import { TodoRow } from "../components/todo-row";
import { TodoListSkeleton } from "../components/todo-list-skeleton";
import {
  useCarriedOverTodos,
  useMyDayTodos,
  useTodos,
} from "../hooks/useTodos";

const TODAY_VIEW: View = { kind: "smart", id: "today" };

export default function TodayPage() {
  const [params] = useSearchParams();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const query = (params.get("q") ?? "").trim();

  const { data: searchResults = [], isLoading: searching } = useTodos(
    { q: query },
    { enabled: !!query },
  );
  const { data: myDayTodos = [], isLoading: loadingMyDay } = useMyDayTodos({
    enabled: !query,
  });
  const { data: leftoverTodos = [] } = useCarriedOverTodos({
    enabled: !query,
  });
  const [filters, setFilters] = useTodoFilters("page:today");
  const projectOptions = useProjectFilterOptions();

  const all = query ? searchResults : myDayTodos;
  const visible = applyFilters(all, filters);
  const loading = query ? searching : loadingMyDay;
  const leftOvers = query ? [] : leftoverTodos;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <PageShell
      newTaskMyDay
      title={query ? `Searching "${query}"` : "Today"}
      icon={<Sun size={20} className="text-warn" />}
      subtitle={query ? null : todayLabel}
      footer={null}
      actions={
        !query ? (
          <>
            {leftOvers.length > 0 && (
              <button
                type="button"
                onClick={() => setSuggestionsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg"
              >
                <Lightbulb className="h-4 w-4 text-warn" />
                Suggestions
              </button>
            )}
            <TodoFilterMenu
              todos={all}
              categories={CROSS_PROJECT_CATEGORIES}
              projects={projectOptions}
              filters={filters}
              onChange={setFilters}
            />
          </>
        ) : null
      }
    >
      <div className="space-y-1.5">
        {!query && <DesktopTodoInput view={TODAY_VIEW} />}
        <div>
          {loading ? (
            <TodoListSkeleton />
          ) : (
            visible?.map((todo) => (
              <TodoRow key={todo.id} todo={todo} showProject />
            ))
          )}
        </div>
      </div>
      <TodaySuggestionsSheet
        todos={leftOvers}
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
      />
    </PageShell>
  );
}
