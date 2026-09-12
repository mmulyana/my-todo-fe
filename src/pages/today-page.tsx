import { useSearchParams } from "react-router-dom";
import { Sun } from "lucide-react";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { CollapsibleSection } from "../components/collapsible-section";
import { AddTodoBar } from "../components/add-todo-bar";
import { useCarriedOverTodos, useMyDayTodos, useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import type { View } from "../types";

const view: View = { kind: "smart", id: "today" };

export default function TodayPage() {
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  const { data: searchResults = [] } = useTodos(
    { q: query },
    { enabled: !!query },
  );
  const { data: myDayTodos = [] } = useMyDayTodos({ enabled: !query });
  const { data: leftoverTodos = [] } = useCarriedOverTodos({
    enabled: !query,
  });
  const { data: lists = [] } = useLists();

  const visible = query ? searchResults : myDayTodos;
  const leftOvers = query ? [] : leftoverTodos;

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

      {!query && (
        <CollapsibleSection label="Unfinished" count={leftOvers.length}>
          {leftOvers.map((todo) => (
            <TodoRow key={todo.id} todo={todo} showProject />
          ))}
        </CollapsibleSection>
      )}
    </PageShell>
  );
}
