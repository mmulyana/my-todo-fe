import {
  Box,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Info,
  Plus,
} from "lucide-react";
import { Link, useMatch } from "react-router-dom";
import { useState } from "react";
import { DragDropProvider, useDragOperation } from "@dnd-kit/react";
import { pointerIntersection } from "@dnd-kit/collision";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import {
  useProjects,
  useDeleteProject,
  useUpdateProject,
} from "../hooks/useProjects";
import {
  activeProjects,
  childProjects,
  projectTrail,
  subtreeIds,
} from "../projects";
import { InlineProjectInput } from "./inline-project-input";
import type { Project } from "../types";
import { cn } from "@/lib/utils";

const ROOT_GROUP = "__root__";
const PROJECT_TYPE = "project";
const MAX_PARENT_DEPTH = 3;

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
  index: number;
  depth: number;
  tree: TreeState;
};
// note: useDragOperation sengaja di komponen terpisah, re-render ProjectNode me-reset index sortable dan bikin reorder sibling gagal
function ChildrenBox({
  parentId,
  projects,
  className,
  children,
}: {
  parentId: string;
  projects: Project[];
  className?: string;
  children: React.ReactNode;
}) {
  const { source, target } = useDragOperation();
  const sourceProject = projects.find((p) => p.id === String(source?.id));
  const targetProject = projects.find((p) => p.id === String(target?.id));
  const dropInto =
    Boolean(sourceProject) &&
    targetProject?.parentId === parentId &&
    sourceProject?.parentId !== parentId;

  return (
    <div
      className={cn(
        "ml-4 pl-2 border-l border-line/60 flex flex-col gap-0.5 my-0.5 transition-colors",
        className,
        dropInto && "bg-tint/10",
      )}
    >
      {children}
    </div>
  );
}

function ProjectNode({ project, index, depth, tree }: ProjectNodeProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const group = project.parentId ?? ROOT_GROUP;
  const { ref, handleRef, isDragging } = useSortable({
    id: project.id,
    index,
    group,
    type: PROJECT_TYPE,
    accept: PROJECT_TYPE,
    // note: wrapper parent membungkus semua anaknya, jadi anak yang lebih dalam harus menang di collision
    collisionPriority: depth + 1,
    // note: berbasis pointer, bukan rect asli item yang di-drag, biar promote ke parent lebih tinggi nggak ketipu
    collisionDetector: pointerIntersection,
  });
  const to = `/projects/${project.id}`;
  const detailsTo = `${to}/details`;
  // note: evaluate both matches every render, a short-circuited useMatch() changes the hook count and crashes React (#310)
  const projectMatch = useMatch(to);
  const detailsMatch = useMatch(detailsTo);
  const active = Boolean(projectMatch) || Boolean(detailsMatch);
  const children = tree.childrenOf(project.id);
  const hasChildren = children.length > 0;
  const expanded = tree.isOpen(project.id);
  return (
    <div
      ref={ref}
      className={cn("flex flex-col rounded-lg", isDragging && "opacity-60")}
    >
      <div
        className={cn(
          "group/row flex items-center gap-1.5 px-2 h-8 rounded-lg relative text-[15px] transition-colors cursor-pointer hover:text-fg",
          active ? "bg-tint/5 text-fg font-medium" : "text-muted",
        )}
      >
        <span
          ref={handleRef}
          className="group/icon w-5 h-5 shrink-0 flex items-center justify-center text-muted touch-none pointer-fine:hover:cursor-grab pointer-fine:active:cursor-grabbing"
          style={{ color: project.color ?? undefined }}
          title="Drag to reorder"
        >
          <Box
            size={18}
            strokeWidth={2}
            className="pointer-fine:group-hover/icon:hidden"
          />
          <GripVertical
            size={18}
            strokeWidth={2}
            className="hidden pointer-fine:group-hover/icon:block"
          />
        </span>

        <Link to={to} className="flex-1 min-w-0 truncate">
          {project.name}
        </Link>

        <div className="flex gap-0.5">
          <Link
            to={detailsTo}
            className={cn(
              ROW_ACTION_CLASS,
              "inline-flex lg:hidden lg:group-hover/row:inline-flex",
            )}
            aria-label={`${project.name} details`}
            title="Project details"
          >
            <Info className="h-3.5 w-3.5" />
          </Link>

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
        <ChildrenBox
          parentId={project.id}
          projects={tree.projects}
          className={cn(active && "border-accent")}
        >
          {children.map((child, i) => (
            <ProjectNode
              key={child.id}
              project={child}
              index={i}
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
        </ChildrenBox>
      ) : null}
    </div>
  );
}

export function SidebarTree() {
  const { data: allProjects = [] } = useProjects();
  const projects = activeProjects(allProjects);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
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

  // note: float position = titik tengah dua tetangga, jadi cukup satu update tanpa menggeser project lain
  const handleDragEnd: React.ComponentProps<
    typeof DragDropProvider
  >["onDragEnd"] = (event) => {
    if (event.canceled) return;
    const { source } = event.operation;
    if (!isSortable(source)) return;

    const id = String(source.id);
    const dragged = projects.find((p) => p.id === id);
    if (!dragged) return;

    let parentId: string | null;
    let position: number;

    const targetProject = event.operation.target
      ? projects.find((p) => p.id === String(event.operation.target?.id))
      : undefined;

    if (!event.operation.target) {
      if (dragged.parentId === null) return;
      parentId = null;
      position =
        childProjects(projects, null).reduce(
          (max, p) => Math.max(max, p.position),
          -1,
        ) + 1;
    } else if (
      targetProject &&
      targetProject.id !== id &&
      targetProject.parentId !== dragged.parentId
    ) {
      parentId = targetProject.parentId;
      const others = childProjects(projects, parentId).filter(
        (p) => p.id !== id,
      );
      const at = others.findIndex((p) => p.id === targetProject.id);
      const prev = others[at - 1];
      position = prev
        ? (prev.position + targetProject.position) / 2
        : targetProject.position - 1;
    } else {
      if (source.index === source.initialIndex) return;
      parentId = dragged.parentId;
      const others = childProjects(projects, parentId).filter(
        (p) => p.id !== id,
      );
      const prev = others[source.index - 1];
      const next = others[source.index];
      position =
        prev && next
          ? (prev.position + next.position) / 2
          : prev
            ? prev.position + 1
            : next
              ? next.position - 1
              : 0;
    }

    if (parentId !== null) {
      // note: nggak boleh masuk ke dirinya sendiri / turunannya, dan kedalaman dibatasi sama seperti tombol "+"
      if (subtreeIds(projects, id).has(parentId)) return;
      if (projectTrail(projects, parentId).length >= MAX_PARENT_DEPTH) return;
    }

    updateProject.mutate({
      id,
      position,
      ...(parentId !== dragged.parentId ? { parentId } : {}),
    });
  };

  return (
    <div className="flex flex-col mt-6">
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <button
          type="button"
          className="flex-1 flex items-center text-[15px] font-medium text-muted hover:text-fg cursor-pointer transition-colors text-left"
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
        <DragDropProvider
          onDragOver={(event) => {
            // note: cegah dnd-kit mindahin DOM antar-parent sendiri, bentrok sama React (removeChild error); pindah parent diproses saat drop
            const { source, target } = event.operation;
            if (
              isSortable(source) &&
              isSortable(target) &&
              source.group !== target.group
            )
              event.preventDefault();
          }}
          onDragEnd={handleDragEnd}
        >
          {childProjects(projects, null).map((project, i) => (
            <ProjectNode
              key={project.id}
              project={project}
              index={i}
              depth={0}
              tree={tree}
            />
          ))}
        </DragDropProvider>
      </div>
    </div>
  );
}
