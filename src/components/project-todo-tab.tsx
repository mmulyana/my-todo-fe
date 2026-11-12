import { useMemo } from "react";
import { DesktopTodoInput } from "./desktop-todo-input";
import { ProjectLists } from "./project-lists";
import { ProjectListSkeleton } from "./project-page-skeleton";
import { useLists } from "../hooks/useLists";
import { useTodos } from "../hooks/useTodos";
import { useProjectTodoView } from "@/lib/project-todo-view";
import { applyFilters } from "@/lib/todo-filters";
import type { View } from "../types";

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

  const view = useMemo<View>(
    () => ({ kind: "project", id: projectId }),
    [projectId],
  );

  return (
    <>
      <DesktopTodoInput view={view} />
      {isLoading ? (
        <ProjectListSkeleton />
      ) : (
        <ProjectLists projectId={projectId} lists={lists} todos={visibleTodos} />
      )}
    </>
  );
}
