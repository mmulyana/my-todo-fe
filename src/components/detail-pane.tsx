import { useMemo, useState } from "react";
import { AttachmentSection } from "./attachment-section";
import { SubtodoSection } from "./subtodo-section";
import { PriorityIcon } from "./priority-icon";
import { formatDue, fromISODate, isOverdue, toISODate } from "../lib/dates";
import {
  useDeleteTodo,
  useKanbanColumns,
  useMoveTodoToKanbanColumn,
  useTodo,
  useTodos,
  useUpdateTodo,
} from "../hooks/useTodos";
import { useProjects } from "../hooks/useProjects";
import { activeProjects, isArchived } from "../projects";
import { useDebouncedField } from "../hooks/useDebouncedField";
import type { Todo } from "../types";
import {
  X,
  ChevronRight,
  Sun,
  Check,
  Star,
  Box,
  Calendar,
  Columns3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProjectCombobox } from "@/components/project-combobox";
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
} from "./ui/select";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

type DetailPaneContentProps = {
  todoId: string;
  onClose: () => void;
  onOpenTodo: (todoId: string) => void;
};

type DetailPaneProps = Omit<DetailPaneContentProps, "onOpenTodo"> & {
  onOpenTodo?: (todoId: string) => void;
};

export function DetailPane({ todoId, onClose, onOpenTodo }: DetailPaneProps) {
  const [currentId, setCurrentId] = useState(todoId);
  const [syncedId, setSyncedId] = useState(todoId);
  if (todoId !== syncedId) {
    setSyncedId(todoId);
    setCurrentId(todoId);
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        hideClose
        aria-describedby={undefined}
        className="border-0 bg-transparent p-3 shadow-none sm:max-w-[440px] lg:max-w-[480px]"
      >
        <SheetTitle className="sr-only">Todo details</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface p-0 shadow-lg">
          <DetailPaneContent
            key={currentId}
            todoId={currentId}
            onClose={onClose}
            onOpenTodo={onOpenTodo ?? setCurrentId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DetailPaneContent({
  todoId,
  onClose,
  onOpenTodo,
}: DetailPaneContentProps) {
  const { data: todo } = useTodo(todoId);
  const { data: projectTodos = [] } = useTodos(
    { projectId: todo?.projectId ?? "" },
    { enabled: Boolean(todo?.projectId) },
  );
  const { data: kanbanColumns = [] } = useKanbanColumns(todo?.projectId ?? "");
  const { data: allProjects = [] } = useProjects();

  const updateTodo = useUpdateTodo();
  const moveTodoToKanbanColumn = useMoveTodoToKanbanColumn();
  const deleteTodo = useDeleteTodo();

  const projects = useMemo(() => {
    const active = activeProjects(allProjects);
    const current = allProjects.find((p) => p.id === todo?.projectId);
    return current && isArchived(current) ? [...active, current] : active;
  }, [allProjects, todo?.projectId]);

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

  const isChild = todo.ancestors.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 h-[46px] px-4 border-b border-line flex items-center justify-between gap-2 w-full">
        {todo.ancestors.length > 0 && (
          <nav
            aria-label="Parent todos"
            className="flex min-w-0 items-center gap-1 text-sm text-muted"
          >
            {todo.ancestors.map((ancestor) => (
              <span
                key={ancestor.id}
                className="flex min-w-0 shrink items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => onOpenTodo(ancestor.id)}
                  title={ancestor.title}
                  className="max-w-28 truncate rounded px-1 hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
                >
                  {ancestor.title}
                </button>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </span>
            ))}
            <span
              className="min-w-0 truncate px-1 text-fg"
              aria-current="page"
              title={todo.title}
            >
              {todo.title}
            </span>
          </nav>
        )}
        <button
          onClick={onClose}
          className="ml-auto bg-tint/5 flex items-center gap-0.5 text-muted hover:text-fg rounded-full p-1.5 hover:bg-tint/5 transition-colors cursor-pointer"
          title="Close details"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-4 pt-4 flex items-center gap-2">
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
            {todo.completed && <Check className="w-4.5 h-4.5" />}
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
        <SubtodoSection todo={todo} onOpenTodo={onOpenTodo} />

        <div className="px-4 pt-4 flex flex-col">
          <MetaRow icon={<Star className="w-4 h-4" />} label="Important">
            <button
              className={cn(
                "inline-flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-sm cursor-pointer transition-colors hover:bg-tint/5 hover:text-fg",
                todo.important ? "text-warn" : "hover:text-fg",
              )}
              onClick={() => update({ important: !todo.important })}
              aria-pressed={todo.important}
            >
              {todo.important ? "Marked as important" : "Mark as important"}
            </button>
          </MetaRow>
          <MetaRow icon={<Sun className="w-4 h-4" />} label="Today">
            <button
              className={cn(
                "inline-flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-sm cursor-pointer transition-colors hover:bg-tint/5",
                todo.myDay ? "text-accent" : "hover:text-fg",
              )}
              onClick={() => update({ myDay: !todo.myDay })}
              aria-pressed={todo.myDay}
            >
              {todo.myDay ? "Remove Today" : "Add Today"}
            </button>
          </MetaRow>
          {!isChild && (
            <MetaRow icon={<Box className="w-4 h-4" />} label="Project">
              <ProjectCombobox
                projects={projects}
                value={todo.projectId ?? ""}
                onChange={(val) => update({ projectId: val || null })}
                className="h-fit py-2 px-2.5 w-fit rounded-lg bg-transparent shadow-none border-none hover:bg-tint/5 text-sm"
                hideIcon
              />
            </MetaRow>
          )}
          {todo.projectId && (
            <MetaRow icon={<Columns3 className="w-4 h-4" />} label="Status">
              <Select
                value={todo.kanbanColumnId ?? ""}
                onValueChange={(kanbanColumnId) => {
                  if (!kanbanColumnId || kanbanColumnId === todo.kanbanColumnId)
                    return;
                  const position = projectTodos.filter(
                    (candidate) =>
                      candidate.id !== todo.id &&
                      candidate.kanbanColumnId === kanbanColumnId,
                  ).length;
                  moveTodoToKanbanColumn.mutate({
                    id: todo.id,
                    kanbanColumnId,
                    position,
                  });
                }}
                disabled={
                  !kanbanColumns.length || moveTodoToKanbanColumn.isPending
                }
              >
                <SelectTrigger
                  className="h-8 rounded-lg text-fg hover:bg-tint/5 focus:border-accent border-none text-sm"
                  aria-label="Kanban column"
                >
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {kanbanColumns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MetaRow>
          )}
          <MetaRow icon={<PriorityIcon showEmpty />} label="Priority">
            <Select
              value={todo.priority?.toString() ?? "none"}
              onValueChange={(value) =>
                update({
                  priority:
                    value === "none"
                      ? null
                      : (Number(value) as Todo["priority"]),
                })
              }
            >
              <SelectTrigger
                className="h-8 rounded-lg text-fg hover:bg-tint/5 focus:border-accent border-none text-sm"
                aria-label="Priority"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No priority</SelectItem>
                <SelectItem value="1">High</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Low</SelectItem>
              </SelectContent>
            </Select>
          </MetaRow>
          <MetaRow icon={<Calendar className="w-4 h-4" />} label="Due Date">
            <div className="flex flex-wrap items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    className="flex items-center gap-1.5 py-1 px-2.5 text-sm font-normal rounded-lg hover:text-fg hover:bg-tint/5 cursor-pointer bg-transparent shadow-none"
                    aria-label="Pick a date"
                    title="Pick a date"
                  >
                    {todo.dueDate ? (
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
                    ) : (
                      <span>Pick date</span>
                    )}
                  </Button>
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
            </div>
          </MetaRow>

          <div className="flex flex-col gap-1.5 mt-1">
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
            <AttachmentSection
              todoId={todo.id}
              attachments={todo.attachments}
              tabbed
            />
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
      </div>
    </div>
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
        <span className="shrink-0 w-5.25 h-5.25 items-center flex justify-center">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
