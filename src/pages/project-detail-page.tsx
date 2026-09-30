import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArchiveRestore,
  Box,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { PageShell } from "../components/page-shell";
import { ProjectColorPicker } from "../components/project-color-picker";
import { InlineProjectInput } from "../components/inline-project-input";
import { AttachmentSection } from "../components/attachment-section";
import { DeleteProjectDialog } from "../components/delete-project-dialog";
import { DocumentSheet } from "../components/document-sheet";
import { MilestonesSection } from "../components/milestones-section";
import { useCreateDocument, useDocuments } from "../hooks/useDocuments";
import { useIsDesktop } from "../hooks/useMediaQuery";
import {
  useArchiveProject,
  useDeleteProject,
  useProjects,
  useUnarchiveProject,
  useUpdateProject,
} from "../hooks/useProjects";
import { childProjects, isArchived, projectTrail } from "../projects";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const id = projectId!;
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const { data: projects = [] } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();

  const project = projects.find((p) => p.id === id);

  const { data: documents = [] } = useDocuments(id);
  const createDocument = useCreateDocument();
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

  const [nameDraft, setNameDraft] = useState(project?.name ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(
    project?.description ?? "",
  );

  useEffect(() => {
    setNameDraft(project?.name ?? "");
  }, [project?.name]);

  useEffect(() => {
    setDescriptionDraft(project?.description ?? "");
  }, [project?.description]);

  if (!project) return null;

  const archived = isArchived(project);
  const subProjects = childProjects(projects, project.id);

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

  const headerActions = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={
          archived
            ? () => unarchiveProject.mutate(project.id)
            : () => archiveProject.mutate(project.id)
        }
        title={archived ? "Unarchive" : "Archive"}
        className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
      >
        {archived ? (
          <ArchiveRestore size={16} />
        ) : (
          <Archive size={16} />
        )}
      </button>
      <DeleteProjectDialog
        projectName={project.name}
        onConfirm={() => {
          deleteProject.mutate(project.id);
          navigate("/");
        }}
      >
        <button
          type="button"
          title="Delete"
          className="p-1 rounded-md text-muted hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </DeleteProjectDialog>
    </div>
  );

  return (
    <PageShell
      title={project.name}
      trail={projectTrail(projects, id)}
      backTo={`/projects/${project.id}`}
      backLabel="Back to project"
      actions={headerActions}
    >
      <div className="flex flex-col gap-8 w-full px-4 pb-6">
        <div className="flex items-start gap-4 max-w-4xl">
          <ProjectColorPicker
            color={project.color}
            onChange={(color) => updateProject.mutate({ id: project.id, color })}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-2">
              <input
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
                className="min-w-0 flex-1 bg-transparent border-none outline-none text-xl font-semibold text-fg placeholder:text-muted"
              />
              {archived && (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-tint/10 px-2 py-0.5 text-[11px] font-medium text-muted">
                  <Archive className="w-3 h-3" />
                  <span>Archived</span>
                </span>
              )}
            </div>
            <textarea
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
              rows={2}
              className="w-full bg-transparent border-none outline-none text-sm text-muted placeholder:text-muted resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              Milestones
            </h2>
            <MilestonesSection projectId={project.id} />
          </section>

          <div className="flex flex-col gap-8">
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                Sub-projects
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {subProjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => navigate(`/projects/${sub.id}/details`)}
                    className="group flex items-center gap-2 rounded-xl border border-line bg-raised/60 px-3 py-3 text-left hover:bg-raised transition-colors cursor-pointer"
                  >
                    <Box className="w-4 h-4 shrink-0 text-muted" />
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {sub.name}
                    </span>
                    {isArchived(sub) && (
                      <Archive className="w-3.5 h-3.5 shrink-0 text-muted" />
                    )}
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                <InlineProjectInput
                  parentId={project.id}
                  onClose={() => undefined}
                  autoFocus={false}
                  className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-3 text-muted"
                  leading={<Plus className="shrink-0" size={16} />}
                />
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                  Documents
                </h2>
                <button
                  type="button"
                  onClick={addDocument}
                  className="flex items-center gap-1 text-xs font-medium text-muted hover:text-fg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    className="group flex items-center gap-2 rounded-xl border border-line bg-raised/60 px-3 py-3 text-left hover:bg-raised transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 shrink-0 text-muted" />
                    <span className="flex-1 min-w-0 truncate text-sm">
                      {doc.title}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                {documents.length === 0 && (
                  <p className="col-span-full text-[13px] text-muted py-2">
                    No documents yet.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                Attachments
              </h2>
              <AttachmentSection
                projectId={project.id}
                attachments={project.attachments}
                tabbed
              />
            </section>
          </div>
        </div>
      </div>

      <DocumentSheet
        documentId={openDocumentId}
        project={project}
        onOpenChange={(open) => !open && setOpenDocumentId(null)}
      />
    </PageShell>
  );
}
