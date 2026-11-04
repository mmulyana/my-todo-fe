import { useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TodoCheckbox,
  TodoDueDate,
  TodoImportantButton,
  TodoPriorityColumn,
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
import {
  useDeleteTodo,
  useMoveSubtodo,
  usePrefetchTodo,
  useTodo,
  useUpdateTodo,
} from "../hooks/useTodos";
import type { Subtodo, Todo } from "../types";
import { cn } from "@/lib/utils";
import { currentSearchParams } from "@/lib/search-params";
import { useReordering } from "@/lib/reorder";
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
  dragging?: boolean;
  nested?: boolean;
};

export function TodoRow({
  todo,
  showProject,
  hideDueDate = false,
  skipInvalidate,
  dragging,
  nested = false,
}: TodoRowProps) {
  const reordering = useReordering();
  const prefetchTodo = usePrefetchTodo();
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
          updateTodo.mutate({
            id: todo.id,
            patch: { completed: false },
            skipInvalidate,
          }),
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
      () => {
        const next = currentSearchParams();
        if (next.get("todo") === todo.id) next.delete("todo");
        else next.set("todo", todo.id);
        return next;
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
      () => {
        const next = currentSearchParams();
        if (next.get("todo") === todo.id) next.delete("todo");
        return next;
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
              "group/row flex items-center gap-2 group rounded-lg px-3 hover:bg-tint/5 transition-colors",
              reordering && "cursor-grab active:cursor-grabbing",
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
            <div
              className={cn(
                "flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5 rounded-xl",
                selecting &&
                  "-ml-2 pl-2 -mr-0.5 pr-2 rounded-lg transition-colors hover:bg-tint/[0.03]",
                selected && "bg-tint/5 hover:bg-tint/5",
              )}
            >
              <div className="flex-1 min-w-0 flex items-center gap-2 py-2.5 text-left">
                {selecting && !nested ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid place-items-center w-6 h-6 sm:w-5 sm:h-5 shrink-0 rounded-full border-[1.5px] transition-colors",
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
                <TodoPriorityColumn priority={todo.priority} />
                <button
                  className={`truncate text-[16px] sm:text-[15px] transition-colors duration-150 ${todo.completed ? "text-muted line-through" : ""}`}
                  onClick={onSelect}
                  onPointerEnter={() => prefetchTodo(todo.id)}
                >
                  {todo.title}
                </button>
                <TodoImportantButton
                  important={todo.important}
                  onToggle={onToggleImportant}
                />
              </div>

              {(todo.dueDate && !hideDueDate) ||
              (showProject && todo.project?.name) ? (
                <div className="sm:hidden flex flex-wrap items-center gap-1 pl-9 pb-1 text-muted">
                  {todo.subtodoCount > 0 && (
                    <TodoSubtodoProgress
                      completed={todo.completedTodos}
                      total={todo.subtodoCount}
                      expanded={expanded}
                      onToggle={() => setExpanded((value) => !value)}
                    />
                  )}
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

              <div className="hidden sm:flex items-center justify-end gap-1.5 shrink-0 text-muted">
                {todo.subtodoCount > 0 && (
                  <TodoSubtodoProgress
                    completed={todo.completedTodos}
                    total={todo.subtodoCount}
                    expanded={expanded}
                    onToggle={() => setExpanded((value) => !value)}
                  />
                )}
                {showProject && todo.project?.name && (
                  <TodoProjectBadge project={todo.project} pill />
                )}
                {!hideDueDate && todo.dueDate && (
                  <TodoDueDate
                    dueDate={todo.dueDate}
                    completed={todo.completed}
                    pill
                  />
                )}
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-44 px-0">
          <ContextMenuItem onSelect={onContextSelect} className="rounded-none">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{selected ? "Deselect" : "Select"}</span>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={onToggleImportant}
            className="rounded-none"
          >
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

          <ContextMenuItem onSelect={onToggleMyDay} className="rounded-none">
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
            className="text-danger focus:bg-danger/10 focus:text-danger rounded-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete To-Do</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Collapse open={open}>
        <div className="flex flex-col pb-1 pl-8 sm:pl-7">
          <SubtodoList steps={todo.subtodos} hideDueDate={hideDueDate} />
        </div>
      </Collapse>
    </div>
  );
}

type SubtodoListProps = {
  steps: Subtodo[];
  hideDueDate: boolean;
};

function SubtodoList({ steps, hideDueDate }: SubtodoListProps) {
  const moveSubtodo = useMoveSubtodo();
  const key = steps.map((step) => step.id).join(",");
  const [order, setOrder] = useState(() => steps.map((step) => step.id));
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setOrder(steps.map((step) => step.id));
  }

  const byId = new Map(steps.map((step) => [step.id, step]));
  const group = `subtodos:${steps[0]?.id ?? ""}`;

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return;
        const { source } = event.operation;
        if (!isSortable(source) || source.index === source.initialIndex) return;

        const id = String(source.id);
        setOrder((prev) => {
          const next = prev.filter((value) => value !== id);
          next.splice(source.index, 0, id);
          return next;
        });
        moveSubtodo.mutate({ id, position: source.index });
      }}
    >
      {order.map((id, index) => {
        const step = byId.get(id);
        if (!step) return null;
        return (
          <SortableSubtodo
            key={id}
            step={step}
            index={index}
            group={group}
            hideDueDate={hideDueDate}
          />
        );
      })}
    </DragDropProvider>
  );
}

type SubtodoItemProps = {
  step: Subtodo;
  index: number;
  group: string;
  hideDueDate: boolean;
};

function SortableSubtodo({
  step,
  index,
  group,
  hideDueDate,
}: SubtodoItemProps) {
  const { data: todo } = useTodo(step.id, { refetchOnMount: false });
  const reordering = useReordering();
  const { ref, isDragging } = useSortable({
    id: step.id,
    index,
    group,
    type: "subtodo",
    accept: "subtodo",
    disabled: !reordering,
  });

  if (todo === null) return null;

  if (!todo) {
    return (
      // note: ukuran harus sama dengan baris TodoRow (checkbox 24px mobile / 20px desktop, teks 16px / 15px) supaya tinggi tidak melompat saat data tiba
      <div ref={ref} className="flex items-center gap-2 py-2.5 px-3 opacity-60">
        <span className="w-6 h-6 sm:w-5 sm:h-5 shrink-0 rounded-[7px] border-[1.5px] border-line bg-raised" />
        <span className="flex-1 min-w-0 truncate text-[16px] sm:text-[15px]">
          {step.title}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex flex-col">
      <TodoRow
        todo={todo}
        showList={false}
        hideDueDate={hideDueDate}
        dragging={isDragging}
        nested
      />
    </div>
  );
}
