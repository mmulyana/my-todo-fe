import { useSearchParams } from "react-router-dom";
import { Sun } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { AddTodoBar } from "../components/add-todo-bar";
import { useOverdueTodos, useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import { isOverdue } from "../lib/dates";
import type { View } from "../types";

const view: View = { kind: "smart", id: "today" };

export default function TodayPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { view: "TODAY" },
  );
  const { data: overdueData = [] } = useOverdueTodos({ view: "ALL" });
  const { data: lists = [] } = useLists();

  const visible = query
    ? todos
    : todos.filter(
        (t) => t.myDay && !(t.dueDate && isOverdue(t.dueDate)),
      );
  const overdue = query ? [] : overdueData;

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <PageShell
      title={query ? `Searching "${query}"` : "Today"}
      icon={<Sun size={20} className="text-warn" />}
      subtitle={query ? null : todayLabel}
      footer={query ? null : <AddTodoBar view={view} lists={lists} />}
    >
      {visible.map((todo) => (
        <TodoRow key={todo.id} todo={todo} showProject />
      ))}

      {overdue.length > 0 && (
        <div className="flex flex-col mt-4">
          <div className="flex items-center">
            <span className="w-5 h-5 shrink-0" />
            <h2 className="py-1.5 text-[15px] font-medium">Overdue</h2>
          </div>
          {overdue.map((todo) => (
            <TodoRow key={todo.id} todo={todo} showProject />
          ))}
        </div>
      )}
    </PageShell>
  );
}
