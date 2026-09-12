import { useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import {
  MoreHorizontal,
  ChevronRight,
  Pencil,
  Trash2,
  Box,
} from "lucide-react";
import {
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenu,
} from "@/components/ui/dropdown-menu";
import {
  CarouselPrevious,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  Carousel,
} from "@/components/ui/carousel";
import { EditProjectModal } from "../components/edit-project-modal";
import { ProjectLists } from "../components/project-lists";
import { AddTodoBar } from "../components/add-todo-bar";
import { PageShell } from "../components/page-shell";
import { TodoRow } from "../components/todo-row";
import { useTodos } from "../hooks/useTodos";
import { useLists } from "../hooks/useLists";
import { useDeleteProject, useProjects } from "../hooks/useProjects";
import { childProjects, projectTrail } from "../projects";
import type { View } from "../types";

export default function ProjectPage() {
  const { projectId } = useParams();
  const id = projectId!;
  const navigate = useNavigate();

  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();

  const [editOpen, setEditOpen] = useState(false);

  const view: View = { kind: "project", id };

  const { data: todos = [] } = useTodos(
    query ? { q: query } : { projectId: id },
  );
  const { data: lists = [] } = useLists();
  const { data: projects = [] } = useProjects();
  const deleteProject = useDeleteProject();

  const project = projects.find((p) => p.id === id) ?? null;
  const listsOfProject = lists.filter((l) => l.projectId === id);

  const rootTodos = query ? todos : todos.filter((t) => !t.listId);
  const subProjects = query ? [] : childProjects(projects, id);

  const handleDelete = () => {
    deleteProject.mutate(id);
    navigate("/");
  };

  const projectActions = project ? (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
            aria-label="Project actions"
          >
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem
            onClick={() => setEditOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-muted" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="gap-2 text-danger focus:bg-danger/10 focus:text-danger cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectModal
        project={project}
        allProjects={projects}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  ) : null;

  return (
    <PageShell
      title={query ? `Searching "${query}"` : (project?.name ?? "Project")}
      subtitle={query ? null : (project?.description ?? null)}
      actions={!query ? projectActions : null}
      trail={query ? [] : projectTrail(projects, id)}
      footer={query ? null : <AddTodoBar key={id} view={view} lists={lists} />}
    >
      {subProjects.length > 0 && (
        <div className="pl-3.5">
          <Carousel
            opts={{ align: "start", containScroll: "trimSnaps" }}
            className="mb-8"
            aria-label="Sub-projects"
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <h2 className="text-[13px] font-medium text-muted">Sub Projects</h2>
              <div className="flex items-center gap-1.5">
                <CarouselPrevious />
                <CarouselNext />
              </div>
            </div>

            <CarouselContent className="-ml-2.5">
              {subProjects.map((sub) => {
                return (
                  <CarouselItem
                    key={sub.id}
                    className="pl-2.5 basis-full sm:basis-1/2 xl:basis-1/3"
                  >
                    <Link
                      to={`/projects/${sub.id}`}
                      className="group flex flex-col gap-2 h-full p-3.5 rounded-xl bg-tint/5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid place-items-center w-7 h-7 shrink-0 rounded-lg bg-tint/5 text-muted">
                          <Box className="w-4 h-4" />
                        </span>
                        <span className="flex-1 min-w-0 truncate font-medium">
                          {sub.name}
                        </span>
                        <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {rootTodos.map((todo) => (
        <TodoRow key={todo.id} todo={todo} skipInvalidate />
      ))}

      {!query && (
        <ProjectLists
          key={id}
          projectId={id}
          lists={listsOfProject}
          todos={todos}
        />
      )}
    </PageShell>
  );
}
