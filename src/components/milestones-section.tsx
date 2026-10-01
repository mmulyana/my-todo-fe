import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Link2,
  Plus,
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CircularProgress } from "./circular-progress";
import { TodoRow } from "./todo-row";
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
    <div className="flex flex-col rounded-xl border border-line divide-y divide-line overflow-hidden">
      {milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          projectId={projectId}
          milestone={milestone}
          todos={todos.filter((t) => t.milestoneId === milestone.id)}
          unassignedTodos={unassignedTodos}
        />
      ))}

      <form
        onSubmit={submit}
        className="flex items-center gap-2 px-2.5 h-10 text-muted"
      >
        <div className="shrink-0 w-5 flex justify-center">
          <Plus size={14} />
        </div>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder={milestones.length ? "New milestone" : "Add your first milestone"}
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
  const percent = total ? Math.round((completed / total) * 100) : 0;
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
    <div className="group/ms">
      <div className="flex items-center gap-1.5 px-2.5 h-10 hover:bg-tint/[0.03] transition-colors">
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

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "shrink-0 flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                overdue
                  ? "text-danger hover:bg-danger/15"
                  : milestone.dueDate
                    ? "text-fg/70 hover:bg-tint/5"
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

        <span
          className="flex items-center gap-0.5 shrink-0"
          title={`${completed} of ${total} todos completed`}
        >
          <CircularProgress value={completed} total={total} size={14} />
          <span className="w-7 text-right text-[12px] tabular-nums text-muted">
            {percent}%
          </span>
        </span>
      </div>

      {expanded && (
        <div className="flex flex-col gap-0.5 px-2.5 pb-2.5 pl-9 bg-tint/[0.02]">
          <MilestoneDescriptionEditor milestone={milestone} />

          <div className="flex items-center justify-between pt-2">
            <span className="text-[12px] font-medium text-muted">Todos</span>
            {unassignedTodos.length > 0 && (
              <AssignTodoButton
                todos={unassignedTodos}
                onAssign={(id) =>
                  updateTodo.mutate({
                    id,
                    patch: { milestoneId: milestone.id },
                  })
                }
              />
            )}
          </div>

          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} hideGrab hideMilestone />
          ))}

          {todos.length === 0 && (
            <p className="text-[12px] text-muted py-1">No todos yet.</p>
          )}

          <form onSubmit={addTodo} className="flex items-center gap-2 pt-1">
            <span className="grid place-items-center w-5.5 h-5.5 shrink-0">
              <Plus className="w-4 h-4 text-muted" strokeWidth={2} />
            </span>
            <input
              value={addingTitle}
              onChange={(e) => setAddingTitle(e.target.value)}
              placeholder="Add todo"
              aria-label="Add todo to milestone"
              className="flex-1 min-w-0 bg-transparent border-none text-sm outline-none placeholder:text-muted"
            />
          </form>

          <button
            type="button"
            onClick={() => deleteMilestone.mutate(milestone.id)}
            className="mt-4 self-start rounded-md px-2 py-1 -ml-2 text-[12px] text-muted hover:bg-danger/5 hover:text-danger transition-colors cursor-pointer"
          >
            Delete milestone
          </button>

        </div>
      )}
    </div>
  );
}

function AssignTodoButton({
  todos,
  onAssign,
}: {
  todos: Todo[];
  onAssign: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="-mr-2 flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-muted hover:bg-tint/5 hover:text-fg transition-colors cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5 shrink-0" />
          <span>Assign</span>
          <span className="tabular-nums text-muted/70">{todos.length}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search todos..." />
          <CommandList>
            <CommandEmpty>No todos found.</CommandEmpty>
            <CommandGroup>
              {todos.map((todo) => (
                <CommandItem
                  key={todo.id}
                  value={`${todo.title} ${todo.id}`}
                  onSelect={() => {
                    onAssign(todo.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="truncate">{todo.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
