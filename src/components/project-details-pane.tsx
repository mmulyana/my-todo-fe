import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Archive,
  ArchiveRestore,
  Box,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { DocumentSheet } from "./document-sheet";
import { useCreateDocument, useDocuments } from "../hooks/useDocuments";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useProjects, useUpdateProject } from "../hooks/useProjects";
import { childProjects, isArchived, projectTrail } from "../projects";
import type { Project } from "../types";
import { InlineProjectInput } from "./inline-project-input";
import { AttachmentSection } from "./attachment-section";
import { ProjectColorPicker } from "./project-color-picker";

type ProjectDetailsPaneProps = {
  project: Project;
  onClose: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onOpenProject?: (projectId: string) => void;
};

function ProjectDetailsContent({
  project,
  onClose,
  onDelete,
  onArchive,
  onUnarchive,
  onOpenProject,
}: ProjectDetailsPaneProps) {
  const updateProject = useUpdateProject();
  const { data: projects = [] } = useProjects();
  const archived = isArchived(project);
  const subProjects = childProjects(projects, project.id);
  const trail = projectTrail(projects, project.id);

  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { data: documents = [] } = useDocuments(project.id);
  const createDocument = useCreateDocument();
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  const openProject = (projectId: string) => {
    if (onOpenProject) {
      onOpenProject(projectId);
      return;
    }
    navigate(`/projects/${projectId}`);
  };

  const openDocument = (documentId: string) => {
    if (isDesktop) {
      setOpenDocumentId(documentId);
      return;
    }
    navigate(`/projects/${project.id}/documents/${documentId}`);
  };

  const addDocument = () => {
    createDocument.mutate(
      { title: "Untitled", projectId: project.id },
      {
        onSuccess: (created) => {
          const doc = created as { id: string };
          if (doc?.id) openDocument(doc.id);
        },
      },
    );
  };

  const [nameDraft, setNameDraft] = useState(project.name);
  const [descriptionDraft, setDescriptionDraft] = useState(
    project.description ?? "",
  );

  useEffect(() => {
    setNameDraft(project.name);
  }, [project.name]);

  useEffect(() => {
    setDescriptionDraft(project.description ?? "");
  }, [project.description]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameDraft(project.name);
      return;
    }
    if (trimmed === project.name) return;
    updateProject.mutate({ id: project.id, name: trimmed });
  };

  const commitDescription = () => {
    const trimmed = descriptionDraft.trim();
    if (trimmed === (project.description ?? "")) return;
    updateProject.mutate({ id: project.id, description: trimmed || null });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 h-[46px] px-4 border-b border-line flex items-center justify-between gap-2 w-full">
        {trail.length > 0 && (
          <nav
            aria-label="Parent projects"
            className="flex min-w-0 items-center gap-1 text-sm text-muted"
          >
            {trail.map((ancestor) => (
              <span
                key={ancestor.id}
                className="flex min-w-0 shrink items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => openProject(ancestor.id)}
                  title={ancestor.name}
                  className="max-w-28 truncate rounded px-1 hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
                >
                  {ancestor.name}
                </button>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </span>
            ))}
            <span
              className="min-w-0 truncate px-1 text-fg"
              aria-current="page"
              title={project.name}
            >
              {project.name}
            </span>
          </nav>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project details"
          className="ml-auto bg-tint/5 flex items-center gap-0.5 text-muted hover:text-fg rounded-full p-1.5 hover:bg-tint/5 transition-colors cursor-pointer"
          title="Close details"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4">
      <div className="flex flex-col items-center text-center gap-1">
        <ProjectColorPicker
          color={project.color}
          onChange={(color) => updateProject.mutate({ id: project.id, color })}
        />

        {archived && (
          <span className="inline-flex items-center gap-1 rounded-md bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-muted">
            <Archive className="w-3 h-3" />
            <span>Archived</span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 mt-4">
        <div className="rounded-xl bg-tint/8 px-3.5 py-3 flex flex-col">
          <label htmlFor="project-name" className="text-xs text-muted">
            Name
          </label>
          <input
            id="project-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitName();
                e.currentTarget.blur();
              }
            }}
            placeholder="Project name..."
            aria-label="Project name"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-fg placeholder:text-muted"
          />
        </div>

        <div className="rounded-xl bg-tint/8 px-3.5 py-3">
          <label htmlFor="project-description" className="text-xs text-muted">
            Description
          </label>
          <textarea
            id="project-description"
            value={descriptionDraft}
            onChange={(e) => setDescriptionDraft(e.target.value)}
            onBlur={commitDescription}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitDescription();
                e.currentTarget.blur();
              }
            }}
            placeholder="What is this project about?"
            rows={4}
            className="mt-1.5 w-full bg-transparent border-none outline-none text-sm text-fg placeholder:text-muted resize-none"
          />
        </div>
      </div>

      <Tabs defaultValue="projects" className="mt-4">
        <TabsList className="w-fit">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="flex flex-col">
          {subProjects.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => openProject(sub.id)}
              className="group flex items-center gap-2.5 py-2 rounded-lg hover:text-fg transition-colors"
            >
              <Box className="w-4 h-4 shrink-0 text-muted" />
              <span className="flex-1 min-w-0 truncate text-sm">
                {sub.name}
              </span>
              {isArchived(sub) && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-tint/10 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  <Archive className="w-2.5 h-2.5" />
                  <span>Archived</span>
                </span>
              )}
              <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          <InlineProjectInput
            parentId={project.id}
            onClose={() => undefined}
            autoFocus={false}
            className="flex items-center gap-2 py-2 text-muted"
            leading={
              <div className="shrink-0 w-4 flex justify-center">
                <Plus className="shrink-0" size={15} />
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="documents" className="flex flex-col">
          <button
            type="button"
            onClick={addDocument}
            className="flex items-center gap-2.5 py-2 text-sm text-muted hover:text-fg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>New document</span>
          </button>

          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={() => openDocument(doc.id)}
              className="group flex items-center gap-2.5 py-2 text-left hover:text-fg transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 shrink-0 text-muted" />
              <span className="flex-1 min-w-0 truncate text-sm">
                {doc.title}
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {documents.length === 0 && (
            <p className="text-[13px] text-muted py-6 text-center">
              No documents yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="attachments" className="pt-2">
          <AttachmentSection
            projectId={project.id}
            attachments={project.attachments}
            view="links"
          />
        </TabsContent>

        <TabsContent value="files" className="pt-2">
          <AttachmentSection
            projectId={project.id}
            attachments={project.attachments}
            view="files"
          />
        </TabsContent>
      </Tabs>

      <DocumentSheet
        documentId={openDocumentId}
        project={project}
        onOpenChange={(open) => !open && setOpenDocumentId(null)}
      />

      <div className="pb-4 mt-auto flex flex-col gap-1 text-xs">
        <button
          type="button"
          onClick={archived ? onUnarchive : onArchive}
          className="w-full justify-center rounded-lg flex items-center gap-1.5 px-2 py-2 text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer font-medium"
        >
          {archived ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
          <span>{archived ? "Unarchive" : "Archive"}</span>
        </button>

        <DeleteProjectDialog projectName={project.name} onConfirm={onDelete}>
          <button
            type="button"
            className="w-full justify-center rounded-lg flex items-center gap-1.5 px-2 py-2 text-danger hover:bg-danger/5 transition-colors cursor-pointer font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </DeleteProjectDialog>
      </div>
      </div>
    </div>
  );
}

export function ProjectDetailsPane(props: ProjectDetailsPaneProps) {
  return (
    <aside className="hidden lg:flex flex-col min-h-0 w-110 shrink-0 animate-in fade-in-0 slide-in-from-right-4 duration-200 ease-out">
      <div className="flex min-h-0 flex-1 flex-col">
        <ProjectDetailsContent {...props} />
      </div>
    </aside>
  );
}

export function ProjectDetailsSheet({
  open,
  project,
  ...props
}: ProjectDetailsPaneProps & { open: boolean }) {
  const [currentId, setCurrentId] = useState(project.id);
  const { data: projects = [] } = useProjects();
  const currentProject = projects.find((candidate) => candidate.id === currentId);

  if (!currentProject) return null;

  return (
    <Sheet open={open} onOpenChange={(next) => !next && props.onClose()}>
      <SheetContent
        hideClose
        aria-describedby={undefined}
        className="overflow-hidden border-0 bg-transparent p-3 shadow-none sm:max-w-[440px] lg:max-w-[480px]"
      >
        <SheetTitle className="sr-only">Project details</SheetTitle>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-surface p-0 shadow-lg">
          <ProjectDetailsContent
            key={currentId}
            {...props}
            project={currentProject}
            onOpenProject={setCurrentId}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
