import { useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useDeleteProject, useProjects } from "../hooks/useProjects";
import { childProjects } from "../projects";
import type { Project } from "../types";
import {
  Box,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditProjectModal } from "./edit-project-modal";
import { CreateProjectModal } from "./create-project-modal";
import { cn } from "@/lib/utils";

type TreeState = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  childrenOf: (id: string) => Project[];
  deleteProject: (id: string) => void;
  projects: Project[];
};

function ProjectNode({
  project,
  depth,
  tree,
}: {
  project: Project;
  depth: number;
  tree: TreeState;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const to = `/projects/${project.id}`;
  const active = Boolean(useMatch(to));
  const children = tree.childrenOf(project.id);
  const hasChildren = children.length > 0;
  const expanded = hasChildren && tree.isOpen(project.id);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group/row flex items-center gap-2 px-2.5 h-8 rounded-lg relative text-sm transition-colors cursor-pointer",
          active
            ? "bg-white/10 text-fg font-medium"
            : "text-muted hover:text-fg hover:bg-white/5",
        )}
      >
        <span className="w-5 h-5 shrink-0 flex items-center justify-center text-muted">
          <Box size={18} strokeWidth={2} />
        </span>

        <Link to={to} className="flex-1 min-w-0 truncate">
          {project.name}
        </Link>

        {depth < 3 && (
          <button
            type="button"
            className="hidden group-hover/row:inline-flex items-center justify-center w-5 h-5 rounded-md text-muted hover:bg-white/10 hover:text-fg cursor-pointer"
            aria-label={`Add sub-project to ${project.name}`}
            title="Add sub-project"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="hidden group-hover/row:inline-flex items-center justify-center w-5 h-5 rounded-md text-muted hover:bg-white/10 hover:text-fg data-[state=open]:inline-flex data-[state=open]:bg-white/10 cursor-pointer"
              aria-label={`Actions for ${project.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="gap-2 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-muted" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                tree.deleteProject(project.id);
              }}
              className="gap-2 text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasChildren && (
          <button
            type="button"
            className="grid place-items-center w-5 h-5 shrink-0 text-muted hover:text-fg transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              tree.toggle(project.id);
            }}
            aria-expanded={expanded}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${project.name}`}
          >
            {expanded ? (
              <ChevronDown size={14} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} strokeWidth={2} />
            )}
          </button>
        )}

        <EditProjectModal
          project={project}
          allProjects={tree.projects}
          open={editOpen}
          onOpenChange={setEditOpen}
        />

        <CreateProjectModal
          defaultParentId={project.id}
          allProjects={tree.projects}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={() => {
            if (!expanded && hasChildren) {
              tree.toggle(project.id);
            }
          }}
        />
      </div>

      {expanded && (
        <div
          className={cn(
            "ml-4 pl-2 border-l border-line/60 flex flex-col gap-0.5 my-0.5",
            active && "border-accent",
          )}
        >
          {children.map((child) => (
            <ProjectNode
              key={child.id}
              project={child}
              depth={depth + 1}
              tree={tree}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarTree() {
  const { data: projects = [] } = useProjects();
  const deleteProject = useDeleteProject();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sectionOpen, setSectionOpen] = useState(true);
  const [createRootOpen, setCreateRootOpen] = useState(false);

  const tree: TreeState = {
    isOpen: (id) => !collapsed.has(id),
    toggle: (id) =>
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    childrenOf: (id) => childProjects(projects, id),
    deleteProject: (id) => deleteProject.mutate(id),
    projects,
  };

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <button
          type="button"
          onClick={() => setSectionOpen((v) => !v)}
          className="flex-1 flex items-center text-xs font-semibold text-muted hover:text-fg tracking-wider cursor-pointer transition-colors text-left"
        >
          <span>Projects</span>
        </button>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setCreateRootOpen(true)}
            className="p-1 rounded text-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Create new project"
            title="Create"
          >
            <Plus size={14} strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setSectionOpen((v) => !v)}
            className="p-1 rounded text-muted hover:text-fg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={sectionOpen ? "Collapse projects" : "Expand projects"}
          >
            {sectionOpen ? (
              <ChevronDown size={14} strokeWidth={2} />
            ) : (
              <ChevronRight size={14} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      <CreateProjectModal
        allProjects={projects}
        open={createRootOpen}
        onOpenChange={setCreateRootOpen}
        onSuccess={() => setSectionOpen(true)}
      />

      {sectionOpen && (
        <div className="flex flex-col gap-0.5">
          {childProjects(projects, null).map((project) => (
            <ProjectNode
              key={project.id}
              project={project}
              depth={0}
              tree={tree}
            />
          ))}
        </div>
      )}
    </div>
  );
}
