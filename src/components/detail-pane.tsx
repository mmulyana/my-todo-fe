import { useState } from "react";
import { Icon } from "./icons";
import { AttachmentSection } from "./attachment-section";
import {
  formatDue,
  fromISODate,
  isOverdue,
  nextWeekISO,
  todayISO,
  toISODate,
  tomorrowISO,
} from "../lib/dates";
import {
  useCreateSubtodo,
  useDeleteSubtodo,
  useDeleteTodo,
  useTodo,
  useUpdateSubtodo,
  useUpdateTodo,
} from "../hooks/useTodos";
import { useProjects } from "../hooks/useProjects";
import { useDebouncedField } from "../hooks/useDebouncedField";
import type { Subtodo, Todo } from "../types";
import {
  X,
  Plus,
  Trash2,
  Sun,
  Check,
  Star,
  Box,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectCombobox } from "@/components/project-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import type { ReactNode } from "react";

type DetailPaneProps = {
  todoId: string;
  onClose: () => void;
};

export function DetailPane({ todoId, onClose }: DetailPaneProps) {
  return (
    <aside className="detail relative hidden lg:flex flex-col gap-4 min-h-0 overflow-y-auto bg-surface border border-line rounded-2xl w-[440px] shrink-0 shadow-sm">
      <DetailPaneContent todoId={todoId} onClose={onClose} />
    </aside>
  );
}

export function DetailPaneContent({ todoId, onClose }: DetailPaneProps) {
  const [stepDraft, setStepDraft] = useState("");

  const { data: todo } = useTodo(todoId);
  const { data: projects = [] } = useProjects();

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const createSubtodo = useCreateSubtodo();
  const updateSubtodo = useUpdateSubtodo();
  const deleteSubtodo = useDeleteSubtodo();

  const update = (patch: Partial<Todo>, signal?: AbortSignal) =>
    updateTodo.mutate({ id: todo!.id, patch, signal });

  const [titleDraft, onTitleChange] = useDebouncedField(
    todo?.title ?? "",
    (title, signal) => update({ title }, signal),
  );
  const [noteDraft, onNoteChange] = useDebouncedField(
    todo?.note ?? "",
    (note, signal) => update({ note }, signal),
  );

  if (!todo) return null;

  const addSubtask = () => {
    const title = stepDraft.trim();
    if (!title) return;
    createSubtodo.mutate({ todoId: todo.id, title });
    setStepDraft("");
  };

  return (
    <>
      <div className="shrink-0 h-12 px-4 py-3.5 border-b border-line flex items-center justify-end w-full">
        <button
          onClick={onClose}
          className="flex items-center gap-0.5 text-muted hover:text-fg rounded-full p-1.5 hover:bg-tint/5 transition-colors cursor-pointer"
          title="Close details"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="px-4 flex items-center gap-3">
        <button
          className={cn(
            "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] transition-colors cursor-pointer",
            todo.completed
              ? "bg-accent border-accent text-white"
              : "border-line hover:border-muted bg-raised",
          )}
          onClick={() =>
            updateTodo.mutate({
              id: todo.id,
              patch: { completed: !todo.completed },
              skipInvalidate: true,
            })
          }
          aria-label={
            todo.completed ? "Mark as incomplete" : "Mark as completed"
          }
        >
          {todo.completed && <Icon name="check" />}
        </button>
        <input
          className={cn(
            "flex-1 min-w-0 border-none bg-transparent text-lg font-semibold outline-none",
            todo.completed && "text-muted line-through",
          )}
          value={titleDraft}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Task title..."
          aria-label="Todo title"
        />
      </div>

      <div className="px-4 flex flex-col gap-0.5">
        <MetaRow icon={<Box className="w-4 h-4" />} label="Project">
          <ProjectCombobox
            projects={projects}
            value={todo.projectId ?? ""}
            onChange={(val) => update({ projectId: val || null })}
            placeholder="No Project"
            className="h-fit py-1 px-2 w-fit rounded-lg bg-transparent border-none hover:bg-tint/5 text-sm"
          />
        </MetaRow>

        <MetaRow icon={<Star className="w-4 h-4" />} label="Important">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs cursor-pointer transition-colors",
              todo.important
                ? "bg-warn/15 text-warn font-medium"
                : "bg-tint/5 text-muted hover:text-fg hover:bg-tint/10",
            )}
            onClick={() => update({ important: !todo.important })}
            aria-pressed={todo.important}
          >
            <Star
              className={cn("w-3.5 h-3.5", todo.important && "fill-warn")}
            />
            {todo.important ? "Important" : "Not important"}
          </button>
        </MetaRow>

        <MetaRow icon={<Sun className="w-4 h-4" />} label="Today">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs cursor-pointer transition-colors",
              todo.myDay
                ? "bg-accent/15 text-accent font-medium"
                : "bg-tint/5 text-muted hover:text-fg hover:bg-tint/10",
            )}
            onClick={() => update({ myDay: !todo.myDay })}
            aria-pressed={todo.myDay}
          >
            <Sun className="w-3.5 h-3.5" />
            {todo.myDay ? "My Day" : "Add to My Day"}
          </button>
        </MetaRow>

        <MetaRow icon={<Calendar className="w-4 h-4" />} label="Due Date">
          <div className="flex flex-wrap items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="grid place-items-center p-1.5 rounded-lg text-muted hover:text-fg hover:bg-tint/10 bg-tint/5 cursor-pointer"
                  aria-label="Pick a date"
                  title="Pick a date"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={
                    todo.dueDate ? fromISODate(todo.dueDate) : undefined
                  }
                  onSelect={(date) =>
                    update({ dueDate: date ? toISODate(date) : null })
                  }
                  autoFocus
                />
              </PopoverContent>
            </Popover>
            {todo.dueDate ? (
              <>
                <span
                  className={cn(
                    "text-sm",
                    isOverdue(todo.dueDate) && !todo.completed
                      ? "text-danger font-medium"
                      : "text-fg",
                  )}
                >
                  {formatDue(todo.dueDate)}
                </span>
                <button
                  className="text-xs text-muted hover:text-fg cursor-pointer"
                  onClick={() => update({ dueDate: null })}
                >
                  Clear
                </button>
              </>
            ) : (
              <>
                <button
                  className="py-1 px-2.5 rounded-lg text-xs text-muted hover:text-fg hover:bg-tint/10 bg-tint/5 cursor-pointer"
                  onClick={() => update({ dueDate: todayISO() })}
                >
                  Today
                </button>
                <button
                  className="py-1 px-2.5 rounded-lg text-xs text-muted hover:text-fg hover:bg-tint/10 bg-tint/5 cursor-pointer"
                  onClick={() => update({ dueDate: tomorrowISO() })}
                >
                  Tomorrow
                </button>
                <button
                  className="py-1 px-2.5 rounded-lg text-xs text-muted hover:text-fg hover:bg-tint/10 bg-tint/5 cursor-pointer"
                  onClick={() => update({ dueDate: nextWeekISO() })}
                >
                  Next Week
                </button>
              </>
            )}
          </div>
        </MetaRow>
      </div>

      <div className="px-4">
        <div>
          <div className="flex flex-col gap-2">
            {!!todo.subtodos.length && (
              <p className="text-sm text-fg/50">Sub task</p>
            )}
            {todo.subtodos.map((step) => (
              <SubtodoRow
                key={step.id}
                step={step}
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
                onDelete={() =>
                  deleteSubtodo.mutate({
                    todoId: todo.id,
                    subtodoId: step.id,
                  })
                }
              />
            ))}

            <form
              className="flex items-center gap-2 text-muted"
              onSubmit={(e) => {
                e.preventDefault();
                addSubtask();
              }}
            >
              <div className="shrink-0 w-5.5 flex justify-center">
                <Plus className="shrink-0" size={16} />
              </div>
              <input
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                placeholder="Add Sub task"
                className="flex-1 min-w-0 border-none bg-transparent text-sm text-fg outline-none placeholder:text-muted"
              />
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-4">
          <span className="text-sm">Note</span>
          <textarea
            className="w-full p-2 rounded-lg border border-line bg-raised  text-xs outline-none focus:border-accent resize-y"
            value={noteDraft}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Add note..."
            rows={3}
          />
        </div>

        <div className="mt-4">
          <AttachmentSection todoId={todo.id} attachments={todo.attachments} />
        </div>
      </div>
      <div className="pb-4 mt-auto px-4 flex items-center justify-between text-xs text-muted">
        <button
          onClick={() => {
            deleteTodo.mutate(todo.id);
            onClose();
          }}
          className="w-full justify-center rounded-lg flex items-center gap-1.5 px-2 py-2 text-danger hover:bg-danger/5 transition-colors cursor-pointer font-medium"
        >
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}

type MetaRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

function MetaRow({ icon, label, children }: MetaRowProps) {
  return (
    <div className="flex items-center gap-3 min-h-9">
      <div className="flex items-center gap-2 w-28 shrink-0 text-sm text-muted">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

type SubtodoRowProps = {
  step: Subtodo;
  onToggle: () => void;
  onTitleChange: (title: string, signal: AbortSignal) => void;
  onDelete: () => void;
};

function SubtodoRow({ step, onToggle, onTitleChange, onDelete }: SubtodoRowProps) {
  const [titleDraft, onChange] = useDebouncedField(step.title, onTitleChange);

  return (
    <div className="group/sub flex items-center gap-2.5 rounded-lg transition-colors">
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
        className={cn(
          "flex-1 border-none bg-transparent text-sm outline-none",
          step.completed && "text-muted line-through",
        )}
        value={titleDraft}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sub-task title..."
      />

      <button
        className="opacity-0 group-hover/sub:opacity-100 p-1 rounded hover:bg-tint/10 text-muted hover:text-danger transition-opacity cursor-pointer"
        onClick={onDelete}
        title="Delete sub-task"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
