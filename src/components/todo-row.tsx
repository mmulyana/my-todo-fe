import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSetAtom } from "jotai";
import { projectDetailsAtom } from "../atoms/panes";
import {
  TodoCheckbox,
  TodoDragHandle,
  TodoDueDate,
  TodoImportantButton,
  TodoListBadge,
  TodoPriorityBadge,
  TodoProjectBadge,
  TodoSubtodoProgress,
} from "./todo-metadata";
import { useDeleteTodo, useTodo, useUpdateTodo } from "../hooks/useTodos";
import type { Subtodo, Todo } from "../types";
import { cn } from "@/lib/utils";
import { Star, Sun, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type TodoRowProps = {
  todo: Todo;
  showProject?: boolean;
  showList?: boolean;
  hideDueDate?: boolean;
  skipInvalidate?: boolean;
  dragHandleRef?: (element: Element | null) => void;
  dragging?: boolean;
  nested?: boolean;
  hideGrab?: boolean;
};

export function TodoRow({
  todo,
  showProject,
  showList = true,
  hideDueDate = false,
  skipInvalidate,
  dragHandleRef,
  dragging,
  nested = false,
  hideGrab = false,
}: TodoRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [, setParams] = useSearchParams();
  const navigate = useNavigate();
  const closeProjectDetails = useSetAtom(projectDetailsAtom);

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const patchTodo = (patch: Partial<Todo>) =>
    updateTodo.mutate({ id: todo.id, patch, skipInvalidate });

  const onToggleComplete = () => patchTodo({ completed: !todo.completed });

  const onToggleImportant = () => patchTodo({ important: !todo.important });

  const onToggleMyDay = () => patchTodo({ myDay: !todo.myDay });

  const onSelect = () => {
    closeProjectDetails(null);
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
          <div
            className={cn(
              "group/row flex items-center group",
              dragging && "opacity-40",
            )}
          >
            {!nested && !hideGrab && (
              <TodoDragHandle
                title={todo.title}
                dragHandleRef={dragHandleRef}
              />
            )}

            <div className="flex-1 min-w-0 flex items-start sm:items-center gap-2.5 rounded-xl">
              <div className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left">
                <TodoCheckbox
                  completed={todo.completed}
                  onToggle={onToggleComplete}
                />
                {todo.priority != null && (
                  <TodoPriorityBadge priority={todo.priority} />
                )}
                <button
                  className={`truncate text-[16px] sm:text-[15px] ${todo.completed ? "text-muted line-through" : ""}`}
                  onClick={onSelect}
                >
                  {todo.title}
                </button>
                {todo.subtodoCount > 0 && (
                  <TodoSubtodoProgress
                    completed={todo.completedTodos}
                    total={todo.subtodoCount}
                    expanded={expanded}
                    onToggle={() => setExpanded((value) => !value)}
                  />
                )}
                <TodoImportantButton
                  important={todo.important}
                  onToggle={onToggleImportant}
                />
              </div>

              <div className="flex items-center flex-wrap sm:justify-end gap-1 shrink-0 text-[14px] sm:text-[12px] text-muted">
                {!hideDueDate && todo.dueDate && (
                  <TodoDueDate
                    dueDate={todo.dueDate}
                    completed={todo.completed}
                  />
                )}
                <div className="hidden sm:flex items-center gap-1">
                  {showList && todo.list?.name && (
                    <TodoListBadge list={todo.list} />
                  )}
                  {showProject && todo.project?.name && (
                    <TodoProjectBadge project={todo.project} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-44">
          <ContextMenuItem onSelect={onToggleImportant}>
            <Star
              className={cn(
                "w-3.5 h-3.5",
                todo.important && "fill-warn text-warn",
              )}
            />
            <span>
              {todo.important ? "Remove importance" : "Mark as important"}
            </span>
          </ContextMenuItem>

          <ContextMenuItem onSelect={onToggleMyDay}>
            <Sun
              className={cn(
                "w-3.5 h-3.5",
                todo.myDay && "fill-accent text-accent",
              )}
            />
            <span>{todo.myDay ? "Remove from Today" : "Add to Today"}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            onSelect={onDelete}
            className="text-danger focus:bg-danger/10 focus:text-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete To-Do</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {open && (
        // note: indent so the child checkbox lines up under this row title.
        <div className={cn("flex flex-col pb-1", nested ? "pl-8" : "pl-12")}>
          {todo.subtodos.map((step) => (
            <SubtodoItem key={step.id} step={step} hideDueDate={hideDueDate} />
          ))}
        </div>
      )}
    </div>
  );
}

type SubtodoItemProps = {
  step: Subtodo;
  hideDueDate: boolean;
};

function SubtodoItem({ step, hideDueDate }: SubtodoItemProps) {
  const { data: todo } = useTodo(step.id);

  if (todo === null) return null;

  if (!todo) {
    return (
      <div className="flex items-center gap-2.5 opacity-60">
        <span className="w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] border-line bg-raised" />
        <span className="flex-1 min-w-0 truncate py-1.5">{step.title}</span>
      </div>
    );
  }

  return (
    <TodoRow todo={todo} showList={false} hideDueDate={hideDueDate} nested />
  );
}
