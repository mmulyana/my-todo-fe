import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";
import { projectDetailsAtom } from "../atoms/panes";
import {
  Archive,
  Eye,
  EyeOff,
  KanbanSquare,
  List,
  MoreHorizontal,
} from "lucide-react";
import { ProjectDetailsSheet } from "../components/project-details-pane";
import { ProjectLists } from "../components/project-lists";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { KanbanBoard } from "@/components/kanban-board";
import { useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import {
  useProjects,
  useArchiveProject,
  useDeleteProject,
  useUnarchiveProject,
} from "../hooks/useProjects";
import { isArchived, projectTrail } from "../projects";
import { cn } from "@/lib/utils";

const tabClass =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 max-lg:py-1.5 py-0.5 text-[13px] font-medium transition-colors cursor-pointer hover:text-fg focus-visible:outline-none";
const activeTabClass = "bg-tab-active text-tab-active-fg";

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
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"list" | "kanban">("list");
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

  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const openTodoId = params.get("todo");

  const [detailsProjectId, setDetailsProjectId] = useAtom(projectDetailsAtom);
  const detailsOpen = detailsProjectId === id && !openTodoId;

  const toggleDetails = () => {
    if (detailsOpen) {
      setDetailsProjectId(null);
      return;
    }
    setParams(
      (prev) => {
        prev.delete("todo");
        return prev;
      },
      { replace: true },
    );
    setDetailsProjectId(id);
  };

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { projectId: id },
  );
  const { data: lists = [] } = useLists();
  const { data: projects = [] } = useProjects();
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();

  const project = projects.find((p) => p.id === id) ?? null;
  const listsOfProject = lists.filter((l) => l.projectId === id);

  const rootTodos = query ? todos : todos.filter((t) => !t.listId);
  const visibleTodos = hideCompleted ? todos.filter((t) => !t.completed) : todos;

  const archived = project ? isArchived(project) : false;

  const handleDelete = () => {
    deleteProject.mutate(id);
    navigate("/");
  };

  const handleArchive = () => {
    archiveProject.mutate(id);
  };

  const handleUnarchive = () => {
    unarchiveProject.mutate(id);
  };

  const projectActions = project ? (
    <div className="flex items-center gap-1 max-lg:gap-2">
      {archived && (
        <span className="inline-flex items-center gap-1 rounded-md bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-muted">
          <Archive className="w-3 h-3" />
          <span>Archived</span>
        </span>
      )}
      <div className="inline-flex items-center gap-1 rounded-lg bg-tab-track p-1 text-muted">
        <button
          type="button"
          onClick={() => setActiveView("list")}
          aria-pressed={activeView === "list"}
          className={cn(tabClass, activeView === "list" && activeTabClass)}
        >
          <List className="h-3.5 w-3.5" />
          <span className="max-lg:hidden">List</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView("kanban")}
          aria-pressed={activeView === "kanban"}
          className={cn(tabClass, activeView === "kanban" && activeTabClass)}
        >
          <KanbanSquare className="h-3.5 w-3.5" />
          <span className="max-lg:hidden">Kanban</span>
        </button>
      </div>
      {activeView === "list" && (
        <button
          type="button"
          onClick={toggleHideCompleted}
          aria-pressed={hideCompleted}
          title={hideCompleted ? "Show completed" : "Hide completed"}
          className={cn(
            "p-1 rounded-md transition-colors cursor-pointer",
            hideCompleted
              ? "text-fg bg-tint/10"
              : "text-muted hover:text-fg hover:bg-tint/5",
          )}
        >
          {hideCompleted ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={toggleDetails}
        className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
        aria-label="Project details"
        aria-expanded={detailsOpen}
      >
        <MoreHorizontal size={16} />
      </button>
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

      {project && !query && (
        <ProjectDetailsSheet
          key={id}
          open={detailsOpen}
          project={project}
          onClose={() => setDetailsProjectId(null)}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
        />
      )}
    </>
  );
}
