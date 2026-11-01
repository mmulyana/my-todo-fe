import type { ReactNode } from "react";
import { AttachmentSection } from "./attachment-section";
import { ProjectDocuments } from "./project-documents";
import { useDocuments } from "../hooks/useDocuments";
import type { Project } from "../types";

type ProjectResourcesProps = {
  project: Project;
};

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-[13px] font-medium text-fg">
        {title}
        {count > 0 && (
          <span className="text-[12px] font-normal tabular-nums text-muted">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

export function ProjectResources({ project }: ProjectResourcesProps) {
  const { data: documents = [] } = useDocuments(project.id);
  const linkCount = project.attachments.filter((a) => a.type === "LINK").length;
  const fileCount = project.attachments.length - linkCount;

  return (
    <div className="px-3">
      <div className="flex flex-col gap-8">
        <Group title="Documents" count={documents.length}>
          <ProjectDocuments project={project} />
        </Group>
        <Group title="Links" count={linkCount}>
          <AttachmentSection
            projectId={project.id}
            attachments={project.attachments}
            view="links"
          />
        </Group>
        <Group title="Files" count={fileCount}>
          <AttachmentSection
            projectId={project.id}
            attachments={project.attachments}
            view="files"
          />
        </Group>
      </div>
    </div>
  );
}
