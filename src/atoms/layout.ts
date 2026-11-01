import { atom } from "jotai";

export const sidebarOpenAtom = atom(false);

export const searchOpenAtom = atom(false);

type NewTaskState = {
  open: boolean;
  projectId: string | null;
  listId: string | null;
};

export const newTaskAtom = atom<NewTaskState>({
  open: false,
  projectId: null,
  listId: null,
});

export const openNewTaskAtom = atom(
  null,
  (_get, set, target?: { projectId?: string | null; listId?: string | null }) =>
    set(newTaskAtom, {
      open: true,
      projectId: target?.projectId ?? null,
      listId: target?.listId ?? null,
    }),
);
