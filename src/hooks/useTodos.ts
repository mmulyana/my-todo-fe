import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as api from "../api";
import { INBOX } from "../views";
import type { List, Todo, TodoFilter, View } from "../types";
import { PROJECTS_KEY } from "./useProjects";

export const TODOS_KEY = ["todos"] as const;
export const TODO_KEY = ["todo"] as const;
export const KANBAN_COLUMNS_KEY = ["kanban-columns"] as const;

const STALE_TIME = 30_000;
const GC_TIME = 5 * 60_000;

const todosKey = (filter: TodoFilter) => [...TODOS_KEY, filter] as const;
const todoKey = (id: string) => [...TODO_KEY, id] as const;

export function useTodos(filter: TodoFilter, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: todosKey(filter),
    queryFn: () => api.fetchTodos(filter),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: options?.enabled,
  });
}

export function useTodo(id: string) {
  return useQuery({
    queryKey: todoKey(id),
    queryFn: () => api.fetchTodo(id),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: "always",
  });
}

export function useActiveTodos(filter: TodoFilter) {
  return useQuery({
    queryKey: todosKey(filter),
    queryFn: () => api.fetchTodos(filter),
    select: (todos) => todos.filter((t) => !t.completed),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useCompletedTodos(filter: TodoFilter) {
  return useQuery({
    queryKey: todosKey(filter),
    queryFn: () => api.fetchTodos(filter),
    select: (todos) => todos.filter((t) => t.completed),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

const MY_DAY_FILTER: TodoFilter = { view: "TODAY" };

export function useMyDayTodos(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: todosKey(MY_DAY_FILTER),
    queryFn: () => api.fetchTodos(MY_DAY_FILTER),
    select: (todos) => todos.filter((t) => t.myDay),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: options?.enabled,
  });
}

export function useCarriedOverTodos(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: todosKey(MY_DAY_FILTER),
    queryFn: () => api.fetchTodos(MY_DAY_FILTER),
    select: (todos) => todos.filter((t) => !t.myDay),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    enabled: options?.enabled,
  });
}

function writeTodo(
  qc: QueryClient,
  id: string,
  write: (todo: Todo) => Todo | null,
) {
  qc.setQueriesData<Todo[]>({ queryKey: TODOS_KEY }, (todos) =>
    todos?.flatMap((todo) => {
      if (todo.id !== id) return [todo];
      const next = write(todo);
      return next ? [next] : [];
    }),
  );
  qc.setQueryData<Todo | null>(todoKey(id), (todo) =>
    todo ? write(todo) : todo,
  );
}

function shouldSkipInvalidate(vars: unknown): boolean {
  return (
    typeof vars === "object" &&
    vars !== null &&
    (vars as { skipInvalidate?: boolean }).skipInvalidate === true
  );
}

function useOptimisticTodo<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  apply: (qc: QueryClient, vars: TVars) => void,
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (vars: TVars) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: TODOS_KEY }),
        qc.cancelQueries({ queryKey: TODO_KEY }),
      ]);
      const snapshot = [
        ...qc.getQueriesData({ queryKey: TODOS_KEY }),
        ...qc.getQueriesData({ queryKey: TODO_KEY }),
      ];
      apply(qc, vars);
      return { snapshot };
    },
    onError: (err, _vars, ctx) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: (_data, err, vars) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (shouldSkipInvalidate(vars)) return;
      qc.invalidateQueries({ queryKey: TODOS_KEY });
      qc.invalidateQueries({ queryKey: TODO_KEY });
    },
  });
}

function useRefetchingTodo<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODOS_KEY });
      qc.invalidateQueries({ queryKey: TODO_KEY });
    },
  });
}

export function useCreateTodo() {
  return useRefetchingTodo(api.createTodo);
}

export function useUpdateTodo() {
  return useOptimisticTodo<{
    id: string;
    patch: Partial<Todo>;
    signal?: AbortSignal;
    skipInvalidate?: boolean;
  }>(
    ({ id, patch, signal }) => api.updateTodo(id, patch, signal),
    (qc, { id, patch }) => writeTodo(qc, id, (todo) => ({ ...todo, ...patch })),
  );
}

function useRefetchingAttachment<TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODOS_KEY });
      qc.invalidateQueries({ queryKey: TODO_KEY });
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useMoveTodo() {
  return useRefetchingTodo(
    ({
      id,
      kanbanColumnId,
      position,
    }: {
      id: string;
      kanbanColumnId: string;
      position: number;
    }) => api.moveTodo(id, kanbanColumnId, position),
  );
}
export function useMoveTodoToKanbanColumn() {
  return useRefetchingTodo(
    ({
      id,
      kanbanColumnId,
      position,
    }: {
      id: string;
      kanbanColumnId: string;
      position: number;
    }) => api.moveTodoToKanbanColumn(id, kanbanColumnId, position),
  );
}
export function useKanbanColumns(projectId: string) {
  return useQuery({
    queryKey: [...KANBAN_COLUMNS_KEY, projectId],
    queryFn: () => api.fetchKanbanColumns(projectId),
    enabled: !!projectId,
  });
}
function useKanbanColumnMutation<T>(
  mutationFn: (value: T) => Promise<unknown>,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KANBAN_COLUMNS_KEY });
      qc.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });
}
export function useCreateKanbanColumn() {
  return useKanbanColumnMutation(
    ({ projectId, name }: { projectId: string; name: string }) =>
      api.createKanbanColumn(projectId, name),
  );
}
export function useUpdateKanbanColumn() {
  return useKanbanColumnMutation(
    ({ id, ...patch }: { id: string; name?: string; position?: number }) =>
      api.updateKanbanColumn(id, patch),
  );
}
export function useDeleteKanbanColumn() {
  return useKanbanColumnMutation((id: string) => api.removeKanbanColumn(id));
}

export function useMoveTodoToList() {
  return useRefetchingTodo(
    ({
      id,
      listId,
      position,
    }: {
      id: string;
      listId: string | null;
      position: number;
    }) => api.moveTodoToList(id, listId, position),
  );
}

export function useDeleteTodo() {
  return useOptimisticTodo<string>(
    (id) => api.removeTodo(id),
    (qc, id) => writeTodo(qc, id, () => null),
  );
}

export function useCreateSubtodo() {
  return useRefetchingTodo(
    ({ todoId, title }: { todoId: string; title: string }) =>
      api.createSubtodo(todoId, title),
  );
}

export function useUpdateSubtodo() {
  return useOptimisticTodo<{
    todoId: string;
    subtodoId: string;
    patch: { title?: string; completed?: boolean };
    signal?: AbortSignal;
    skipInvalidate?: boolean;
  }>(
    ({ subtodoId, patch, signal }) =>
      api.updateSubtodo(subtodoId, patch, signal),
    (qc, { todoId, subtodoId, patch }) =>
      writeTodo(qc, todoId, (todo) => {
        const prev = todo.subtodos.find((s) => s.id === subtodoId);
        const delta =
          patch.completed !== undefined &&
          prev &&
          prev.completed !== patch.completed
            ? patch.completed
              ? 1
              : -1
            : 0;
        return {
          ...todo,
          subtodos: todo.subtodos.map((s) =>
            s.id === subtodoId ? { ...s, ...patch } : s,
          ),
          completedTodos: todo.completedTodos + delta,
        };
      }),
  );
}

export function useDeleteSubtodo() {
  return useOptimisticTodo<{ todoId: string; subtodoId: string }>(
    ({ subtodoId }) => api.removeSubtodo(subtodoId),
    (qc, { todoId, subtodoId }) =>
      writeTodo(qc, todoId, (todo) => ({
        ...todo,
        subtodos: todo.subtodos.filter((s) => s.id !== subtodoId),
      })),
  );
}

export function useCreateAttachment() {
  return useRefetchingAttachment(api.createAttachment);
}

export function useDeleteAttachment() {
  return useRefetchingAttachment((id: string) => api.removeAttachment(id));
}

export function useUploadAttachment() {
  return useRefetchingAttachment(
    ({
      file,
      ...target
    }: { file: File } & ({ todoId: string } | { projectId: string })) =>
      api.uploadAttachment(file, target),
  );
}

export function newTodoFields(title: string, view: View, lists: List[]) {
  const list =
    view.kind === "list" ? lists.find((l) => l.id === view.id) : null;

  return {
    title,
    listId: view.kind === "list" ? view.id : INBOX,
    projectId: view.kind === "project" ? view.id : (list?.projectId ?? null),
    important: view.kind === "smart" && view.id === "important",
    myDay: view.kind === "smart" && view.id === "today",
    dueDate: null,
  };
}
