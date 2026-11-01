import { useParams } from "react-router-dom";
import { Archive } from "lucide-react";
import { ProjectBody } from "../components/project-body";
import { ProjectActionsMenu } from "../components/project-actions-menu";
import { PageShell } from "../components/page-shell";
import {
  ProjectViewTabs,
  SHOW_VIEW_CONTROLS,
  readProjectView,
} from "../components/project-view-tabs";
import { TodoRow } from "../components/todo-row";
import { TodoListSkeleton } from "../components/todo-list-skeleton";
import { KanbanBoard } from "@/components/kanban-board";
import { useSearchParam } from "../hooks/useSearchParam";
import { useTodos } from "../hooks/useTodos";
import { useProjects } from "../hooks/useProjects";
import { isArchived, projectTrail } from "../projects";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
  const { projectId } = useParams();
  return <ProjectPageContent key={projectId} />;
}

function SearchResults({ query }: { query: string }) {
  const { data: todos = [], isLoading } = useTodos({ q: query });

  if (isLoading) return <TodoListSkeleton />;
  return todos.map((todo) => (
    <TodoRow key={todo.id} todo={todo} skipInvalidate />
  ));
}

function ProjectPageContent() {
  const { projectId } = useParams();
  const id = projectId!;

  const query = (useSearchParam("q") ?? "").trim();
  const viewParam = useSearchParam("view");
  const activeView: "list" | "kanban" = !SHOW_VIEW_CONTROLS
    ? "list"
    : viewParam === "kanban" || viewParam === "list"
      ? viewParam
      : readProjectView(id);

  const { data: projects = [] } = useProjects();
  const project = projects.find((p) => p.id === id) ?? null;
  const archived = project ? isArchived(project) : false;

  const projectActions = project ? (
    <div className="flex items-center gap-1 max-lg:gap-2">
      {archived && (
        <span className="inline-flex items-center gap-1 rounded-md bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-muted">
          <Archive className="w-3 h-3" />
          <span>Archived</span>
        </span>
      )}
      {SHOW_VIEW_CONTROLS && (
        <ProjectViewTabs projectId={id} active={activeView} />
      )}
      <ProjectActionsMenu project={project} />
    </div>
  ) : null;

  return (
    <PageShell
      title={query ? `Searching "${query}"` : (project?.name ?? "Project")}
      subtitle={query ? null : (project?.description ?? null)}
      actions={!query ? projectActions : null}
      newTaskProjectId={id}
      trail={query ? [] : projectTrail(projects, id)}
      footer={null}
      classNameChildren={cn(activeView === "kanban" && "pb-0 pr-0")}
      wide={activeView === "kanban" && !query}
    >
      {activeView === "kanban" && !query ? (
        <KanbanBoard projectId={id} hideCompleted={false} />
      ) : query ? (
        <SearchResults query={query} />
      ) : (
        <ProjectBody projectId={id} project={project} />
      )}
    </PageShell>
  );
}
