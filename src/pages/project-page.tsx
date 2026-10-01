import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Archive, Eye, EyeOff } from "lucide-react";
import { ProjectLists } from "../components/project-lists";
import { PageShell } from "../components/page-shell";
import {
  ProjectViewTabs,
  readProjectView,
} from "../components/project-view-tabs";
import { TodoRow } from "../components/todo-row";
import { KanbanBoard } from "@/components/kanban-board";
import { useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import { useProjects } from "../hooks/useProjects";
import { isArchived, projectTrail } from "../projects";
import { cn } from "@/lib/utils";

const hideCompletedKey = (projectId: string) => `hideCompleted:${projectId}`;

function readHideCompleted(projectId: string): boolean {
  try {
    return localStorage.getItem(hideCompletedKey(projectId)) === "1";
  } catch {
    return false;
  }
}

export default function ProjectPage() {
  const { projectId } = useParams();
  const id = projectId!;
  const [hideCompleted, setHideCompleted] = useState(() => readHideCompleted(id));

  useEffect(() => {
    setHideCompleted(readHideCompleted(id));
  }, [id]);

  const toggleHideCompleted = () => {
    setHideCompleted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(hideCompletedKey(id), next ? "1" : "0");
      } catch {
        // ignore (private mode / blocked storage)
      }
      return next;
    });
  };

  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const viewParam = params.get("view");
  const activeView: "list" | "kanban" =
    viewParam === "kanban" || viewParam === "list"
      ? viewParam
      : readProjectView(id);

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { projectId: id },
  );
  const { data: lists = [] } = useLists();
  const { data: projects = [] } = useProjects();

  const project = projects.find((p) => p.id === id) ?? null;
  const listsOfProject = lists.filter((l) => l.projectId === id);

  const rootTodos = query ? todos : todos.filter((t) => !t.listId);
  const visibleTodos = hideCompleted ? todos.filter((t) => !t.completed) : todos;

  const completedCount = todos.filter((t) => t.completed).length;

  const archived = project ? isArchived(project) : false;

  const projectActions = project ? (
    <div className="flex items-center gap-1 max-lg:gap-2">
      {archived && (
        <span className="inline-flex items-center gap-1 rounded-md bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-muted">
          <Archive className="w-3 h-3" />
          <span>Archived</span>
        </span>
      )}
      {activeView === "list" && completedCount > 0 && (
        <button
          type="button"
          onClick={toggleHideCompleted}
          aria-pressed={hideCompleted}
          title={hideCompleted ? "Show completed" : "Hide completed"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium transition-colors cursor-pointer max-lg:p-1.5",
            hideCompleted
              ? "text-fg bg-tint/10"
              : "text-muted hover:text-fg hover:bg-tint/5",
          )}
        >
          {hideCompleted ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="max-lg:hidden">
            {hideCompleted ? "Show completed" : "Hide completed"}
          </span>
        </button>
      )}
      <ProjectViewTabs projectId={id} active={activeView} />
    </div>
  ) : null;

  return (
    <>
      <PageShell
        title={query ? `Searching "${query}"` : (project?.name ?? "Project")}
        subtitle={query ? null : (project?.description ?? null)}
        actions={!query ? projectActions : null}
        trail={query ? [] : projectTrail(projects, id)}
        footer={null}
        classNameChildren={cn(activeView === "kanban" && "pb-0 pr-0")}
      >
        {activeView === "kanban" && !query ? (
          <KanbanBoard projectId={id} />
        ) : query ? (
          rootTodos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} skipInvalidate />
          ))
        ) : (
          <ProjectLists
            key={id}
            projectId={id}
            lists={listsOfProject}
            todos={visibleTodos}
          />
        )}
      </PageShell>

    </>
  );
}
