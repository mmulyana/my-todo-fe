import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import { Command as CommandPrimitive } from "cmdk";
import {
  ArrowUpRight,
  Box,
  CheckCircle2,
  Circle,
  ListFilter,
  MoreHorizontal,
  Play,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as api from "@/api";
import {
  resetTimerDraftAtom,
  timerCreatingAtom,
  timerListIdAtom,
  timerPendingTodoAtom,
  timerProjectIdAtom,
  timerQueryAtom,
  type TimerTodo,
} from "@/atoms/timer";
import { TODOS_KEY, useCreateTodo } from "@/hooks/useTodos";
import { useProjects } from "@/hooks/useProjects";
import { useLists } from "@/hooks/useLists";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { activeProjects } from "@/projects";
import { ProjectCombobox } from "./project-combobox";
import { ListCombobox } from "./list-combobox";
import {
  useDeleteTimeEntry,
  useNow,
  useRunningTimeEntry,
  useStartTimer,
  useStopTimer,
  useUpdateTimeEntry,
} from "@/hooks/useTimeEntries";
import {
  entrySeconds,
  formatClock,
  formatDuration,
  withClock,
} from "@/lib/time";
import { cn } from "@/lib/utils";
import type { TimeEntry, Todo, TodoFilter, TodoProject } from "@/types";

const START_BUTTON_ID = "timer-start-button";
const MAX_SUGGESTIONS = 20;
const SEARCH_DEBOUNCE_MS = 250;

const toEntryTodo = (todo: Todo): TimerTodo => ({
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  project: todo.project,
  list: todo.list ? { id: todo.list.id, name: todo.list.name } : null,
});

function useTodoOptions(query: string) {
  const q = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const filter: TodoFilter = q
    ? { q, completed: false, limit: MAX_SUGGESTIONS }
    : { view: "ALL", completed: false, limit: MAX_SUGGESTIONS };

  return useQuery({
    queryKey: [...TODOS_KEY, filter],
    queryFn: () => api.fetchTodos(filter),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

function useCreateEntryTodo() {
  const createTodo = useCreateTodo();
  return async (
    title: string,
    target: { projectId?: string | null; listId?: string | null } = {},
  ) =>
    toEntryTodo(
      await createTodo.mutateAsync({
        title: title.trim(),
        projectId: target.projectId || null,
        listId: target.listId || null,
      }),
    );
}

export function ProjectTag({
  project,
  className,
}: {
  project: TodoProject | null | undefined;
  className?: string;
}) {
  if (!project) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 min-w-0 text-xs text-muted",
        className,
      )}
    >
      <Box
        size={12}
        className="shrink-0"
        style={{ color: project.color ?? undefined }}
      />
      <span className="truncate">{project.name}</span>
    </span>
  );
}

function TodoOptions({
  query,
  selectedId,
  onPick,
  onCreate,
}: {
  query: string;
  selectedId?: string | null;
  onPick: (todo: TimerTodo) => void;
  onCreate: (title: string) => void;
}) {
  const { data: options = [], isFetching } = useTodoOptions(query);
  const title = query.trim();

  return (
    <CommandList className="max-h-72 overflow-y-auto">
      {!title && !isFetching && (
        <CommandEmpty className="py-6 text-center text-sm text-muted">
          No todos found.
        </CommandEmpty>
      )}
      {title && (
        <CommandGroup>
          <CommandItem
            value={`create:${title}`}
            onSelect={() => onCreate(title)}
            className="flex items-center gap-2 py-2 px-3 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-accent shrink-0" />
            <span className="truncate">
              Create todo <span className="font-medium">“{title}”</span>
            </span>
          </CommandItem>
        </CommandGroup>
      )}
      {options.length > 0 && (
        <CommandGroup heading="Todos">
          {options.map((todo) => (
            <CommandItem
              key={todo.id}
              value={todo.id}
              onSelect={() => onPick(toEntryTodo(todo))}
              className={cn(
                "flex items-center gap-2 py-2 px-3 cursor-pointer",
                todo.id === selectedId && "text-accent",
              )}
            >
              <Circle className="w-3.5 h-3.5 text-muted shrink-0" />
              <span className="flex-1 truncate">{todo.title}</span>
              <ProjectTag project={todo.project} className="max-w-[40%]" />
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </CommandList>
  );
}

function useCurrentTimerTodo() {
  const { data: running = null } = useRunningTimeEntry();
  const pending = useAtomValue(timerPendingTodoAtom);
  return running ? running.todo : pending;
}

function useChooseTimerTodo() {
  const { data: running = null } = useRunningTimeEntry();
  const setPending = useSetAtom(timerPendingTodoAtom);
  const setQuery = useSetAtom(timerQueryAtom);
  const updateEntry = useUpdateTimeEntry();

  return (todo: TimerTodo | null) => {
    if (running) {
      if (!running.id.startsWith("temp-")) {
        updateEntry.mutate({ id: running.id, todo });
      }
    } else {
      setPending(todo);
    }
    setQuery("");
    // note: focus the start button so enter starts the timer right away
    requestAnimationFrame(() =>
      document.getElementById(START_BUTTON_ID)?.focus(),
    );
  };
}

function useStartFromDraft() {
  const store = useStore();
  const setCreating = useSetAtom(timerCreatingAtom);
  const resetDraft = useSetAtom(resetTimerDraftAtom);
  const createEntryTodo = useCreateEntryTodo();
  const startTimer = useStartTimer();

  return async () => {
    // note: read atoms on call so the caller does not subscribe to them
    let todo = store.get(timerPendingTodoAtom);
    const query = store.get(timerQueryAtom).trim();
    if (!todo && query) {
      setCreating(true);
      try {
        todo = await createEntryTodo(query, {
          projectId: store.get(timerProjectIdAtom),
          listId: store.get(timerListIdAtom),
        });
      } finally {
        setCreating(false);
      }
    }
    startTimer.mutate({ todo });
    resetDraft();
  };
}

function TimerTodoField() {
  const { data: running = null } = useRunningTimeEntry();
  const current = useCurrentTimerTodo();
  const [query, setQuery] = useAtom(timerQueryAtom);
  const [creating, setCreating] = useAtom(timerCreatingAtom);
  const projectId = useAtomValue(timerProjectIdAtom);
  const listId = useAtomValue(timerListIdAtom);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseTodo = useChooseTimerTodo();
  const startFromDraft = useStartFromDraft();
  const createEntryTodo = useCreateEntryTodo();

  const isRunning = Boolean(running);
  const showInput = !current || editing;
  const showCheckbox = focused || Boolean(current) || isRunning;

  const choose = (todo: TimerTodo | null) => {
    chooseTodo(todo);
    setOpen(false);
    setEditing(false);
  };

  const create = async (title: string) => {
    setCreating(true);
    try {
      choose(await createEntryTodo(title, { projectId, listId }));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 flex items-center gap-2.5 min-w-0">
      <span
        className={cn(
          "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] transition-colors",
          showCheckbox ? "border-line bg-raised" : "border-transparent",
        )}
      >
        {!showCheckbox && (
          <Plus className="w-4 h-4 text-muted" strokeWidth={2} />
        )}
      </span>

      <Command shouldFilter={false} className="flex-1 min-w-0 bg-transparent">
        <Popover open={open && showInput} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div className="flex items-center gap-2 min-w-0 h-7">
              {showInput ? (
                <CommandPrimitive.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={(v) => {
                    setQuery(v);
                    setOpen(true);
                  }}
                  onFocus={() => {
                    setFocused(true);
                    setOpen(true);
                  }}
                  onBlur={() => {
                    setFocused(false);
                    if (!query) setEditing(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOpen(false);
                      setEditing(false);
                    }
                    // note: ctrl/cmd+enter starts right away without picking from the dropdown
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      setOpen(false);
                      if (!isRunning) startFromDraft();
                    }
                  }}
                  disabled={creating}
                  placeholder={
                    isRunning ? "Pick a todo for this timer" : "New task"
                  }
                  aria-label="Todo for timer"
                  className="flex-1 min-w-0 border-none bg-transparent text-fg text-[14px] outline-none placeholder:text-muted focus:outline-none disabled:opacity-60"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setOpen(true);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left text-[14px] text-fg cursor-pointer"
                >
                  <span className="truncate">{current!.title}</span>
                </button>
              )}
            </div>
          </PopoverAnchor>
          <PopoverContent
            align="start"
            className="w-(--radix-popover-trigger-width) min-w-72 p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
            // note: keep focus off the input so it can move to the start button
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (inputRef.current?.contains(e.target as Node)) {
                e.preventDefault();
              }
            }}
          >
            <TodoOptions
              query={query}
              selectedId={current?.id}
              onPick={choose}
              onCreate={create}
            />
          </PopoverContent>
        </Popover>
      </Command>
    </div>
  );
}

function TimerTargets() {
  const current = useCurrentTimerTodo();
  const chooseTodo = useChooseTimerTodo();
  const [projectId, setProjectId] = useAtom(timerProjectIdAtom);
  const [listId, setListId] = useAtom(timerListIdAtom);
  const { data: allProjects = [] } = useProjects();
  const { data: allLists = [] } = useLists();
  const projects = useMemo(() => activeProjects(allProjects), [allProjects]);
  const availableLists = projectId
    ? allLists.filter((l) => l.projectId === projectId)
    : allLists;

  if (current) {
    return (
      <>
        <ProjectTag
          project={current.project}
          className="h-7 px-2.5 rounded-lg border border-line max-w-40"
        />
        {current.list && (
          <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-line max-w-35 min-w-0 text-xs text-muted">
            <ListFilter size={12} className="shrink-0" />
            <span className="truncate">{current.list.name}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => chooseTodo(null)}
          aria-label="Clear todo"
          title="Clear todo"
          className="shrink-0 p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </>
    );
  }

  return (
    <>
      <ProjectCombobox
        projects={projects}
        value={projectId}
        onChange={(pId) => {
          setProjectId(pId);
          const list = allLists.find((l) => l.id === listId);
          if (list && pId && list.projectId !== pId) setListId("");
        }}
        placeholder="No Project"
        className="h-7 text-xs px-2.5 shadow-none border-line rounded-lg w-auto min-w-27.5 max-w-40"
      />
      <ListCombobox
        lists={availableLists}
        value={listId}
        onChange={setListId}
        placeholder="No List"
        className="hidden sm:inline-flex h-7 text-xs px-2.5 shadow-none bg-transparent border-line rounded-lg w-auto min-w-23.75 max-w-35"
      />
    </>
  );
}

function TimerClock() {
  const { data: running = null } = useRunningTimeEntry();
  const now = useNow(Boolean(running));

  return (
    <span
      className={cn(
        "ml-auto sm:ml-1 w-16 text-right font-mono tabular-nums text-sm",
        running ? "text-fg" : "text-muted",
      )}
    >
      {formatDuration(running ? entrySeconds(running, now) : 0)}
    </span>
  );
}

function TimerAction() {
  const { data: running = null } = useRunningTimeEntry();
  const creating = useAtomValue(timerCreatingAtom);
  const startFromDraft = useStartFromDraft();
  const stopTimer = useStopTimer();

  if (running) {
    return (
      <button
        type="button"
        onClick={() => stopTimer.mutate()}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-danger text-white text-xs font-medium hover:opacity-90 cursor-pointer"
      >
        <Square className="w-3 h-3 fill-current" />
        Stop
      </button>
    );
  }

  return (
    <button
      id={START_BUTTON_ID}
      type="button"
      onClick={startFromDraft}
      disabled={creating}
      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-accent text-white text-xs font-medium hover:opacity-90 disabled:opacity-60 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Play className="w-3 h-3 fill-current" />
      Start
    </button>
  );
}

export function TimerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        // note: same background in every state, running is shown by the stop button and clock
        "flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 px-4 py-2.5 rounded-xl bg-tint/3",
        className,
      )}
    >
      <TimerTodoField />
      <div className="flex items-center gap-2 shrink-0">
        <TimerTargets />
        <TimerClock />
        <TimerAction />
      </div>
    </div>
  );
}

export function TodoPicker({
  selectedId,
  onChoose,
  children,
}: {
  selectedId?: string | null;
  onChoose: (todo: TimerTodo) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const createEntryTodo = useCreateEntryTodo();

  const choose = (todo: TimerTodo) => {
    onChoose(todo);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search or create todo…"
          />
          <TodoOptions
            query={query}
            selectedId={selectedId}
            onPick={choose}
            onCreate={async (title) => choose(await createEntryTodo(title))}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function EntryTodoPicker({
  entry,
  children,
}: {
  entry: TimeEntry;
  children: ReactNode;
}) {
  const updateEntry = useUpdateTimeEntry();
  return (
    <TodoPicker
      selectedId={entry.todoId}
      onChoose={(todo) => updateEntry.mutate({ id: entry.id, todo })}
    >
      {children}
    </TodoPicker>
  );
}

function ClockInput({
  iso,
  onCommit,
}: {
  iso: string;
  onCommit: (hhmm: string) => void;
}) {
  const value = formatClock(iso);
  return (
    <input
      // note: key follows the value so the input resets when server data changes
      key={value}
      type="time"
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value && e.target.value !== value) {
          onCommit(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="block w-14 text-center bg-transparent rounded px-1 py-0.5 text-sm tabular-nums text-muted hover:bg-tint/5 focus:bg-tint/5 focus:text-fg outline-none [&::-webkit-calendar-picker-indicator]:hidden"
    />
  );
}

export function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const startTimer = useStartTimer();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const endedAt = entry.endedAt!;
  const seconds = entrySeconds(entry, Date.now());

  const openTodo = () => {
    if (!entry.todoId) return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) {
      navigate(`/todo/${entry.todoId}`);
      return;
    }
    setParams(
      (prev) => {
        prev.set("todo", entry.todoId!);
        return prev;
      },
      { replace: true },
    );
  };

  const commitStart = (hhmm: string) => {
    const startedAt = withClock(entry.startedAt, hhmm);
    if (new Date(startedAt) > new Date(endedAt)) return;
    updateEntry.mutate({ id: entry.id, startedAt });
  };

  const commitEnd = (hhmm: string) => {
    let end = new Date(withClock(endedAt, hhmm));
    const start = new Date(entry.startedAt);
    // note: an end time before the start time is treated as past midnight
    if (end < start) end = new Date(withClock(entry.startedAt, hhmm));
    if (end < start) end.setDate(end.getDate() + 1);
    updateEntry.mutate({ id: entry.id, endedAt: end.toISOString() });
  };

  return (
    <div className="group flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1 px-3 py-2 hover:bg-tint/3">
      <div className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
        {entry.todo?.completed ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
        ) : (
          <Circle className="w-4 h-4 shrink-0 text-muted/60" />
        )}
        <EntryTodoPicker entry={entry}>
          <button
            type="button"
            className={cn(
              "truncate text-left text-sm rounded px-1 -mx-1 hover:bg-tint/5 cursor-pointer",
              entry.todo ? "text-fg" : "text-muted italic",
              entry.todo?.completed && "line-through text-muted",
            )}
          >
            {entry.todo?.title ?? (entry.todoId ? "Deleted todo" : "No todo")}
          </button>
        </EntryTodoPicker>
        <ProjectTag project={entry.todo?.project} className="shrink" />
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-6 sm:ml-0">
        <ClockInput iso={entry.startedAt} onCommit={commitStart} />
        <span className="text-muted text-sm">–</span>
        <ClockInput iso={endedAt} onCommit={commitEnd} />
      </div>

      <span className="shrink-0 w-16 text-right font-mono tabular-nums text-sm text-fg">
        {formatDuration(seconds)}
      </span>

      <div className="flex items-center shrink-0 ml-auto sm:ml-0">
        <button
          type="button"
          onClick={() => startTimer.mutate({ todo: entry.todo })}
          aria-label="Continue timer"
          title="Continue"
          className="p-1.5 rounded-md text-muted hover:text-accent hover:bg-tint/5 cursor-pointer"
        >
          <Play className="w-4 h-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-tint/5 data-[state=open]:bg-tint/5 cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {entry.todo && (
              <>
                <DropdownMenuItem
                  onClick={openTodo}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Open todo
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={() => deleteEntry.mutate(entry.id)}
              className="gap-2 text-danger focus:bg-danger/10 focus:text-danger cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
