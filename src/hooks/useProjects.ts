import { useQuery, type QueryClient } from "@tanstack/react-query";
import * as api from "../api";
import { patch, tempId, useOptimistic } from "./optimistic";
import { LISTS_KEY } from "./useLists";
import { TODOS_KEY } from "./useTodos";
import { subtreeIds } from "../projects";
import type { List, Project, Todo } from "../types";

export const PROJECTS_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery({ queryKey: PROJECTS_KEY, queryFn: api.fetchProjects });
}

export function useCreateProject() {
  return useOptimistic<{
    name: string;
    description?: string | null;
    parentId?: string | null;
    code?: string | null;
    color?: string | null;
  }>(
    [PROJECTS_KEY],
    (input) =>
      api.createProject(
        input.name,
        input.description,
        input.parentId,
        input.code,
        input.color,
      ),
    (qc, input) =>
      patch<Project>(qc, PROJECTS_KEY, (projects) => [
        ...projects,
        {
          id: tempId(),
          name: input.name,
          color: input.color ?? null,
          description: input.description ?? null,
          parentId: input.parentId ?? null,
          code: input.code ?? null,
          attachments: [],
        },
      ]),
  );
}

export function useDeleteProject() {
  return useOptimistic<string>(
    [PROJECTS_KEY, LISTS_KEY, TODOS_KEY],
    (id) => api.removeProject(id),
    (qc, id) => {
      patch<Project>(qc, PROJECTS_KEY, (projects) =>
        projects
          .filter((p) => p.id !== id)
          .map((p) => (p.parentId === id ? { ...p, parentId: null } : p)),
      );
      patch<List>(qc, LISTS_KEY, (lists) =>
        lists.map((l) => (l.projectId === id ? { ...l, projectId: null } : l)),
      );
      patch<Todo>(qc, TODOS_KEY, (todos) =>
        todos.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
      );
    },
  );
}

function setArchivedAt(qc: QueryClient, id: string, archivedAt: string | null) {
  patch<Project>(qc, PROJECTS_KEY, (projects) => {
    const ids = subtreeIds(projects, id);
    return projects.map((p) => (ids.has(p.id) ? { ...p, archivedAt } : p));
  });
}

export function useArchiveProject() {
  return useOptimistic<string>(
    [PROJECTS_KEY, TODOS_KEY],
    (id) => api.archiveProject(id),
    (qc, id) => setArchivedAt(qc, id, new Date().toISOString()),
  );
}

export function useUnarchiveProject() {
  return useOptimistic<string>(
    [PROJECTS_KEY, TODOS_KEY],
    (id) => api.unarchiveProject(id),
    (qc, id) => setArchivedAt(qc, id, null),
  );
}

export function useUpdateProject() {
  return useOptimistic<{
    id: string;
    name?: string;
    description?: string | null;
    parentId?: string | null;
    code?: string | null;
    color?: string | null;
  }>(
    [PROJECTS_KEY],
    ({ id, ...patchFields }) => api.updateProject(id, patchFields),
    (qc, { id, ...patchFields }) =>
      patch<Project>(qc, PROJECTS_KEY, (projects) =>
        projects.map((p) => (p.id === id ? { ...p, ...patchFields } : p)),
      ),
  );
}
