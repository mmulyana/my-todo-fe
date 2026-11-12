import { useSearchParams } from "react-router-dom";
import { Star } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { DesktopTodoInput } from "../components/desktop-todo-input";
import type { View } from "../types";
import { TodoRow } from "../components/todo-row";
import { TodoListSkeleton } from "../components/todo-list-skeleton";
import { TodoFilterMenu } from "../components/todo-filter-menu";
import {
  CROSS_PROJECT_CATEGORIES,
  useProjectFilterOptions,
  useTodoFilters,
} from "../hooks/useTodoFilters";
import { applyFilters } from "@/lib/todo-filters";
import { useTodos } from "../hooks/useTodos";

const IMPORTANT_VIEW: View = { kind: "smart", id: "important" };

export default function ImportantPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  const { data: todos = [], isLoading } = useTodos(
    query ? { q: query } : { view: "IMPORTANT" },
  );
  const [filters, setFilters] = useTodoFilters("page:important");
  const projectOptions = useProjectFilterOptions();
  const visible = applyFilters(todos, filters);

  return (
    <PageShell
      newTaskImportant
      title={query ? `Searching "${query}"` : "Important"}
      icon={<Star size={20} className="text-warn fill-warn" />}
      footer={null}
      actions={
        !query ? (
          <TodoFilterMenu
            todos={todos}
            categories={CROSS_PROJECT_CATEGORIES}
            projects={projectOptions}
            filters={filters}
            onChange={setFilters}
          />
        ) : null
      }
    >
      <div className="space-y-1.5">
        {!query && <DesktopTodoInput view={IMPORTANT_VIEW} />}
        <div className="space-y-1">
          {isLoading ? (
            <TodoListSkeleton />
          ) : (
            visible.map((todo) => (
              <TodoRow key={todo.id} todo={todo} showProject />
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
