import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TodoCheckbox,
  TodoDragHandle,
  TodoDueDate,
  TodoImportantButton,
  TodoPriorityBadge,
  TodoProjectBadge,
  TodoSubtodoProgress,
} from "./todo-metadata";
import { toast } from "sonner";
import { useAtomValue, useSetAtom } from "jotai";
import {
  selectedTodoIdsAtom,
  selectingAtom,
  selectionModeAtom,
  toggleTodoSelectionAtom,
} from "../atoms/selection";
import { useDeleteTodo, useTodo, useUpdateTodo } from "../hooks/useTodos";
import type { Subtodo, Todo } from "../types";
import { cn } from "@/lib/utils";
import { Collapse } from "@/components/ui/collapse";
import { Check, CheckSquare, Star, Sun, Trash2 } from "lucide-react";
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
  hideMilestone?: boolean;
  skipInvalidate?: boolean;
  dragHandleRef?: (element: Element | null) => void;
  dragging?: boolean;
  nested?: boolean;
  hideGrab?: boolean;
};

export function TodoRow({
  todo,
  showProject,
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

  const selectedIds = useAtomValue(selectedTodoIdsAtom);
  const toggleSelection = useSetAtom(toggleTodoSelectionAtom);
  const setSelectionMode = useSetAtom(selectionModeAtom);
  const selected = selectedIds.includes(todo.id);
  const selecting = useAtomValue(selectingAtom);

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const patchTodo = (patch: Partial<Todo>) =>
    updateTodo.mutate({ id: todo.id, patch, skipInvalidate });

  const onToggleComplete = () => {
    const completing = !todo.completed;
    patchTodo({ completed: completing });
    if (!completing) return;
    toast("Todo completed", {
      action: {
        label: "Undo",
        onClick: () =>
          updateTodo.mutate({ id: todo.id, patch: { completed: false }, skipInvalidate }),
      },
    });
  };

  const onToggleImportant = () => patchTodo({ important: !todo.important });

  const onToggleMyDay = () => patchTodo({ myDay: !todo.myDay });

  const onSelect = (e?: React.MouseEvent) => {
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey || selecting)) {
      e.preventDefault();
      toggleSelection(todo.id);
      return;
    }
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

  const onContextSelect = () => {
    setSelectionMode(true);
    toggleSelection(todo.id);
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
              "group/row flex items-center group rounded-lg",
              dragging && "opacity-40",
              selecting && "cursor-pointer",
            )}
            aria-selected={selecting ? selected : undefined}
            onClick={(e) => {
              if (!selecting || nested) return;
              if ((e.target as HTMLElement).closest("button, a, input")) return;
              toggleSelection(todo.id);
            }}
          >
            {!nested && !hideGrab && (
              <TodoDragHandle
                title={todo.title}
                dragHandleRef={selecting ? undefined : dragHandleRef}
              />
            )}

            <div
              className={cn(
                "flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5 rounded-xl",
                // note: margin negatif melebarkan highlight ke kolom drag handle dan pr-4 container tanpa menggeser teks
                selecting && "-ml-2 pl-2 -mr-0.5 pr-2 rounded-lg transition-colors hover:bg-tint/[0.03]",
                selected && "bg-tint/5 hover:bg-tint/5",
              )}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2 py-1 text-left">
                {selecting && !nested ? (
                  // note: ukuran sama dengan TodoCheckbox (22px) supaya teks tidak bergeser saat masuk mode pilih
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-full border-[1.5px] transition-colors",
                      selected
                        ? "bg-accent border-accent text-white"
                        : "border-line group-hover/row:border-muted",
                    )}
                  >
                    {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                ) : (
                  <TodoCheckbox
                    completed={todo.completed}
                    onToggle={onToggleComplete}
                  />
                )}
                {todo.priority != null && (
                  <TodoPriorityBadge priority={todo.priority} />
                )}
                <div className="hidden sm:flex items-center gap-2 shrink-0 text-muted">
                  {showProject && todo.project?.name && (
                    <TodoProjectBadge project={todo.project} />
                  )}
                </div>
                <button
                  className={`truncate text-[16px] sm:text-[15px] transition-colors duration-150 ${todo.completed ? "text-muted line-through" : ""}`}
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

              {(todo.dueDate && !hideDueDate) ||
              (showProject && todo.project?.name) ? (
                <div className="sm:hidden flex flex-wrap items-center gap-1 pl-7.5 pb-1 text-muted">
                  {!hideDueDate && todo.dueDate && (
                    <TodoDueDate
                      dueDate={todo.dueDate}
                      completed={todo.completed}
                    />
                  )}
                  {showProject && todo.project?.name && (
                    <TodoProjectBadge project={todo.project} />
                  )}
                </div>
              ) : null}

              <div className="hidden sm:flex items-center justify-end gap-1 shrink-0 text-[12px] text-muted">
                {!hideDueDate && todo.dueDate && (
                  <TodoDueDate
                    dueDate={todo.dueDate}
                    completed={todo.completed}
                  />
                )}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-44">
          <ContextMenuItem onSelect={onContextSelect}>
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{selected ? "Deselect" : "Select"}</span>
          </ContextMenuItem>
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

      <Collapse open={open}>
        {/* note: indent so the child checkbox lines up under this row title. */}
        <div className={cn("flex flex-col pb-1", nested ? "pl-8" : "pl-12")}>
          {todo.subtodos.map((step) => (
            <SubtodoItem key={step.id} step={step} hideDueDate={hideDueDate} />
          ))}
        </div>
      </Collapse>
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
      // note: ukuran harus sama dengan baris TodoRow (py-1, checkbox 22px, teks 15px) supaya tinggi tidak melompat saat data tiba
      <div className="flex items-center gap-2 py-1 opacity-60">
        <span className="w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] border-line bg-raised" />
        <span className="flex-1 min-w-0 truncate text-[16px] sm:text-[15px]">
          {step.title}
        </span>
      </div>
    );
  }

  return (
    <TodoRow todo={todo} showList={false} hideDueDate={hideDueDate} nested />
  );
}
