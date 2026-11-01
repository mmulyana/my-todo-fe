import { ArrowDownUp } from "lucide-react";
import { TodoFilterMenu } from "./todo-filter-menu";
import { cn } from "@/lib/utils";
import type { TodoFilters } from "@/lib/todo-filters";
import type { List, Milestone, Todo } from "../types";

type ProjectTodoToolbarProps = {
  reordering: boolean;
  onReorderingChange: (reordering: boolean) => void;
  todos: Todo[];
  lists: List[];
  milestones: Milestone[];
  filters: TodoFilters;
  onFiltersChange: (filters: TodoFilters) => void;
};

const PILL_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors cursor-pointer";

const pillState = (active: boolean) =>
  active
    ? "border-transparent bg-tint/10 text-fg"
    : "border-line text-muted hover:bg-tint/5 hover:text-fg";

export function ProjectTodoToolbar({
  reordering,
  onReorderingChange,
  todos,
  lists,
  milestones,
  filters,
  onFiltersChange,
}: ProjectTodoToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={reordering}
        onClick={() => onReorderingChange(!reordering)}
        className={cn(PILL_CLASS, pillState(reordering))}
      >
        <ArrowDownUp className="w-3.5 h-3.5" />
        {reordering ? "Done" : "Reorder"}
      </button>

      <TodoFilterMenu
        todos={todos}
        lists={lists}
        milestones={milestones}
        filters={filters}
        onChange={onFiltersChange}
      />
    </div>
  );
}
