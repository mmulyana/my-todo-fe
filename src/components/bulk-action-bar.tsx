import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarX, Check, Star, Sun, Sunrise, Trash2, X } from "lucide-react";
import { useSetAtom } from "jotai";
import {
  exitSelectionAtom,
  selectedTodoIdsAtom,
  selectingAtom,
} from "../atoms/selection";
import {
  TODOS_KEY,
  TODO_KEY,
  useDeleteTodo,
  useUpdateTodo,
} from "../hooks/useTodos";
import { todayISO, tomorrowISO } from "../lib/dates";
import { cn } from "@/lib/utils";
import type { Todo } from "../types";

function BarButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors",
        danger ? "text-danger hover:bg-danger/10" : "text-fg hover:bg-tint/10",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function BulkActionBar() {
  const [selected, setSelected] = useAtom(selectedTodoIdsAtom);
  const [selecting] = useAtom(selectingAtom);
  const exit = useSetAtom(exitSelectionAtom);
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  // note: pilihan tidak dibawa pindah halaman, id yang tidak terlihat bisa terhapus tanpa disadari
  useEffect(() => {
    exit();
  }, [pathname, exit]);

  useEffect(() => {
    if (!selecting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selecting, exit]);

  // note: tetap ter-mount sampai animasi keluar selesai
  const [mounted, setMounted] = useState(selecting);
  if (selecting && !mounted) setMounted(true);

  if (!mounted) return null;

  const patchAll = (patch: Partial<Todo>) => {
    if (selected.length === 0) return;
    // note: invalidate sekali di akhir, bukan per todo
    Promise.allSettled(
      selected.map((id) =>
        updateTodo.mutateAsync({ id, patch, skipInvalidate: true }),
      ),
    ).finally(() => {
      qc.invalidateQueries({ queryKey: TODOS_KEY });
      qc.invalidateQueries({ queryKey: TODO_KEY });
    });
    setSelected([]);
  };

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      data-state={selecting ? "open" : "closed"}
      onAnimationEnd={() => {
        if (!selecting) setMounted(false);
      }}
      // note: inset-x-0 + mx-auto (bukan translate) supaya tidak bentrok dengan transform animasi
      className="fixed bottom-6 inset-x-0 mx-auto w-fit z-50 flex items-center gap-0.5 rounded-xl border border-line bg-raised px-2 py-1.5 shadow-lg max-w-[calc(100vw-1rem)] overflow-x-auto ease-out-strong data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 data-[state=open]:duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=closed]:duration-150 data-[state=closed]:fill-mode-forwards data-[state=closed]:pointer-events-none motion-reduce:slide-in-from-bottom-0 motion-reduce:slide-out-to-bottom-0"
    >
      <span className="px-2 text-xs font-medium tabular-nums text-muted whitespace-nowrap">
        {selected.length > 0 ? `${selected.length} selected` : "Select todos"}
      </span>
      <BarButton label="Complete" icon={<Check size={14} />} onClick={() => patchAll({ completed: true })} />
      <BarButton label="Important" icon={<Star size={14} />} onClick={() => patchAll({ important: true })} />
      <BarButton label="Due today" icon={<Sun size={14} />} onClick={() => patchAll({ dueDate: todayISO() })} />
      <BarButton label="Due tomorrow" icon={<Sunrise size={14} />} onClick={() => patchAll({ dueDate: tomorrowISO() })} />
      <BarButton label="Clear date" icon={<CalendarX size={14} />} onClick={() => patchAll({ dueDate: null })} />
      <BarButton
        label="Delete"
        danger
        icon={<Trash2 size={14} />}
        onClick={() => {
          if (selected.length === 0) return;
          deleteTodo.mutate(selected);
          setSelected([]);
        }}
      />
      <BarButton label="Done" icon={<X size={14} />} onClick={exit} />
    </div>
  );
}
