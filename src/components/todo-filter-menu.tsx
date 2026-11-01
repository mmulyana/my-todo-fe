import { useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Box,
  Flag,
  List,
  ListFilter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PRIORITY_CONFIG, PriorityIcon } from "./priority-icon";
import {
  EMPTY_FILTERS,
  NONE,
  activeFilterCount,
  optionMatches,
  type FilterCategory,
  type TodoFilters,
} from "@/lib/todo-filters";
import { cn } from "@/lib/utils";
import type {
  List as TodoList,
  Milestone,
  Todo,
  TodoPriority,
} from "../types";

type Option = { key: string; label: string; icon?: ReactNode };

type CategoryDef = {
  id: FilterCategory;
  label: string;
  icon: ReactNode;
  options: Option[];
};

const DEFAULT_CATEGORIES: FilterCategory[] = [
  "completed",
  "priority",
  "list",
  "milestone",
  "due",
];

type TodoFilterMenuProps = {
  todos: Todo[];
  categories?: FilterCategory[];
  lists?: TodoList[];
  milestones?: Milestone[];
  projects?: { id: string; label: string }[];
  filters: TodoFilters;
  onChange: (filters: TodoFilters) => void;
  className?: string;
};

const ICON = "w-3.5 h-3.5 shrink-0 text-muted";

export function TodoFilterMenu({
  todos,
  categories: allowed = DEFAULT_CATEGORIES,
  lists = [],
  milestones = [],
  projects = [],
  filters,
  onChange,
  className,
}: TodoFilterMenuProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeCount = activeFilterCount(filters);

  const definitions: CategoryDef[] = [
    {
      id: "completed",
      label: "Completed",
      icon: <CircleCheck className={ICON} />,
      options: [
        { key: "done", label: "Completed" },
        { key: "open", label: "Not completed" },
      ],
    },
    {
      id: "priority",
      label: "Priority",
      icon: <PriorityIcon priority={2} className="w-3.5 h-3.5" />,
      options: [
        { key: NONE, label: "No priority", icon: <span className="w-4 text-center text-muted/60">---</span> },
        ...([1, 2, 3] as TodoPriority[]).map((priority) => ({
          key: String(priority),
          label: PRIORITY_CONFIG[priority].label.replace(" priority", ""),
          icon: <PriorityIcon priority={priority} />,
        })),
      ],
    },
    {
      id: "project",
      label: "Project",
      icon: <Box className={ICON} />,
      options: [
        { key: NONE, label: "No project" },
        ...projects.map((project) => ({ key: project.id, label: project.label })),
      ],
    },
    {
      id: "list",
      label: "List",
      icon: <List className={ICON} />,
      options: [
        { key: NONE, label: "No list" },
        ...lists.map((list) => ({ key: list.id, label: list.name })),
      ],
    },
    {
      id: "milestone",
      label: "Milestone",
      icon: <Flag className={ICON} />,
      options: [
        { key: NONE, label: "No milestone" },
        ...milestones.map((milestone) => ({
          key: milestone.id,
          label: milestone.name,
        })),
      ],
    },
    {
      id: "due",
      label: "Due date",
      icon: <CalendarDays className={ICON} />,
      options: [
        { key: "overdue", label: "Overdue" },
        { key: "today", label: "Today" },
        { key: "week", label: "Next 7 days" },
        { key: NONE, label: "No due date" },
      ],
    },
  ];

  const toggle = (category: FilterCategory, key: string) => {
    const selected = filters[category];
    onChange({
      ...filters,
      [category]: selected.includes(key)
        ? selected.filter((value) => value !== key)
        : [...selected, key],
    });
  };

  const needle = query.trim().toLowerCase();
  const visible = definitions.filter(
    (category) =>
      allowed.includes(category.id) &&
      category.label.toLowerCase().includes(needle),
  );

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setQuery("");
        else setTimeout(() => inputRef.current?.focus(), 0);
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Filter"
          title="Filter"
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center gap-1.5 rounded-full border text-[12px] transition-colors cursor-pointer data-[state=open]:bg-tint/10 data-[state=open]:text-fg",
            activeCount > 0
              ? "border-transparent bg-tint/10 text-fg"
              : "border-line text-muted hover:bg-tint/5 hover:text-fg",
            className,
          )}
        >
          <ListFilter className="w-3.5 h-3.5" />
          {activeCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-active-sidebar bg-accent"
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-60"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key.length === 1 || event.key === "Backspace")
              event.stopPropagation();
          }}
          placeholder="Add filter..."
          aria-label="Add filter"
          className="w-full bg-transparent px-2 py-1.5 text-xs text-fg outline-none placeholder:text-muted"
        />
        <DropdownMenuSeparator />

        {visible.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted">No filters found</div>
        )}

        {visible.map((category) => {
          const selectedCount = filters[category.id].length;
          return (
            <DropdownMenuSub key={category.id}>
              <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                {category.icon}
                <span className="flex-1">{category.label}</span>
                {selectedCount > 0 && (
                  <span className="text-[11px] tabular-nums">
                    {selectedCount}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 max-h-72 overflow-y-auto">
                {category.options.map((option) => {
                  const checked = filters[category.id].includes(option.key);
                  const count = todos.filter((todo) =>
                    optionMatches(todo, category.id, option.key),
                  ).length;
                  return (
                    <DropdownMenuItem
                      key={option.key}
                      onSelect={(event) => {
                        event.preventDefault();
                        toggle(category.id, option.key);
                      }}
                      className="gap-2"
                    >
                      <span
                        className={cn(
                          "grid w-4 h-4 shrink-0 place-items-center rounded border",
                          checked
                            ? "border-accent bg-accent text-white"
                            : "border-line",
                        )}
                      >
                        {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                      {option.icon}
                      <span className="flex-1 min-w-0 truncate">{option.label}</span>
                      <span className="text-[11px] tabular-nums text-muted">
                        {count}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}

        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onChange(EMPTY_FILTERS)}
              className="text-muted"
            >
              Clear filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
