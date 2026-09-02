import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "./icons";
import { CircularProgress } from "./circular-progress";
import { formatDue, isOverdue, todayISO } from "../lib/dates";
import {
  useDeleteTodo,
  useUpdateSubtodo,
  useUpdateTodo,
} from "../hooks/useTodos";
import type { Todo } from "../types";
import { cn } from "@/lib/utils";
import {
  Box,
  Calendar,
  ChevronDown,
  ChevronRight,
  Star,
  Trash2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type TodoRowProps = {
  todo: Todo;
  showProject?: boolean;
  skipInvalidate?: boolean;
};

function duePill(todo: Todo) {
  if (!todo.completed && isOverdue(todo.dueDate!)) {
    return "bg-[#3d2321] text-[#f87171] font-semibold";
  }
  if (!todo.completed && todo.dueDate === todayISO()) {
    return "bg-accent/20 text-accent font-semibold";
  }
  return "bg-white/5 text-fg/70";
}

export function TodoRow({ todo, showProject, skipInvalidate }: TodoRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [, setParams] = useSearchParams();
  const navigate = useNavigate();

  const updateTodo = useUpdateTodo();
  const updateSubtodo = useUpdateSubtodo();
  const deleteTodo = useDeleteTodo();

  const patchTodo = (patch: Partial<Todo>) =>
    updateTodo.mutate({ id: todo.id, patch, skipInvalidate });

  const onToggleComplete = () => patchTodo({ completed: !todo.completed });

  const onToggleImportant = () => patchTodo({ important: !todo.important });

  const onToggleSubtodo = (subtodoId: string, completed: boolean) =>
    updateSubtodo.mutate({
      todoId: todo.id,
      subtodoId,
      patch: { completed },
      skipInvalidate,
    });

  const onSelect = () => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) {
      navigate(`/todo/${todo.id}`);
      return;
    }
    setParams(
      (prev) => {
        if (prev.get("todo") === todo.id) prev.delete("todo");
        else prev.set("todo", todo.id);
        return prev;
      },
      { replace: true },
    );
  };

  const onDelete = () => {
    setParams(
      (prev) => {
        if (prev.get("todo") === todo.id) prev.delete("todo");
        return prev;
      },
      { replace: true },
    );
    deleteTodo.mutate(todo.id);
  };

  const steps = todo.subtodos.length;
  const open = expanded && steps > 0;

  return (
    <div className="flex flex-col">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group/row flex items-center group">
            <span className="grid place-items-center w-5 h-5 shrink-0">
              {steps > 0 && (
                <button
                  type="button"
                  className="hidden group-hover:flex items-center w-5 h-5 text-muted hover:text-fg transition-colors"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-label={expanded ? "Hide steps" : "Show steps"}
                >
                  {expanded ? (
                    <ChevronDown size={15} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={15} strokeWidth={2} />
                  )}
                </button>
              )}
            </span>

            <div className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl">
              <button
                type="button"
                className={cn(
                  "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px]",
                  todo.completed
                    ? "bg-accent border-accent text-white"
                    : "border-line hover:border-muted bg-raised",
                )}
                onClick={onToggleComplete}
                aria-label={
                  todo.completed ? "Mark as not completed" : "Mark as completed"
                }
                aria-pressed={todo.completed}
              >
                <span
                  className={cn(
                    "w-3 h-3 [&_svg]:w-full [&_svg]:h-full [&_svg]:stroke-3",
                    todo.completed
                      ? "text-white"
                      : "text-muted opacity-0 group-hover/row:opacity-40",
                  )}
                >
                  <Icon name="check" />
                </span>
              </button>

              <button
                className="flex-1 min-w-0 flex items-center gap-1.5 py-1.5 text-left"
                onClick={onSelect}
              >
                <span
                  className={`truncate ${todo.completed ? "text-muted line-through" : ""}`}
                >
                  {todo.title}
                </span>
              </button>

              <div className="flex items-center gap-2 shrink-0 text-[12px] text-muted">
                <button
                  type="button"
                  className={cn(
                    "shrink-0 transition-opacity",
                    todo.important
                      ? "text-amber-400 opacity-100"
                      : "text-muted opacity-0 group-hover/row:opacity-100 hover:text-amber-400",
                  )}
                  onClick={onToggleImportant}
                  aria-label={
                    todo.important
                      ? "Remove from Important"
                      : "Mark as Important"
                  }
                  aria-pressed={todo.important}
                >
                  <Star
                    size={16}
                    className={todo.important ? "fill-amber-400" : ""}
                  />
                </button>
                {todo.subtodoCount > 0 && (
                  <div className="flex items-center gap-1 text-xs rounded-lg bg-white/5 text-white/50 px-2 py-1">
                    <CircularProgress
                      value={todo.completedTodos}
                      total={todo.subtodoCount}
                    />
                    <p><span className="text-white">{todo.completedTodos}</span>/{todo.subtodoCount}</p>
                  </div>
                )}
                {showProject && todo.project?.name && (
                  <span className="text-xs flex gap-1 rounded-lg bg-white/5 text-white/50 px-2 py-1">
                    <Box size={15} />
                    {todo.project?.name}
                  </span>
                )}
                {todo.dueDate && (
                  <span
                    className={`flex gap-1 text-xs rounded-lg bg-white/5 text-white/50 px-2 py-1 ${duePill(todo)}`}
                  >
                    <Calendar size={15} />
                    {formatDue(todo.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-40">
          <ContextMenuItem
            onSelect={onDelete}
            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete To-Do</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {open && (
        <div className="flex flex-col pb-1 pl-10">
          {todo.subtodos.map((step) => (
            <div key={step.id} className="group/step flex items-center gap-3">
              <button
                type="button"
                className={cn(
                  "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px]",
                  step.completed
                    ? "bg-accent border-accent text-white"
                    : "border-line hover:border-muted bg-raised",
                )}
                onClick={() => onToggleSubtodo(step.id, !step.completed)}
                aria-label={step.completed ? "Undo step" : "Complete step"}
                aria-pressed={step.completed}
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 [&_svg]:w-full [&_svg]:h-full [&_svg]:stroke-3",
                    step.completed
                      ? "text-white"
                      : "text-muted opacity-0 group-hover/step:opacity-40",
                  )}
                >
                  <Icon name="check" />
                </span>
              </button>
              <span
                className={cn(
                  "flex-1 min-w-0 truncate py-1.5 text-[14px]",
                  step.completed ? "text-muted line-through" : "text-fg/80",
                )}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
