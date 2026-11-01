import { Box, Calendar, Check, Flag, Star } from "lucide-react";
import { CircularProgress } from "./circular-progress";
import { PRIORITY_CONFIG, PriorityIcon } from "./priority-icon";
import { formatDue, formatDueRelative, isOverdue, todayISO } from "../lib/dates";
import type { List, Milestone, TodoPriority, TodoProject } from "../types";
import { cn } from "@/lib/utils";

const PILL_CLASS =
  "rounded-full border border-line px-2.5 py-1 text-[13px] bg-transparent";

type TodoDueDateProps = {
  dueDate: string;
  completed: boolean;
  pill?: boolean;
};

function duePill({ dueDate, completed }: TodoDueDateProps) {
  if (!completed && isOverdue(dueDate)) {
    return "!text-danger font-semibold hover:!bg-danger/15";
  }
  if (!completed && dueDate === todayISO()) {
    return "!text-accent font-semibold hover:!bg-accent/15";
  }
  return "!text-fg/70 hover:!bg-tint/5";
}

export function TodoDueDate({ dueDate, completed, pill }: TodoDueDateProps) {
  return (
    <span
      className={cn(
        "flex gap-1 text-[14px] sm:text-xs items-center rounded-lg text-tint/50 px-2 py-1",
        duePill({ dueDate, completed }),
        pill && cn(PILL_CLASS, "gap-1.5 whitespace-nowrap sm:text-[13px]"),
      )}
      title={formatDue(dueDate)}
    >
      <Calendar size={12} />
      {formatDueRelative(dueDate)}
    </span>
  );
}

type TodoImportantButtonProps = {
  important: boolean;
  onToggle: () => void;
};

export function TodoImportantButton({
  important,
  onToggle,
}: TodoImportantButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 transition-[opacity,transform] duration-150 ease-out-strong active:scale-90",
        important
          ? "text-warn opacity-100"
          : "text-muted opacity-0 group-hover/row:opacity-100 hover:text-warn",
      )}
      onClick={onToggle}
      aria-label={important ? "Remove from Important" : "Mark as Important"}
      aria-pressed={important}
    >
      <Star
        size={16}
        className={cn(
          "transition-[fill] duration-150 ease-out-strong",
          important ? "fill-warn" : "fill-transparent",
        )}
      />
    </button>
  );
}

export function TodoPriorityColumn({
  priority,
}: {
  priority: TodoPriority | null;
}) {
  if (priority == null) return null;

  return (
    <span
      className="flex w-5 shrink-0 items-center justify-center"
      title={PRIORITY_CONFIG[priority].label}
    >
      <PriorityIcon priority={priority} />
    </span>
  );
}

export function TodoPriorityBadge({ priority }: { priority: TodoPriority }) {
  return (
    <span className="flex items-center" title={PRIORITY_CONFIG[priority].label}>
      <PriorityIcon priority={priority} />
    </span>
  );
}

const BADGE_CLASS =
  "text-[15px] sm:text-[14px] flex gap-1 text-tint/50 items-center max-w-[80px] min-w-0 shrink-0";

export function TodoListBadge({ list }: { list: List }) {
  return (
    <span className={BADGE_CLASS} title={list.name}>
      <span className="truncate">{list.name}</span>
    </span>
  );
}

export function TodoMilestoneBadge({ milestone }: { milestone: Milestone }) {
  return (
    <span className={BADGE_CLASS} title={milestone.name}>
      <Flag size={12} className="shrink-0" />
      <span className="truncate">{milestone.name}</span>
    </span>
  );
}

export function TodoProjectBadge({
  project,
  pill,
}: {
  project: TodoProject;
  pill?: boolean;
}) {
  if (pill) {
    return (
      <span
        className={cn(
          PILL_CLASS,
          "flex items-center gap-1.5 max-w-40 min-w-0 shrink-0 text-fg/70",
        )}
        title={project.name}
      >
        <span
          className="w-2.5 h-2.5 shrink-0 rounded-full bg-muted"
          style={{ backgroundColor: project.color ?? undefined }}
        />
        <span className="truncate">{project.name}</span>
      </span>
    );
  }

  return (
    <span className={BADGE_CLASS} title={project.name}>
      <Box
        size={12}
        className="shrink-0"
        style={{ color: project.color ?? undefined }}
      />
      <span className="truncate">{project.name}</span>
    </span>
  );
}

type TodoCheckboxProps = {
  completed: boolean;
  onToggle: () => void;
};

export function TodoCheckbox({
  completed,
  onToggle,
}: TodoCheckboxProps) {
  return (
    <button
      type="button"
      className={cn(
        "grid place-items-center w-5 h-5 shrink-0 rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-150 ease-out-strong active:scale-[0.96]",
        completed
          ? "bg-accent border-accent text-white"
          : "border-line hover:border-muted",
      )}
      onClick={onToggle}
      aria-label={completed ? "Mark as not completed" : "Mark as completed"}
      aria-pressed={completed}
    >
      <span
        className={cn(
          "w-3 h-3",
          completed
            ? "text-white animate-check-in"
            : "text-muted opacity-0",
        )}
      >
        <Check className="w-full h-full" strokeWidth={3} />
      </span>
    </button>
  );
}

type TodoSubtodoProgressProps = {
  completed: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
};

export function TodoSubtodoProgress({
  completed,
  total,
  expanded,
  onToggle,
}: TodoSubtodoProgressProps) {
  return (
    <button
      className="flex gap-1 items-center opacity-80 hover:opacity-100 rounded-lg"
      title={`${completed} of ${total} subtodos completed`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? "Hide steps" : "Show steps"}
    >
      <CircularProgress value={completed} total={total} size={16} />
      <p className="text-[14px] sm:text-xs text-fg font-medium mr-1">
        <span>{completed}</span>/<span className="opacity-40">{total}</span>
      </p>
    </button>
  );
}
