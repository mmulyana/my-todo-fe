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

type NewTaskTarget = {
  projectId?: string | null;
  listId?: string | null;
  myDay?: boolean;
  important?: boolean;
};

export const newTaskDefaultsAtom = atom<NewTaskTarget & { enabled: boolean }>({
  enabled: false,
});

export const newTaskFabVisibleAtom = atom((get) => get(newTaskDefaultsAtom).enabled);

export const openNewTaskAtom = atom(
  null,
  (get, set, target?: NewTaskTarget) => {
    const source = target ?? get(newTaskDefaultsAtom);
    set(newTaskAtom, {
      open: true,
      projectId: source.projectId ?? null,
      listId: source.listId ?? null,
      myDay: source.myDay ?? false,
      important: source.important ?? false,
    });
  },
);
