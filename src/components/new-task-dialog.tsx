import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Box,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
  Star,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRIORITY_CONFIG, PriorityIcon } from "./priority-icon";
import { useCreateTodo } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import { useProjectFilterOptions } from "../hooks/useTodoFilters";
import { fromISODate, toISODate } from "../lib/dates";
import { cn } from "@/lib/utils";
import type { TodoPriority } from "../types";

type NewTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string | null;
  defaultListId?: string | null;
  defaultMyDay?: boolean;
  defaultImportant?: boolean;
};

const PRIORITIES: TodoPriority[] = [1, 2, 3];

const CHIP_CLASS =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border text-[13px] transition-colors cursor-pointer";

const chipState = (active: boolean) =>
  active
    ? "border-transparent bg-tint/10 text-fg"
    : "border-line text-muted hover:bg-tint/5 hover:text-fg";

function PickerChip({
  icon,
  label,
  active,
  title,
  children,
}: {
  icon: ReactNode;
  label?: string;
  active: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={title}
          aria-label={title}
          className={cn(CHIP_CLASS, chipState(active), label ? "px-2.5" : "w-8")}
        >
          {icon}
          {label && <span className="max-w-32 truncate">{label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function ToggleChip({
  icon: Icon,
  active,
  title,
  onClick,
  iconClassName,
}: {
  icon: LucideIcon;
  active: boolean;
  title: string;
  onClick: () => void;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(CHIP_CLASS, "w-8", chipState(active))}
    >
      <Icon className={cn("w-4 h-4", iconClassName)} />
    </button>
  );
}

const FADE_CLASS =
  "pointer-events-none absolute inset-y-0 z-10 flex w-12 items-center from-raised to-transparent";

const ARROW_CLASS =
  "pointer-events-auto grid h-6 w-6 place-items-center rounded-full text-muted hover:text-fg transition-colors cursor-pointer";

function ScrollRow({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setEdges({
      left: scroller.scrollLeft > 1,
      right:
        scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const observer = new ResizeObserver(update);
    if (scrollerRef.current) observer.observe(scrollerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [update]);

  const scrollBy = (left: number) =>
    scrollerRef.current?.scrollBy({ left, behavior: "smooth" });

  return (
    <div className="relative min-w-0 flex-1">
      <div
        ref={scrollerRef}
        onScroll={update}
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className="flex w-max items-center gap-2">
          {children}
        </div>
      </div>
      {edges.left && (
        <div className={cn(FADE_CLASS, "left-0 justify-start bg-linear-to-r")}>
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-160)}
            className={ARROW_CLASS}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
      {edges.right && (
        <div className={cn(FADE_CLASS, "right-0 justify-end bg-linear-to-l")}>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(160)}
            className={ARROW_CLASS}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function NewTaskForm({
  defaultProjectId,
  defaultListId,
  defaultMyDay,
  defaultImportant,
  onClose,
}: {
  defaultProjectId: string | null;
  defaultListId: string | null;
  defaultMyDay: boolean;
  defaultImportant: boolean;
  onClose: () => void;
}) {
  const createTodo = useCreateTodo();
  const { data: allLists = [] } = useLists();
  const projects = useProjectFilterOptions();

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId);
  const [listId, setListId] = useState<string | null>(defaultListId);
  const [priority, setPriority] = useState<TodoPriority | null>(null);
  const [important, setImportant] = useState(defaultImportant);
  const [myDay, setMyDay] = useState(defaultMyDay);

  const lists = allLists.filter((list) => list.projectId === projectId);
  const project = projects.find((item) => item.id === projectId);
  const list = lists.find((item) => item.id === listId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTodo.mutate({
      title: trimmed,
      dueDate,
      priority,
      projectId,
      listId,
      important,
      myDay,
    });
    onClose();
  };

  return (
    <form onSubmit={submit} className="relative flex min-w-0 flex-col gap-4 p-4">
      <div className="flex">
        <textarea
          rows={1}
          value={title}
          onChange={(event) => setTitle(event.target.value.replace(/\n/g, " "))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Task name"
          aria-label="Task name"
          className="min-w-0 flex-1 resize-none overflow-hidden bg-transparent pr-8 leading-snug outline-none field-sizing-content wrap-break-words placeholder:text-muted"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-tint/5 hover:text-fg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        <ScrollRow>
          <PickerChip
            icon={<Calendar className="w-3.5 h-3.5" />}
            title="Due date"
            active={Boolean(dueDate)}
            label={dueDate ? dueDate.split("-").reverse().join("/") : undefined}
          >
            <CalendarPicker
              mode="single"
              selected={dueDate ? fromISODate(dueDate) : undefined}
              onSelect={(date) => setDueDate(date ? toISODate(date) : null)}
            />
          </PickerChip>

          <PickerChip
            icon={<Box className="w-3.5 h-3.5" />}
            title="Project"
            active={Boolean(project)}
            label={project?.label.split(" / ").pop()}
          >
            <Command>
              <CommandInput placeholder="Search project..." />
              <CommandList>
                <CommandEmpty>No project found</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setProjectId(null);
                      setListId(null);
                    }}
                  >
                    No project
                  </CommandItem>
                  {projects.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => {
                        setProjectId(item.id);
                        setListId(null);
                      }}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.id === projectId && <Check className="w-3.5 h-3.5" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PickerChip>

          {lists.length > 0 && (
            <PickerChip
              icon={<ListIcon className="w-3.5 h-3.5" />}
              title="List"
              active={Boolean(list)}
              label={list?.name}
            >
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem onSelect={() => setListId(null)}>No list</CommandItem>
                    {lists.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => setListId(item.id)}
                      >
                        <span className="flex-1 truncate">{item.name}</span>
                        {item.id === listId && <Check className="w-3.5 h-3.5" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PickerChip>
          )}

          <PickerChip
            icon={
              <PriorityIcon
                priority={priority ?? 2}
                className="w-3.5 h-3.5"
              />
            }
            title="Priority"
            active={priority !== null}
            label={
              priority
                ? PRIORITY_CONFIG[priority].label.replace(" priority", "")
                : undefined
            }
          >
            <Command>
              <CommandList className="px-0">
                <CommandGroup className="px-0">
                  <CommandItem onSelect={() => setPriority(null)} className="rounded-none">
                    No priority
                  </CommandItem>
                  {PRIORITIES.map((value) => (
                    <CommandItem key={value} onSelect={() => setPriority(value)} className="rounded-none">
                      <PriorityIcon priority={value} />
                      <span className="flex-1 ml-2">
                        {PRIORITY_CONFIG[value].label.replace(" priority", "")}
                      </span>
                      {value === priority && <Check className="w-4 h-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PickerChip>

          <ToggleChip
            icon={Sun}
            title="Add to Today"
            active={myDay}
            onClick={() => setMyDay((value) => !value)}
            iconClassName={myDay ? "text-accent" : undefined}
          />
          <ToggleChip
            icon={Star}
            title="Mark as important"
            active={important}
            onClick={() => setImportant((value) => !value)}
            iconClassName={important ? "fill-warn text-warn" : undefined}
          />
        </ScrollRow>

        <button
          type="submit"
          onPointerDown={(event) => event.preventDefault()}
          disabled={!title.trim()}
          title="Add task"
          aria-label="Add task"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4 rotate-45" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultProjectId = null,
  defaultListId = null,
  defaultMyDay = false,
  defaultImportant = false,
}: NewTaskDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        hideClose
        mobileBottomSheet
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const focusTitle = () =>
            contentRef.current
              ?.querySelector("textarea")
              ?.focus({ preventScroll: true });
          if (window.innerWidth >= 640) focusTitle();
          else window.setTimeout(focusTitle, 250);
        }}
        className="max-w-md grid-cols-[minmax(0,1fr)] gap-0 rounded-2xl p-0"
      >
        <DialogTitle className="sr-only">New task</DialogTitle>
        <DialogDescription className="sr-only">
          Create a task with due date, project, list and priority
        </DialogDescription>
        {/* note: form di komponen terpisah supaya state-nya ikut hilang saat dialog menutup */}
        <NewTaskForm
          defaultProjectId={defaultProjectId}
          defaultListId={defaultListId}
          defaultMyDay={defaultMyDay}
          defaultImportant={defaultImportant}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
