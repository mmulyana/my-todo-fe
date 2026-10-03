import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { format } from "date-fns";
import { Box, CheckCircle2, Flag, ListFilter, Star } from "lucide-react";
import { PRIORITY_CONFIG, PriorityIcon } from "@/components/priority-icon";
import {
  formatTimeRange,
  isSpanning,
  type CalendarItem,
  type EventDraft,
} from "@/lib/calendar";
import type { CalendarEvent } from "@/types";
import { cn } from "@/lib/utils";

export type CalendarActions = {
  onOpen: (item: CalendarItem) => void;
  onCreate: (draft: EventDraft) => void;
  onMoveItem: (item: CalendarItem, start: Date, end: Date) => void;
};

export const tint = (color: string, amount: number) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

function isDone(item: CalendarItem) {
  return item.kind === "deadline"
    ? item.todo.completed
    : Boolean(item.event.todo?.completed);
}

type LinkedTodo = NonNullable<CalendarEvent["todo"]>;

const linkedTodo = (item: CalendarItem): LinkedTodo | null =>
  item.kind === "event" ? item.event.todo : null;

function todoTooltip(todo: LinkedTodo): string {
  const place = [todo.project?.name ?? "No project", todo.list?.name]
    .filter(Boolean)
    .join(" / ");
  return [
    `Todo: ${todo.title}`,
    place,
    todo.important && "Important",
    todo.priority && PRIORITY_CONFIG[todo.priority].label,
  ]
    .filter(Boolean)
    .join("\n");
}

function TodoBadges({ todo }: { todo: LinkedTodo }) {
  return (
    <>
      {todo.important && (
        <Star
          aria-label="Important"
          className="w-3 h-3 shrink-0 fill-amber-400 text-amber-400"
        />
      )}
      <PriorityIcon priority={todo.priority} className="w-3 h-3" />
    </>
  );
}

function TodoPlace({
  todo,
  showList,
}: {
  todo: LinkedTodo;
  showList: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 text-muted">
      <span className="flex items-center gap-1 min-w-0">
        <Box
          className="w-3 h-3 shrink-0"
          style={{ color: todo.project?.color ?? undefined }}
        />
        <span className="truncate">{todo.project?.name ?? "No project"}</span>
      </span>
      {showList && todo.list && (
        <span className="flex items-center gap-1 min-w-0">
          <ListFilter className="w-3 h-3 shrink-0" />
          <span className="truncate">{todo.list.name}</span>
        </span>
      )}
    </div>
  );
}

export function ItemChip({
  item,
  continuesBefore,
  continuesAfter,
  dragging,
  className,
  style,
  onPointerDown,
  onClick,
}: {
  item: CalendarItem;
  continuesBefore?: boolean;
  continuesAfter?: boolean;
  dragging?: boolean;
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (e: ReactPointerEvent) => void;
  onClick?: () => void;
}) {
  const done = isDone(item);
  const base =
    "flex items-center gap-1 h-5.5 px-1.5 text-xs leading-none select-none cursor-pointer truncate transition-[opacity,box-shadow]";

  if (item.kind === "deadline") {
    return (
      <div
        role="button"
        title={`Deadline: ${item.title}`}
        onPointerDown={onPointerDown}
        onClick={onClick}
        className={cn(
          base,
          "rounded-md border border-dashed text-fg",
          dragging && "ring-2 ring-accent opacity-80",
          className,
        )}
        style={{
          ...style,
          borderColor: item.color,
          backgroundColor: tint(item.color, 10),
        }}
      >
        <Flag className="w-3 h-3 shrink-0" style={{ color: item.color }} />
        <span className={cn("truncate", done && "line-through text-muted")}>
          {item.title}
        </span>
      </div>
    );
  }

  const spanning = isSpanning(item);
  const todo = linkedTodo(item);
  return (
    <div
      role="button"
      title={todo ? `${item.title}\n${todoTooltip(todo)}` : item.title}
      onPointerDown={onPointerDown}
      onClick={onClick}
      className={cn(
        base,
        "rounded-md text-fg",
        spanning ? "font-medium" : "hover:bg-tint/5",
        continuesBefore && "rounded-l-none",
        continuesAfter && "rounded-r-none",
        dragging && "ring-2 ring-accent opacity-80",
        className,
      )}
      style={{
        ...style,
        ...(spanning ? { backgroundColor: tint(item.color, 28) } : {}),
      }}
    >
      {!spanning && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
      )}
      {!spanning && !item.allDay && (
        <span className="text-muted tabular-nums shrink-0">
          {format(item.start, "HH:mm")}
        </span>
      )}
      {done && <CheckCircle2 className="w-3 h-3 shrink-0 text-success" />}
      {todo && <TodoBadges todo={todo} />}
      <span className={cn("truncate", done && "line-through text-muted")}>
        {item.title}
      </span>
    </div>
  );
}

export function TimedCard({
  item,
  start,
  end,
  heightPx,
  dragging,
  ghost,
  onPointerDown,
  onResizePointerDown,
}: {
  item: CalendarItem;
  start: Date;
  end: Date;
  heightPx: number;
  dragging?: boolean;
  ghost?: boolean;
  onPointerDown?: (e: ReactPointerEvent) => void;
  onResizePointerDown?: (e: ReactPointerEvent) => void;
}) {
  const done = isDone(item);
  const compact = heightPx < 40;
  const todo = linkedTodo(item);
  const tooltip = `${item.title}\n${formatTimeRange(start, end)}`;

  return (
    <div
      role="button"
      title={todo ? `${tooltip}\n${todoTooltip(todo)}` : tooltip}
      onPointerDown={onPointerDown}
      className={cn(
        "group relative flex gap-1.5 h-full w-full overflow-hidden rounded-md p-1 text-xs text-fg select-none cursor-pointer",
        dragging && "opacity-40",
        ghost && "shadow-lg ring-1 ring-accent z-30",
      )}
      style={{
        background: `linear-gradient(${tint(item.color, ghost ? 40 : 24)}, ${tint(item.color, ghost ? 40 : 24)}), var(--surface)`,
      }}
    >
      <div
        aria-hidden
        className="w-1 h-full shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <div
        className={cn(
          "flex-1 min-w-0",
          compact ? "flex items-center gap-1.5" : "flex flex-col",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 font-medium min-w-0",
            !compact && "mb-0.5",
          )}
        >
          {done && <CheckCircle2 className="w-3 h-3 shrink-0 text-success" />}
          {todo && <TodoBadges todo={todo} />}
          <span className={cn("truncate", done && "line-through text-muted")}>
            {item.title}
          </span>
        </div>
        <div className="text-muted tabular-nums truncate">
          {formatTimeRange(start, end)}
        </div>
        {todo && !compact && heightPx >= 52 && (
          <div className="mt-0.5">
            <TodoPlace todo={todo} showList={heightPx >= 70} />
          </div>
        )}
      </div>
      {onResizePointerDown && (
        <div
          onPointerDown={onResizePointerDown}
          className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize opacity-0 group-hover:opacity-100 flex justify-center items-end pb-0.5"
        >
          <span className="w-6 h-0.5 rounded-full bg-fg/40" />
        </div>
      )}
    </div>
  );
}
