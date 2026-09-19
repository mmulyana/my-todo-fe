import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/react/sortable";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types";

type KanbanCardProps = {
  todo: Todo;
  index: number;
  columnId: string;
  onOpen: () => void;
};

export function KanbanCard({
  todo,
  index,
  columnId,
  onOpen,
}: KanbanCardProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: todo.id,
    index,
    type: "item",
    accept: "item",
    group: columnId,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "group/card relative w-full rounded-xl border border-line bg-raised p-3",
        isDragging && "opacity-30",
      )}
    >
      <button type="button" onClick={onOpen} className="w-full pr-5 text-left">
        <p className="line-clamp-2 text-sm font-medium">{todo.title}</p>
        {todo.note && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{todo.note}</p>
        )}
      </button>
      <button
        type="button"
        ref={handleRef}
        className="absolute right-1.5 top-2 flex h-6 w-6 cursor-grab items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-tint/10 hover:text-fg active:cursor-grabbing group-hover/card:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
        aria-label={`Reorder ${todo.title}`}
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
    </div>
  );
}
