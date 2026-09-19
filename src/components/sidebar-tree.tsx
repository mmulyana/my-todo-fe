import { Box, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Link, useMatch } from "react-router-dom";
import { useState } from "react";
import { useProjects, useDeleteProject } from "../hooks/useProjects";
import { activeProjects, childProjects } from "../projects";
import { InlineProjectInput } from "./inline-project-input";
import type { Project } from "../types";
import { cn } from "@/lib/utils";

const ROW_ACTION_CLASS =
  "items-center justify-center w-5 h-5 shrink-0 rounded-md text-muted hover:bg-tint/10 hover:text-fg transition-colors cursor-pointer";

type TreeState = {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  childrenOf: (id: string) => Project[];
  deleteProject: (id: string) => void;
  projects: Project[];
};

type ProjectNodeProps = {
  project: Project;
  depth: number;
  tree: TreeState;
};
function ProjectNode({ project, depth, tree }: ProjectNodeProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const to = `/projects/${project.id}`;
  const active = Boolean(useMatch(to));
  const children = tree.childrenOf(project.id);
  const hasChildren = children.length > 0;
  const expanded = tree.isOpen(project.id);

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group/row flex items-center gap-1.5 px-2 h-8 rounded-lg relative text-sm transition-colors cursor-pointer hover:text-fg",
          active ? "bg-tint/5 text-fg font-medium" : "text-muted",
        )}
      >
        <span
          className="w-5 h-5 shrink-0 flex items-center justify-center text-muted"
          style={{ color: project.color ?? undefined }}
        >
          <Box size={18} strokeWidth={2} />
        </span>

        <Link to={to} className="flex-1 min-w-0 truncate">
          {project.name}
        </Link>

        <div className="flex gap-0.5">
          {depth < 3 && (
            <button
              type="button"
              className={cn(
                ROW_ACTION_CLASS,
                "hidden group-hover/row:inline-flex",
              )}
              aria-label={`Add sub-project to ${project.name}`}
              title="Add sub-project"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!expanded) tree.toggle(project.id);
                setCreateOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}

          {hasChildren && (
            <button
              type="button"
              className={cn(ROW_ACTION_CLASS, "inline-flex")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                tree.toggle(project.id);
              }}
              aria-expanded={expanded}
              aria-label={`${expanded ? "Collapse" : "Expand"} ${project.name}`}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {(expanded && hasChildren) || createOpen ? (
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
          {createOpen && (
            <InlineProjectInput
              parentId={project.id}
              onClose={() => setCreateOpen(false)}
              className="px-2.5"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarTree() {
  const { data: allProjects = [] } = useProjects();
  const projects = activeProjects(allProjects);
  const deleteProject = useDeleteProject();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [createRootOpen, setCreateRootOpen] = useState(false);

  const tree: TreeState = {
    isOpen: (id) => expandedIds.has(id),
    toggle: (id) =>
      setExpandedIds((prev) => {
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
          className="flex-1 flex items-center text-xs font-semibold text-muted hover:text-fg tracking-wider cursor-pointer transition-colors text-left"
        >
          <span>Projects</span>
        </button>

        <button
          type="button"
          onClick={() => setCreateRootOpen(true)}
          className={cn(ROW_ACTION_CLASS, "inline-flex")}
          aria-label="Create new project"
          title="Create"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {createRootOpen && (
          <InlineProjectInput
            onClose={() => setCreateRootOpen(false)}
            className="px-2.5"
          />
        )}
        {childProjects(projects, null).map((project) => (
          <ProjectNode
            key={project.id}
            project={project}
            depth={0}
            tree={tree}
          />
        ))}
      </div>
    </div>
  );
}
