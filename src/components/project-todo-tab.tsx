import { useMemo } from "react";
import { ProjectLists } from "./project-lists";
import { ProjectListSkeleton } from "./project-page-skeleton";
import { useLists } from "../hooks/useLists";
import { useTodos } from "../hooks/useTodos";
import { useProjectTodoView } from "@/lib/project-todo-view";
import { applyFilters } from "@/lib/todo-filters";

export function ProjectTodoTab({ projectId }: { projectId: string }) {
  const { filters } = useProjectTodoView();
  const { data: todos = [], isLoading } = useTodos({ projectId });
  const { data: allLists = [] } = useLists();

  const lists = useMemo(
    () => allLists.filter((list) => list.projectId === projectId),
    [allLists, projectId],
  );
  const visibleTodos = useMemo(
    () => applyFilters(todos, filters),
    [todos, filters],
  );

  if (isLoading) return <ProjectListSkeleton />;

  return (
    <ProjectLists projectId={projectId} lists={lists} todos={visibleTodos} />
  );
}
