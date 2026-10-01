import { GripVertical, Star, Sun } from "lucide-react";
import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types";
import {
  TodoDueDate,
  TodoListBadge,
  TodoPriorityBadge,
} from "@/components/todo-metadata";

type KanbanCardProps = {
  todo: Todo;
  index: number;
  columnId: string;
  onOpen: () => void;
};

export function KanbanCard({
  todo,
  index,
  columnId,
  onOpen,
}: KanbanCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: todo.id,
    index,
    type: "item",
    accept: "item",
    group: columnId,
  });

  const hasMeta =
    !!todo.dueDate || !!todo.list?.name || todo.myDay || todo.important;

  return (
    <div
      ref={ref}
      className={cn(
        "group/card relative w-full rounded-xl border border-line bg-raised p-3",
        todo.completed && "opacity-70",
        isDragging && "opacity-30",
      )}
    >
      <button type="button" onClick={onOpen} className="w-full pr-5 text-left">
        <div className="flex items-start gap-1.5">
          {todo.priority != null && (
            <span className="mt-[3px] shrink-0">
              <TodoPriorityBadge priority={todo.priority} />
            </span>
          )}
          <p
            className={cn(
              "line-clamp-2 text-sm font-medium",
              todo.completed && "text-muted line-through",
            )}
          >
            {todo.title}
          </p>
        </div>
        {todo.note && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{todo.note}</p>
        )}
        {hasMeta && (
          <div className="mt-2 flex flex-wrap items-center gap-1 text-muted">
            {todo.dueDate && (
              <TodoDueDate dueDate={todo.dueDate} completed={todo.completed} />
            )}
            {todo.list?.name && <TodoListBadge list={todo.list} />}
            {todo.myDay && (
              <span
                className="flex items-center rounded-lg bg-accent/15 px-1.5 py-1 text-accent"
                title="In Today"
              >
                <Sun size={12} className="fill-accent" />
              </span>
            )}
            {todo.important && (
              <span
                className="flex items-center rounded-lg bg-warn/15 px-1.5 py-1 text-warn"
                title="Important"
              >
                <Star size={12} className="fill-warn" />
              </span>
            )}
          </div>
        )}
      </button>
      <button
        type="button"
        ref={handleRef}
        className="absolute right-1.5 top-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-tint/10 hover:text-fg active:cursor-grabbing group-hover/card:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        aria-label={`Reorder ${todo.title}`}
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
    </div>
  );
}
