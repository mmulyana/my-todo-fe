import { useState } from "react";
import { useProjects } from "./useProjects";
import { activeProjects, flattenProjects, projectTrail } from "../projects";
import {
  loadFilters,
  saveFilters,
  type FilterCategory,
  type TodoFilters,
} from "@/lib/todo-filters";

export function useTodoFilters(key: string) {
  const [filters, setFiltersState] = useState(() => loadFilters(key));
  const setFilters = (next: TodoFilters) => {
    setFiltersState(next);
    saveFilters(key, next);
  };
  return [filters, setFilters] as const;
}

export function useProjectFilterOptions() {
  const { data: allProjects = [] } = useProjects();
  const projects = activeProjects(allProjects);
  return flattenProjects(projects).map(({ project }) => ({
    id: project.id,
    label: [...projectTrail(projects, project.id), project]
      .map((item) => item.name)
      .join(" / "),
  }));
}

export const CROSS_PROJECT_CATEGORIES: FilterCategory[] = [
  "completed",
  "priority",
  "project",
  "due",
];
