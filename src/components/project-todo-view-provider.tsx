import { useMemo, useState, type ReactNode } from "react";
import { ReorderContext } from "@/lib/reorder";
import { ProjectTodoViewContext } from "@/lib/project-todo-view";
import { loadFilters, saveFilters, type TodoFilters } from "@/lib/todo-filters";

type ProjectTodoViewProviderProps = {
  projectId: string;
  children: ReactNode;
};

// note: state reorder dan filter disimpan di sini, bukan di halaman, supaya perubahannya hanya me-render toolbar dan daftar todo
export function ProjectTodoViewProvider({
  projectId,
  children,
}: ProjectTodoViewProviderProps) {
  const [reordering, setReordering] = useState(false);
  const [filters, setFiltersState] = useState(() => loadFilters(projectId));

  const value = useMemo(
    () => ({
      reordering,
      setReordering,
      filters,
      setFilters: (next: TodoFilters) => {
        setFiltersState(next);
        saveFilters(projectId, next);
      },
    }),
    [reordering, filters, projectId],
  );

  return (
    <ProjectTodoViewContext.Provider value={value}>
      <ReorderContext.Provider value={reordering}>
        {children}
      </ReorderContext.Provider>
    </ProjectTodoViewContext.Provider>
  );
}
