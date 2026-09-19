import { cn } from "@/lib/utils";
import type { Todo, TodoPriority } from "../types";

type PriorityConfig = {
  label: string;
  color: string;
  activeBars: number;
};

export const PRIORITY_CONFIG: Record<TodoPriority, PriorityConfig> = {
  1: { label: "High priority", color: "fill-red-500", activeBars: 3 },
  2: { label: "Medium priority", color: "fill-amber-500", activeBars: 2 },
  3: { label: "Low priority", color: "fill-sky-500", activeBars: 1 },
};

const NO_PRIORITY: PriorityConfig = {
  label: "No priority",
  color: "",
  activeBars: 0,
};

const BARS = [
  { x: 1, y: 10, height: 5 },
  { x: 6.5, y: 6, height: 9 },
  { x: 12, y: 1, height: 14 },
];

type PriorityIconProps = {
  priority?: Todo["priority"];
  className?: string;
  showEmpty?: boolean;
};

export function PriorityIcon({
  priority,
  className,
  showEmpty = false,
}: PriorityIconProps) {
  if (priority == null && !showEmpty) return null;

  const { label, color, activeBars } =
    priority == null ? NO_PRIORITY : PRIORITY_CONFIG[priority];

  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("h-4 w-4 shrink-0", className)}
      role="img"
      aria-label={label}
    >
      {BARS.map((bar, index) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width="3"
          height={bar.height}
          rx="1"
          className={index < activeBars ? color : "fill-muted/30"}
        />
      ))}
    </svg>
  );
}
