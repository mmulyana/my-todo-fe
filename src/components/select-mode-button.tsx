import { useAtomValue, useSetAtom } from "jotai";
import { CheckSquare, X } from "lucide-react";
import {
  exitSelectionAtom,
  selectingAtom,
  selectionModeAtom,
} from "../atoms/selection";

export function SelectModeButton() {
  const selecting = useAtomValue(selectingAtom);
  const setMode = useSetAtom(selectionModeAtom);
  const exit = useSetAtom(exitSelectionAtom);

  return (
    <button
      type="button"
      onClick={() => (selecting ? exit() : setMode(true))}
      aria-pressed={selecting}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
    >
      {selecting ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
      {selecting ? "Done" : "Select"}
    </button>
  );
}
