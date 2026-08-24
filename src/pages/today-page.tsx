import { useSearchParams } from "react-router-dom";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { AddTodoBar } from "../components/add-todo-bar";
import { useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import type { View } from "../types";

const view: View = { kind: "smart", id: "today" };

export default function TodayPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { view: "TODAY" },
  );
  const { data: lists = [] } = useLists();

  const visible = query ? todos : todos.filter((t) => t.myDay);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <PageShell
      title={query ? `Searching "${query}"` : "Today"}
      subtitle={query ? null : todayLabel}
      footer={query ? null : <AddTodoBar view={view} lists={lists} />}
    >
      {visible.map((todo) => (
        <TodoRow key={todo.id} todo={todo} showProject />
      ))}
    </PageShell>
  );
}
