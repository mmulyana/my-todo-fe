import { Box, Calendar, Check, GripVertical, Star } from "lucide-react";
import { CircularProgress } from "./circular-progress";
import { PRIORITY_CONFIG, PriorityIcon } from "./priority-icon";
import { formatDue, formatDueRelative, isOverdue, todayISO } from "../lib/dates";
import type { List, TodoPriority, TodoProject } from "../types";
import { cn } from "@/lib/utils";

type TodoDueDateProps = {
  dueDate: string;
  completed: boolean;
};

function duePill({ dueDate, completed }: TodoDueDateProps) {
  if (!completed && isOverdue(dueDate)) {
    return "!bg-danger/15 !text-danger font-semibold";
  }
  if (!completed && dueDate === todayISO()) {
    return "!bg-accent/15 !text-accent font-semibold";
  }
  return "!bg-tint/5 !text-fg/70";
}

export function TodoDueDate({ dueDate, completed }: TodoDueDateProps) {
  return (
    <span
      className={cn(
        "flex gap-1 text-xs items-center rounded-lg text-tint/50 px-2 py-1",
        duePill({ dueDate, completed }),
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
        "shrink-0 transition-opacity",
        important
          ? "text-warn opacity-100"
          : "text-muted opacity-0 group-hover/row:opacity-100 hover:text-warn",
      )}
      onClick={onToggle}
      aria-label={important ? "Remove from Important" : "Mark as Important"}
      aria-pressed={important}
    >
      <Star size={16} className={important ? "fill-warn" : ""} />
    </button>
  );
}

export function TodoPriorityBadge({ priority }: { priority: TodoPriority }) {
  return (
    <span className="flex items-center" title={PRIORITY_CONFIG[priority].label}>
      <PriorityIcon priority={priority} />
    </span>
  );
}

export function TodoListBadge({ list }: { list: List }) {
  return (
    <span className="text-xs flex gap-1 rounded-lg bg-tint/5 text-tint/50 px-2 py-1 font-semibold items-center">
      {list.name}
    </span>
  );
}

export function TodoProjectBadge({ project }: { project: TodoProject }) {
  return (
    <span className="text-xs flex gap-1 rounded-lg bg-tint/5 text-tint/50 px-2 py-1 font-semibold items-center">
      <Box size={12} style={{ color: project.color ?? undefined }} />
      {project.name}
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
        "grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px]",
        completed
          ? "bg-accent border-accent text-white"
          : "border-line hover:border-muted bg-raised",
      )}
      onClick={onToggle}
      aria-label={completed ? "Mark as not completed" : "Mark as completed"}
      aria-pressed={completed}
    >
      <span
        className={cn(
          "w-3 h-3",
          completed
            ? "text-white"
            : "text-muted opacity-0 group-hover/row:opacity-40",
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
      className="flex gap-1 items-center hover:bg-tint/5 rounded-lg p-0.5"
      title={`${completed} of ${total} subtodos completed`}
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={expanded ? "Hide steps" : "Show steps"}
    >
      <CircularProgress value={completed} total={total} size={15} />
      <p className="text-xs text-fg font-medium mr-1">
        <span>{completed}</span>/<span className="opacity-40">{total}</span>
      </p>
    </button>
  );
}

type TodoDragHandleProps = {
  title: string;
  dragHandleRef?: (element: Element | null) => void;
};

export function TodoDragHandle({ title, dragHandleRef }: TodoDragHandleProps) {
  return (
    <span className="flex justify-center w-5 h-5 shrink-0">
      {dragHandleRef && (
        <button
          type="button"
          ref={dragHandleRef}
          className="flex items-center justify-center w-5 h-5 rounded-md text-muted opacity-0 group-hover/row:opacity-100 hover:bg-tint/10 hover:text-fg cursor-grab active:cursor-grabbing touch-none"
          aria-label={`Reorder ${title}`}
          title="Drag to reorder"
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
      )}
    </span>
  );
}
