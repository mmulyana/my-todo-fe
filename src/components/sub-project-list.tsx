import { Link } from "react-router-dom";
import { Box, Plus } from "lucide-react";
import { InlineProjectInput } from "./inline-project-input";
import { useProjects } from "../hooks/useProjects";
import { childProjects } from "../projects";

type SubProjectListProps = {
  projectId: string;
};

export function SubProjectList({ projectId }: SubProjectListProps) {
  const { data: projects = [] } = useProjects();
  const subProjects = childProjects(projects, projectId);

  return (
    <div className="px-3">
      <div className="flex flex-col rounded-xl border border-line divide-y divide-line overflow-hidden">
        {subProjects.map((sub) => (
          <Link
            key={sub.id}
            to={`/projects/${sub.id}`}
            className="flex h-10 items-center gap-2.5 px-3 hover:bg-tint/5 transition-colors"
          >
            <Box
              className="w-4 h-4 shrink-0 text-muted"
              style={{ color: sub.color ?? undefined }}
            />
            <span className="flex-1 min-w-0 truncate text-sm">{sub.name}</span>
          </Link>
        ))}
        <InlineProjectInput
          parentId={projectId}
          onClose={() => undefined}
          autoFocus={false}
          className="flex h-10 items-center gap-2 px-3 text-muted"
          leading={<Plus className="shrink-0" size={14} />}
        />
      </div>
    </div>
  );
}
