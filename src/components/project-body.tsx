import { ProjectHeading } from "./project-heading";
import { ProjectHeadingSkeleton } from "./project-page-skeleton";
import { ProjectTabsSection } from "./project-tabs-section";
import { ProjectTodoViewProvider } from "./project-todo-view-provider";
import type { Project } from "../types";

type ProjectBodyProps = {
  projectId: string;
  project: Project | null;
};

export function ProjectBody({ projectId, project }: ProjectBodyProps) {
  return (
    <ProjectTodoViewProvider projectId={projectId}>
      {project ? <ProjectHeading project={project} /> : <ProjectHeadingSkeleton />}
      <ProjectTabsSection projectId={projectId} project={project} />
    </ProjectTodoViewProvider>
  );
}
