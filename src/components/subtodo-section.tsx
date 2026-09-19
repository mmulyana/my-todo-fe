import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Plus } from "lucide-react";
import { CircularProgress } from "./circular-progress";
import {
  useCreateSubtodo,
  useDeleteSubtodo,
  useUpdateSubtodo,
} from "../hooks/useTodos";
import { useDebouncedField } from "../hooks/useDebouncedField";
import type { Subtodo, Todo } from "../types";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "flex-1 min-w-0 border-none bg-transparent outline-none text-[13px] text-fg/70 placeholder:text-muted";

type SubtodoSectionProps = {
  todo: Todo;
  onOpenTodo: (todoId: string) => void;
};

export function SubtodoSection({ todo, onOpenTodo }: SubtodoSectionProps) {
  const [draft, setDraft] = useState("");
  const stepInputRefs = useRef(new Map<string, HTMLInputElement>());
  const addInputRef = useRef<HTMLInputElement>(null);
  const pendingFocusRef = useRef<string | "add-subtask" | null>(null);

  const createSubtodo = useCreateSubtodo();
  const updateSubtodo = useUpdateSubtodo();
  const deleteSubtodo = useDeleteSubtodo();

  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target) return;

    const input =
      target === "add-subtask"
        ? addInputRef.current
        : stepInputRefs.current.get(target);
    if (!input) return;

    requestAnimationFrame(() => input.focus());
    pendingFocusRef.current = null;
  }, [todo.subtodos]);

  const focusStep = (index: number) => {
    const step = todo.subtodos[index];
    const input = step && stepInputRefs.current.get(step.id);
    input?.focus();
    return Boolean(input);
  };

  const focusAdd = () => {
    addInputRef.current?.focus();
    return Boolean(addInputRef.current);
  };

  const addSubtask = () => {
    const title = draft.trim();
    if (!title) return;
    createSubtodo.mutate({ todoId: todo.id, title });
    setDraft("");
  };

  const deleteSubtask = (subtodoId: string) => {
    const index = todo.subtodos.findIndex((step) => step.id === subtodoId);
    if (index === -1) return;

    pendingFocusRef.current =
      index === 0
        ? (todo.subtodos[1]?.id ?? "add-subtask")
        : todo.subtodos[index - 1]?.id;

    deleteSubtodo.mutate({ todoId: todo.id, subtodoId });
  };

  return (
    <div className="px-4 pt-3">
      <div className="flex flex-col gap-2">
        {todo.subtodos.map((step, index) => (
          <SubtodoRow
            key={step.id}
            step={step}
            onOpen={() => onOpenTodo(step.id)}
            onToggle={() =>
              updateSubtodo.mutate({
                todoId: todo.id,
                subtodoId: step.id,
                patch: { completed: !step.completed },
                skipInvalidate: true,
              })
            }
            onTitleChange={(title, signal) =>
              updateSubtodo.mutate({
                todoId: todo.id,
                subtodoId: step.id,
                patch: { title },
                signal,
              })
            }
            onDelete={() => deleteSubtask(step.id)}
            inputRef={(element) => {
              if (element) stepInputRefs.current.set(step.id, element);
              else stepInputRefs.current.delete(step.id);
            }}
            onMoveFocus={(direction) =>
              focusStep(index + direction) || (direction === 1 && focusAdd())
            }
            onFocusNextOrAdd={() => focusStep(index + 1) || focusAdd()}
          />
        ))}

        <form
          className="flex items-center gap-2 py-0.5 text-muted"
          onSubmit={(e) => {
            e.preventDefault();
            addSubtask();
          }}
        >
          <div className="shrink-0 w-5.5 flex justify-center">
            <Plus className="shrink-0" size={16} />
          </div>
          <input
            ref={addInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" && focusStep(todo.subtodos.length - 1))
                event.preventDefault();
            }}
            placeholder="Add Sub task"
            className={INPUT_CLASS}
          />
        </form>
      </div>
    </div>
  );
}

type SubtodoRowProps = {
  step: Subtodo;
  onOpen: () => void;
  onToggle: () => void;
  onTitleChange: (title: string, signal: AbortSignal) => void;
  onDelete: () => void;
  inputRef: (element: HTMLInputElement | null) => void;
  onMoveFocus: (direction: -1 | 1) => boolean;
  onFocusNextOrAdd: () => void;
};

function SubtodoRow({
  step,
  onOpen,
  onToggle,
  onTitleChange,
  onDelete,
  inputRef,
  onMoveFocus,
  onFocusNextOrAdd,
}: SubtodoRowProps) {
  const [titleDraft, onChange] = useDebouncedField(step.title, onTitleChange);

  return (
    <div className="relative group/sub flex items-center gap-2 rounded-lg transition-colors group py-0.5">
      <button
        className={cn(
          "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] transition-colors cursor-pointer",
          step.completed
            ? "bg-accent border-accent text-white"
            : "border-line hover:border-muted bg-raised",
        )}
        onClick={onToggle}
      >
        {step.completed && <Check strokeWidth={3} size={12} />}
      </button>

      <input
        ref={inputRef}
        className={cn(INPUT_CLASS, step.completed && "text-muted line-through")}
        value={titleDraft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Backspace" && titleDraft === "") {
            event.preventDefault();
            onDelete();
            return;
          }

          if (event.key === "Enter") {
            event.preventDefault();
            onFocusNextOrAdd();
            return;
          }

          const moved =
            (event.key === "ArrowUp" && onMoveFocus(-1)) ||
            (event.key === "ArrowDown" && onMoveFocus(1));
          if (moved) {
            event.preventDefault();
          }
        }}
        placeholder="Sub-task title..."
      />

      <div className="h-6 flex gap-1.5">
        {step.subtodoCount > 0 && (
          <div
            className="flex gap-1 items-center hover:bg-tint/5 rounded-full p-0.5"
            title={`${step.completedTodos} of ${step.subtodoCount} sub tasks completed`}
          >
            <CircularProgress
              value={step.completedTodos}
              total={step.subtodoCount}
            />
            <p className="text-sm text-fg font-medium mr-1.5">
              <span>{step.completedTodos}</span>/<span className="opacity-40">{step.subtodoCount}</span>
            </p>
          </div>
        )}

        <button
          type="button"
          className="w-6 h-6 flex items-center justify-center shadow-sm rounded-full text-muted hover:text-fg transition-opacity cursor-pointer bg-tint/5"
          onClick={onOpen}
          title="Open sub-task"
          aria-label="Open sub-task"
        >
          <ChevronRight size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
