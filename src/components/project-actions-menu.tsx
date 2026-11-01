import { useNavigate } from "react-router-dom";
import { Archive, ArchiveRestore, MoreHorizontal, Trash2 } from "lucide-react";
import { DeleteProjectDialog } from "./delete-project-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useArchiveProject,
  useDeleteProject,
  useUnarchiveProject,
} from "../hooks/useProjects";
import { isArchived } from "../projects";
import type { Project } from "../types";

type ProjectActionsMenuProps = {
  project: Project;
};

export function ProjectActionsMenu({ project }: ProjectActionsMenuProps) {
  const navigate = useNavigate();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();
  const deleteProject = useDeleteProject();
  const archived = isArchived(project);

  const onDelete = () => {
    deleteProject.mutate(project.id);
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Project actions"
          title="Project actions"
          className="grid place-items-center w-8 h-8 rounded-full bg-bg text-muted hover:text-fg data-[state=open]:text-fg transition-colors cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 px-0">
        <DropdownMenuItem
          onSelect={() =>
            archived
              ? unarchiveProject.mutate(project.id)
              : archiveProject.mutate(project.id)
          }
          className="gap-2 cursor-pointer rounded-none"
        >
          {archived ? (
            <ArchiveRestore className="w-4 h-4" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
          {archived ? "Unarchive project" : "Archive project"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteProjectDialog projectName={project.name} onConfirm={onDelete}>
          <DropdownMenuItem
            onSelect={(event) => event.preventDefault()}
            className="gap-2 cursor-pointer text-danger focus:text-danger rounded-none"
          >
            <Trash2 className="w-4 h-4" />
            Delete project
          </DropdownMenuItem>
        </DeleteProjectDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
