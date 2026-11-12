import { Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { newTaskFabVisibleAtom, openNewTaskAtom } from "@/atoms/layout";

export function NewTaskFab() {
  const visible = useAtomValue(newTaskFabVisibleAtom);
  const openNewTask = useSetAtom(openNewTaskAtom);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => openNewTask()}
      aria-label="New task"
      className="lg:hidden fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 grid place-items-center w-13 h-13 rounded-full bg-accent text-white shadow-lg active:scale-95 transition-transform cursor-pointer outline-none"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
