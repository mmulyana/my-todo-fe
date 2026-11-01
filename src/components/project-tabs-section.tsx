import { useState, type ReactNode } from "react";
import { useQueryState } from "nuqs";
import { MilestonesSection } from "./milestones-section";
import { SubProjectList } from "./sub-project-list";
import { ProjectResources } from "./project-resources";
import { ProjectContentTabs } from "./project-tabs";
import { ProjectTodoTab } from "./project-todo-tab";
import { ProjectTodoToolbar } from "./project-todo-toolbar";
import { projectTabParser, type ProjectTab } from "@/lib/project-tabs";
import type { Project } from "../types";

type ProjectTabsSectionProps = {
  projectId: string;
  project: Project | null;
};

export function ProjectTabsSection({
  projectId,
  project,
}: ProjectTabsSectionProps) {
  const [tab, setTab] = useQueryState("tab", projectTabParser);
  const [visited, setVisited] = useState<Set<ProjectTab>>(() => new Set([tab]));
  if (!visited.has(tab)) setVisited(new Set(visited).add(tab));

  const panel = (id: ProjectTab, content: ReactNode) =>
    visited.has(id) && (
      <div className={tab === id ? "contents" : "hidden"}>
        {content}
      </div>
    );

  return (
    <>
      <div className="px-3 pb-4 pt-3">
        <ProjectContentTabs
          active={tab}
          onChange={setTab}
          actions={
            tab === "todo" ? <ProjectTodoToolbar projectId={projectId} /> : null
          }
        />
      </div>
      {panel("todo", <ProjectTodoTab projectId={projectId} />)}
      {panel("milestone", <MilestonesSection projectId={projectId} />)}
      {panel("project", <SubProjectList projectId={projectId} />)}
      {project && panel("resource", <ProjectResources project={project} />)}
    </>
  );
}
