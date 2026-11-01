import { ArrowDownUp } from "lucide-react";
import { TodoFilterMenu } from "./todo-filter-menu";
import { useLists } from "../hooks/useLists";
import { useTodos } from "../hooks/useTodos";
import { useProjectTodoView } from "@/lib/project-todo-view";
import { cn } from "@/lib/utils";

const PILL_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors cursor-pointer";

const pillState = (active: boolean) =>
  active
    ? "border-transparent bg-tint/10 text-fg"
    : "border-line text-muted hover:bg-tint/5 hover:text-fg";

export function ProjectTodoToolbar({ projectId }: { projectId: string }) {
  const { reordering, setReordering, filters, setFilters } =
    useProjectTodoView();
  const { data: todos = [] } = useTodos({ projectId });
  const { data: lists = [] } = useLists();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={reordering}
        onClick={() => setReordering(!reordering)}
        className={cn(PILL_CLASS, pillState(reordering))}
      >
        <ArrowDownUp className="w-3.5 h-3.5" />
        {reordering ? "Done" : "Reorder"}
      </button>

      <TodoFilterMenu
        todos={todos}
        lists={lists.filter((list) => list.projectId === projectId)}
        milestonesProjectId={projectId}
        filters={filters}
        onChange={setFilters}
      />
    </div>
  );
}
