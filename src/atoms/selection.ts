import { atom } from "jotai";

export const selectedTodoIdsAtom = atom<string[]>([]);

export const selectionModeAtom = atom(false);

export const toggleTodoSelectionAtom = atom(null, (get, set, id: string) => {
  const current = get(selectedTodoIdsAtom);
  set(
    selectedTodoIdsAtom,
    current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
  );
});

export const selectingAtom = atom(
  (get) => get(selectionModeAtom) || get(selectedTodoIdsAtom).length > 0,
);

export const exitSelectionAtom = atom(null, (_get, set) => {
  set(selectionModeAtom, false);
  set(selectedTodoIdsAtom, []);
});
