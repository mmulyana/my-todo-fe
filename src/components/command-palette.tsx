import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CalendarClock,
  CalendarDays,
  Circle,
  CircleCheck,
  Infinity as InfinityIcon,
  Settings,
  Star,
  Sun,
  Timer,
  type LucideIcon,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useProjects } from "@/hooks/useProjects";
import { useTodos } from "@/hooks/useTodos";

type PaletteLink = { name: string; to: string; icon: LucideIcon };

const LINKS: PaletteLink[] = [
  { name: "Today", to: "/today", icon: Sun },
  { name: "Upcoming", to: "/upcoming", icon: CalendarClock },
  { name: "Important", to: "/important", icon: Star },
  { name: "All", to: "/all", icon: InfinityIcon },
  { name: "Timer", to: "/timer", icon: Timer },
  { name: "Calendar", to: "/calendar", icon: CalendarDays },
  { name: "Settings", to: "?settings=profile", icon: Settings },
];

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenTodo: (id: string) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  onOpenTodo,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const term = query.trim();
  const debounced = useDebouncedValue(term, 200);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data: projects = [] } = useProjects();
  const { data: todos = [] } = useTodos(
    { q: debounced, limit: 8 },
    { enabled: open && debounced.length > 0 },
  );

  const needle = term.toLowerCase();
  const links = useMemo(
    () => LINKS.filter((l) => l.name.toLowerCase().includes(needle)),
    [needle],
  );
  const matchedProjects = useMemo(
    () =>
      projects
        .filter((p) => !p.archivedAt && p.name.toLowerCase().includes(needle))
        .slice(0, 6),
    [projects, needle],
  );

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  // note: hasil todo dari query sebelumnya jangan tampil saat input sudah kosong
  const shownTodos = debounced ? todos : [];
  const hasResults =
    links.length + matchedProjects.length + shownTodos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 [&>button]:hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        {/* note: filter bawaan dimatikan, todo dicari server sedangkan link dan project difilter di atas */}
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search todos, projects, pages..."
          />
          <CommandList className="max-h-[60vh]">
            {!hasResults && <CommandEmpty>No results.</CommandEmpty>}
            {shownTodos.length > 0 && (
              <CommandGroup heading="Todos">
                {shownTodos.map((todo) => (
                  <CommandItem
                    key={todo.id}
                    value={`todo-${todo.id}`}
                    onSelect={() => {
                      onOpenChange(false);
                      onOpenTodo(todo.id);
                    }}
                    className="cursor-pointer gap-2"
                  >
                    {todo.completed ? (
                      <CircleCheck className="h-4 w-4 shrink-0 text-muted" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted" />
                    )}
                    <span
                      className={`truncate ${todo.completed ? "text-muted line-through" : ""}`}
                    >
                      {todo.title}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {matchedProjects.length > 0 && (
              <CommandGroup heading="Projects">
                {matchedProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={`project-${project.id}`}
                    onSelect={() => go(`/projects/${project.id}`)}
                    className="cursor-pointer gap-2"
                  >
                    <Box
                      className="h-4 w-4 shrink-0"
                      style={{ color: project.color ?? undefined }}
                    />
                    <span className="truncate">{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {links.length > 0 && (
              <CommandGroup heading="Go to">
                {links.map(({ name, to, icon: Icon }) => (
                  <CommandItem
                    key={to}
                    value={`link-${to}`}
                    onSelect={() => go(to)}
                    className="cursor-pointer gap-2"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted" />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
