import { createContext, useContext } from "react";
import type { TodoFilters } from "./todo-filters";

export type ProjectTodoView = {
  reordering: boolean;
  setReordering: (reordering: boolean) => void;
  filters: TodoFilters;
  setFilters: (filters: TodoFilters) => void;
};

export const ProjectTodoViewContext = createContext<ProjectTodoView | null>(null);

export function useProjectTodoView() {
  const view = useContext(ProjectTodoViewContext);
  if (!view)
    throw new Error("useProjectTodoView must be used within ProjectTodoViewProvider");
  return view;
}
