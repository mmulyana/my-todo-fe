import { atom } from "jotai";

export const sidebarOpenAtom = atom(false);

export const searchOpenAtom = atom(false);

type NewTaskState = {
  open: boolean;
  projectId: string | null;
  listId: string | null;
  myDay: boolean;
  important: boolean;
};

export const newTaskAtom = atom<NewTaskState>({
  open: false,
  projectId: null,
  listId: null,
  myDay: false,
  important: false,
});

export const openNewTaskAtom = atom(
  null,
  (_get, set, target?: {
    projectId?: string | null;
    listId?: string | null;
    myDay?: boolean;
    important?: boolean;
  }) =>
    set(newTaskAtom, {
      open: true,
      projectId: target?.projectId ?? null,
      listId: target?.listId ?? null,
      myDay: target?.myDay ?? false,
      important: target?.important ?? false,
    }),
);
