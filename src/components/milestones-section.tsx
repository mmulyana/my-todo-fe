import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "./circular-progress";
import { TodoCheckbox } from "./todo-metadata";
import {
  useCreateMilestone,
  useDeleteMilestone,
  useMilestones,
  useUpdateMilestone,
} from "../hooks/useMilestones";
import { useCreateTodo, useTodos, useUpdateTodo } from "../hooks/useTodos";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import { formatDue, fromISODate, isOverdue, toISODate } from "../lib/dates";
import type { Milestone, Todo } from "../types";
import { cn } from "@/lib/utils";

type MilestonesSectionProps = {
  projectId: string;
};

export function MilestonesSection({ projectId }: MilestonesSectionProps) {
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: todos = [] } = useTodos({ projectId });
  const createMilestone = useCreateMilestone();
  const [nameDraft, setNameDraft] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    createMilestone.mutate({ name: trimmed, projectId });
    setNameDraft("");
  };

  const unassignedTodos = todos.filter((t) => !t.milestoneId);

  return (
    <div className="flex flex-col gap-2">
      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          projectId={projectId}
          milestone={milestone}
          todos={todos.filter((t) => t.milestoneId === milestone.id)}
          unassignedTodos={unassignedTodos}
        />
      ))}

      {milestones.length === 0 && (
        <p className="text-[13px] text-muted py-1">No milestones yet.</p>
      )}

      <form
        onSubmit={submit}
        className="flex items-center gap-2 py-1 text-muted"
      >
        <div className="shrink-0 w-5.5 flex justify-center">
          <Plus size={16} />
        </div>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="New milestone"
          aria-label="New milestone name"
          className="flex-1 min-w-0 bg-transparent border-none text-sm text-fg outline-none placeholder:text-muted"
        />
      </form>
    </div>
  );
}

function MilestoneDescriptionEditor({ milestone }: { milestone: Milestone }) {
  const updateMilestone = useUpdateMilestone();
  const loadedRef = useRef<string | null>(null);

  const [saveDescription] = useDebouncedCallback(
    (html: string, signal: AbortSignal) =>
      updateMilestone.mutate({ id: milestone.id, description: html, signal }),
    1000,
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Add description..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[28px] outline-none text-sm text-fg",
      },
    },
    onUpdate: ({ editor }) => saveDescription(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    if (loadedRef.current === milestone.id) return;
    loadedRef.current = milestone.id;
    editor.commands.setContent(milestone.description ?? "", {
      emitUpdate: false,
    });
  }, [editor, milestone]);

  return (
    <div className="pb-2">
      <EditorContent editor={editor} />
    </div>
  );
}

type MilestoneCardProps = {
  projectId: string;
  milestone: Milestone;
  todos: Todo[];
  unassignedTodos: Todo[];
};

function MilestoneCard({
  projectId,
  milestone,
  todos,
  unassignedTodos,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [nameDraft, setNameDraft] = useState(milestone.name);
  const [addingTitle, setAddingTitle] = useState("");

  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const updateTodo = useUpdateTodo();
  const createTodo = useCreateTodo();

  useEffect(() => {
    setNameDraft(milestone.name);
  }, [milestone.name]);

  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const overdue = Boolean(
    milestone.dueDate && isOverdue(milestone.dueDate) && completed < total,
  );

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(milestone.name);
      return;
    }
    if (trimmed === milestone.name) return;
    updateMilestone.mutate({ id: milestone.id, name: trimmed });
  };

  const addTodo = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = addingTitle.trim();
    if (!trimmed) return;
    createTodo.mutate({
      title: trimmed,
      projectId,
      milestoneId: milestone.id,
    });
    setAddingTitle("");
  };

  return (
    <div className="rounded-xl border border-line bg-raised/60">
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 p-0.5 text-muted hover:text-fg transition-colors cursor-pointer"
          aria-label={expanded ? "Collapse milestone" : "Expand milestone"}
          aria-expanded={expanded}
        >
          <ChevronRight
            className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")}
          />
        </button>

        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitName();
              e.currentTarget.blur();
            }
          }}
          aria-label="Milestone name"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm font-medium text-fg"
        />

        <span
          className="flex items-center gap-1 shrink-0"
          title={`${completed} of ${total} todos completed`}
        >
          <CircularProgress value={completed} total={total} size={16} />
          <span className="text-[11px] text-muted">
            {completed}/{total}
          </span>
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                overdue
                  ? "bg-danger/15 text-danger"
                  : milestone.dueDate
                    ? "bg-tint/5 text-fg/70 hover:bg-tint/10"
                    : "text-muted hover:text-fg hover:bg-tint/5",
              )}
              title="Due date"
            >
              <CalendarIcon className="w-3 h-3" />
              {milestone.dueDate ? formatDue(milestone.dueDate) : "Date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarPicker
              mode="single"
              selected={
                milestone.dueDate ? fromISODate(milestone.dueDate) : undefined
              }
              onSelect={(date) =>
                updateMilestone.mutate({
                  id: milestone.id,
                  dueDate: date ? toISODate(date) : null,
                })
              }
              autoFocus
            />
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={() => deleteMilestone.mutate(milestone.id)}
          className="shrink-0 p-1 rounded-md text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
          aria-label="Delete milestone"
          title="Delete milestone"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-0.5 px-2.5 pb-2.5 pl-9">
          <MilestoneDescriptionEditor milestone={milestone} />

          {todos.map((todo) => (
            <div key={todo.id} className="group/mt flex items-center gap-2">
              <TodoCheckbox
                completed={todo.completed}
                onToggle={() =>
                  updateTodo.mutate({
                    id: todo.id,
                    patch: { completed: !todo.completed },
                  })
                }
              />
              <span
                className={cn(
                  "flex-1 min-w-0 truncate text-sm py-1",
                  todo.completed && "text-muted line-through",
                )}
              >
                {todo.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateTodo.mutate({
                    id: todo.id,
                    patch: { milestoneId: null },
                  })
                }
                className="opacity-0 group-hover/mt:opacity-100 p-1 rounded text-muted hover:text-danger transition-opacity cursor-pointer"
                aria-label="Remove from milestone"
                title="Remove from milestone"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {todos.length === 0 && (
            <p className="text-[12px] text-muted py-1">No todos yet.</p>
          )}

          <form onSubmit={addTodo} className="flex items-center gap-2 pt-1">
            <Plus className="w-3.5 h-3.5 shrink-0 text-muted" />
            <input
              value={addingTitle}
              onChange={(e) => setAddingTitle(e.target.value)}
              placeholder="Add todo"
              aria-label="Add todo to milestone"
              className="flex-1 min-w-0 bg-transparent border-none text-sm outline-none placeholder:text-muted"
            />
          </form>

          {unassignedTodos.length > 0 && (
            <Select
              key={unassignedTodos.length}
              onValueChange={(id) =>
                updateTodo.mutate({ id, patch: { milestoneId: milestone.id } })
              }
            >
              <SelectTrigger className="h-7 mt-1 w-full text-[12px]">
                <SelectValue placeholder="Assign existing todo..." />
              </SelectTrigger>
              <SelectContent>
                {unassignedTodos.map((todo) => (
                  <SelectItem key={todo.id} value={todo.id}>
                    {todo.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
