import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lightbulb, Sun } from "lucide-react";
import { TodaySuggestionsSheet } from "../components/today-suggestions-sheet";
import { AddTodoBar } from "../components/add-todo-bar";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import {
  useCarriedOverTodos,
  useMyDayTodos,
  useTodos,
} from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import type { View } from "../types";

const view: View = { kind: "smart", id: "today" };

export default function TodayPage() {
  const [params] = useSearchParams();
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
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
      footer={null}
      actions={
        !query && leftOvers.length > 0 ? (
          <button
            type="button"
            onClick={() => setSuggestionsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg"
          >
            <Lightbulb className="h-4 w-4 text-warn" />
            Suggestions
          </button>
        ) : null
      }
    >
      <div className="space-y-1.5">
        <div className="space-y-1">
          {visible?.map((todo) => (
            <TodoRow key={todo.id} todo={todo} showProject />
          ))}
        </div>
        {!query && (
          <AddTodoBar view={view} lists={lists} showMobileFab={false} inline />
        )}
      </div>
      <TodaySuggestionsSheet
        todos={leftOvers}
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
      />
    </PageShell>
  );
}
