import { useState } from "react";
import { useSearchParams, useParams } from "react-router-dom";
import { Archive } from "lucide-react";
import { MilestonesSection } from "../components/milestones-section";
import { SubProjectList } from "../components/sub-project-list";
import { ProjectResources } from "../components/project-resources";
import {
  ProjectContentTabs,
  parseProjectTab,
} from "../components/project-tabs";
import { ProjectLists } from "../components/project-lists";
import { ProjectTodoToolbar } from "../components/project-todo-toolbar";
import { ProjectActionsMenu } from "../components/project-actions-menu";
import { ReorderContext } from "@/lib/reorder";
import {
  applyFilters,
  loadFilters,
  saveFilters,
  type TodoFilters,
} from "@/lib/todo-filters";
import { ProjectHeading } from "../components/project-heading";
import { PageShell } from "../components/page-shell";
import {
  ProjectViewTabs,
  SHOW_VIEW_CONTROLS,
  readProjectView,
} from "../components/project-view-tabs";
import { TodoRow } from "../components/todo-row";
import { TodoListSkeleton } from "../components/todo-list-skeleton";
import {
  ProjectHeadingSkeleton,
  ProjectListSkeleton,
} from "../components/project-page-skeleton";
import { KanbanBoard } from "@/components/kanban-board";
import { useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import { useProjects } from "../hooks/useProjects";
import { useMilestones } from "../hooks/useMilestones";
import { isArchived, projectTrail } from "../projects";
import { cn } from "@/lib/utils";

// note: key per project supaya state halaman (tab, draft, filter) ikut di-reset saat pindah project
export default function ProjectPage() {
  const { projectId } = useParams();
  return <ProjectPageContent key={projectId} />;
}

function ProjectPageContent() {
  const { projectId } = useParams();
  const id = projectId!;
  const [reordering, setReordering] = useState(false);
  const [filters, setFiltersState] = useState(() => loadFilters(id));
  const setFilters = (next: TodoFilters) => {
    setFiltersState(next);
    saveFilters(id, next);
  };

  const [params, setParams] = useSearchParams();
  const tab = parseProjectTab(params.get("tab"));
  const setTab = (next: ReturnType<typeof parseProjectTab>) =>
    setParams(
      (prev) => {
        if (next === "todo") prev.delete("tab");
        else prev.set("tab", next);
        return prev;
      },
      { replace: true },
    );
  const query = (params.get("q") ?? "").trim();
  const viewParam = params.get("view");
  const activeView: "list" | "kanban" = !SHOW_VIEW_CONTROLS
    ? "list"
    : viewParam === "kanban" || viewParam === "list"
      ? viewParam
      : readProjectView(id);

  const { data: todos = [], isLoading } = useTodos(
    query ? { q: query } : { projectId: id },
  );
  const { data: lists = [] } = useLists();
  const { data: projects = [] } = useProjects();

  const project = projects.find((p) => p.id === id) ?? null;
  const listsOfProject = lists.filter((l) => l.projectId === id);

  const rootTodos = query ? todos : todos.filter((t) => !t.listId);
  const visibleTodos = applyFilters(todos, filters);
  const { data: milestones = [] } = useMilestones(id);

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
    <>
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
          isLoading ? (
            <TodoListSkeleton />
          ) : (
            rootTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} skipInvalidate />
            ))
          )
        ) : (
          <>
            {!project && <ProjectHeadingSkeleton />}
            {project && (
              <ProjectHeading project={project}>
                <ProjectContentTabs
                  active={tab}
                  onChange={setTab}
                  actions={
                    tab === "todo" ? (
                      <ProjectTodoToolbar
                        reordering={reordering}
                        onReorderingChange={setReordering}
                        todos={todos}
                        lists={listsOfProject}
                        milestones={milestones}
                        filters={filters}
                        onFiltersChange={setFilters}
                      />
                    ) : null
                  }
                />
              </ProjectHeading>
            )}
            {tab === "todo" &&
              (isLoading ? (
                <ProjectListSkeleton />
              ) : (
                <ReorderContext.Provider value={reordering}>
                  <ProjectLists
                    projectId={id}
                    lists={listsOfProject}
                    todos={visibleTodos}
                  />
                </ReorderContext.Provider>
              ))}
            {tab === "milestone" && <MilestonesSection projectId={id} />}
            {tab === "project" && <SubProjectList projectId={id} />}
            {tab === "resource" && project && (
              <ProjectResources project={project} />
            )}
          </>
        )}
      </PageShell>
    </>
  );
}
