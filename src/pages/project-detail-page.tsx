import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Archive,
  ArchiveRestore,
  Box,
  ChevronRight,
  File,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { PageShell } from "../components/page-shell";
import { ProjectViewTabs } from "../components/project-view-tabs";
import { ProjectColorPicker } from "../components/project-color-picker";
import { InlineProjectInput } from "../components/inline-project-input";
import { AttachmentSection } from "../components/attachment-section";
import { DeleteProjectDialog } from "../components/delete-project-dialog";
import { DocumentSheet } from "../components/document-sheet";
import { MilestonesSection } from "../components/milestones-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateDocument, useDocuments } from "../hooks/useDocuments";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { useTodos } from "../hooks/useTodos";
import {
  useArchiveProject,
  useDeleteProject,
  useProjects,
  useUnarchiveProject,
  useUpdateProject,
} from "../hooks/useProjects";
import {
  childProjects,
  flattenProjects,
  isArchived,
  projectIndent,
  projectTrail,
  subtreeIds,
} from "../projects";
import type { Project } from "../types";
import { cn } from "@/lib/utils";

const NO_PARENT = "__none";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const id = projectId!;
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const { data: projects = [] } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

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
    <ProjectViewTabs projectId={project.id} active="overview" />
  );

  const onDelete = () => {
    deleteProject.mutate(project.id);
    navigate("/");
  };

  return (
    <PageShell
      title={project.name}
      trail={projectTrail(projects, id)}
      backTo={`/projects/${project.id}`}
      backLabel="Back to project"
      actions={headerActions}
      classNameChildren="p-0 [&>div]:min-h-full"
    >
      <div className="grid w-full grid-cols-[minmax(0,42rem)] justify-center gap-x-12 gap-y-10 px-5 py-8 lg:px-10 lg:py-12 xl:grid-cols-[minmax(0,42rem)_15rem]">
        <div className="flex min-w-0 flex-col gap-10">
          {archived && (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-tint/[0.03] px-3 py-2 text-[13px] text-muted">
              <Archive className="w-3.5 h-3.5 shrink-0" />
              <span>This project is archived and hidden from the sidebar.</span>
            </div>
          )}

          <header className="flex flex-col gap-3">
            <ProjectColorPicker
              color={project.color}
              onChange={(color) =>
                updateProject.mutate({ id: project.id, color })
              }
            >
              <button
                type="button"
                aria-label="Choose project color"
                className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-raised/60 hover:bg-raised transition-colors cursor-pointer"
              >
                <Box
                  className="h-5 w-5 text-muted"
                  style={{ color: project.color ?? undefined }}
                />
              </button>
            </ProjectColorPicker>

            <textarea
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
              rows={1}
              placeholder="Project name"
              aria-label="Project name"
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none field-sizing-content text-[28px] leading-tight font-semibold tracking-[-0.02em] text-fg placeholder:text-muted"
            />

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
              rows={1}
              placeholder="Add a short summary..."
              aria-label="Project summary"
              className="w-full resize-none overflow-hidden bg-transparent border-none outline-none field-sizing-content text-[15px] text-muted placeholder:text-muted/70"
            />
          </header>

          <div className="xl:hidden rounded-xl border border-line p-4">
            <ProjectProperties
              project={project}
              projects={projects}
              onDelete={onDelete}
            />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-10 xl:col-start-1 xl:row-start-2">
          <Section title="Milestones">
            <MilestonesSection projectId={project.id} />
          </Section>

          <Section title="Sub-projects" count={subProjects.length}>
            <RowGroup>
              {subProjects.map((sub) => (
                <Row
                  key={sub.id}
                  onClick={() => navigate(`/projects/${sub.id}/details`)}
                >
                  <Box
                    className="w-4 h-4 shrink-0 text-muted"
                    style={{ color: sub.color ?? undefined }}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {sub.name}
                  </span>
                  {isArchived(sub) && <StatusPill archived />}
                  <ChevronRight className="w-4 h-4 shrink-0 text-muted opacity-0 group-hover/row:opacity-100 transition-opacity" />
                </Row>
              ))}
              <InlineProjectInput
                parentId={project.id}
                onClose={() => undefined}
                autoFocus={false}
                className="flex h-10 items-center gap-2 px-3 text-muted"
                leading={<Plus className="shrink-0" size={14} />}
              />
            </RowGroup>
          </Section>

          <Section
            title="Resources"
            count={project.attachments.length + documents.length}
          >
            <Tabs defaultValue="documents">
              <TabsList className="w-fit bg-tint/5 rounded-lg">
                <TabsTrigger value="documents" className="gap-1">
                  <FileText size={12} />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="links" className="gap-1">
                  <LinkIcon size={12} />
                  Links
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-1">
                  <File size={12} />
                  Files
                </TabsTrigger>
              </TabsList>
              <TabsContent value="documents">
                <RowGroup>
                  {documents.map((doc) => (
                    <Row key={doc.id} onClick={() => openDocument(doc.id)}>
                      <FileText className="w-4 h-4 shrink-0 text-muted" />
                      <span className="flex-1 min-w-0 truncate text-sm">
                        {doc.title || "Untitled"}
                      </span>
                      <span className="shrink-0 text-[12px] text-muted">
                        {formatDistanceToNow(new Date(doc.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </Row>
                  ))}
                  <button
                    type="button"
                    onClick={addDocument}
                    className="flex h-10 items-center gap-2 px-3 text-sm text-muted hover:text-fg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {documents.length === 0
                        ? "Write the first document"
                        : "New document"}
                    </span>
                  </button>
                </RowGroup>
              </TabsContent>
              <TabsContent value="links">
                <AttachmentSection
                  projectId={project.id}
                  attachments={project.attachments}
                  view="links"
                />
              </TabsContent>
              <TabsContent value="files">
                <AttachmentSection
                  projectId={project.id}
                  attachments={project.attachments}
                  view="files"
                />
              </TabsContent>
            </Tabs>
          </Section>
        </div>

        <aside className="sticky top-4 hidden self-start xl:col-start-2 xl:row-start-2 xl:block">
          <ProjectProperties
            project={project}
            projects={projects}
            onDelete={onDelete}
          />
        </aside>
      </div>

      <DocumentSheet
        documentId={openDocumentId}
        project={project}
        onOpenChange={(open) => !open && setOpenDocumentId(null)}
      />
    </PageShell>
  );
}

type ProjectPropertiesProps = {
  project: Project;
  projects: Project[];
  onDelete: () => void;
};

function ProjectProperties({
  project,
  projects,
  onDelete,
}: ProjectPropertiesProps) {
  const updateProject = useUpdateProject();
  const archiveProject = useArchiveProject();
  const unarchiveProject = useUnarchiveProject();
  const { data: todos = [] } = useTodos({ projectId: project.id });

  const archived = isArchived(project);
  const completed = todos.filter((t) => t.completed).length;
  const percent = todos.length
    ? Math.round((completed / todos.length) * 100)
    : 0;

  const excluded = subtreeIds(projects, project.id);
  const parentOptions = flattenProjects(projects).filter(
    ({ project: p }) => !excluded.has(p.id),
  );

  const parent = projects.find((p) => p.id === project.parentId);

  return (
    <div className="flex flex-col gap-8">
      <PanelGroup title="Properties">
        <PropertyRow label="Status">
          <Select
            value={archived ? "archived" : "active"}
            onValueChange={(value) =>
              value === "archived"
                ? archiveProject.mutate(project.id)
                : unarchiveProject.mutate(project.id)
            }
          >
            <SelectTrigger className={PROPERTY_VALUE_CLASS}>
              <SelectValue>
                <StatusPill archived={archived} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">
                <StatusPill />
              </SelectItem>
              <SelectItem value="archived">
                <StatusPill archived />
              </SelectItem>
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Color">
          <ProjectColorPicker
            color={project.color}
            onChange={(color) =>
              updateProject.mutate({ id: project.id, color })
            }
          >
            <button
              type="button"
              aria-label="Choose project color"
              className={PROPERTY_VALUE_CLASS}
            >
              <PropertyIcon>
                <span
                  className="h-3 w-3 rounded-full border border-line"
                  style={{ backgroundColor: project.color ?? undefined }}
                />
              </PropertyIcon>
              <span className={cn("truncate", !project.color && "text-muted")}>
                {project.color ? "Custom" : "No color"}
              </span>
            </button>
          </ProjectColorPicker>
        </PropertyRow>

        <PropertyRow label="Parent">
          <Select
            value={project.parentId ?? NO_PARENT}
            onValueChange={(value) =>
              updateProject.mutate({
                id: project.id,
                parentId: value === NO_PARENT ? null : value,
              })
            }
          >
            <SelectTrigger className={PROPERTY_VALUE_CLASS}>
              <SelectValue>
                <span className="flex min-w-0 items-center gap-2">
                  <PropertyIcon>
                    <Box
                      className="h-3.5 w-3.5 text-muted"
                      style={{ color: parent?.color ?? undefined }}
                    />
                  </PropertyIcon>
                  <span className={cn("truncate", !parent && "text-muted")}>
                    {parent?.name ?? "No parent"}
                  </span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PARENT}>
                <span className="text-muted">No parent</span>
              </SelectItem>
              {parentOptions.map(({ project: p, depth }) => (
                <SelectItem key={p.id} value={p.id}>
                  {projectIndent(depth)}
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>
      </PanelGroup>

      <PanelGroup title="Progress" meta={`${completed}/${todos.length}`}>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tint/8">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[13px] tabular-nums text-fg">
            {percent}%
          </span>
        </div>
      </PanelGroup>

      <div className="-mx-2 flex flex-col border-t border-line pt-3">
        <button
          type="button"
          onClick={() =>
            archived
              ? unarchiveProject.mutate(project.id)
              : archiveProject.mutate(project.id)
          }
          className="flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-muted hover:bg-tint/5 hover:text-fg transition-colors cursor-pointer"
        >
          <PropertyIcon>
            {archived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
          </PropertyIcon>
          {archived ? "Unarchive project" : "Archive project"}
        </button>
        <DeleteProjectDialog projectName={project.name} onConfirm={onDelete}>
          <button
            type="button"
            className="flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-muted hover:bg-danger/5 hover:text-danger transition-colors cursor-pointer"
          >
            <PropertyIcon>
              <Trash2 className="h-3.5 w-3.5" />
            </PropertyIcon>
            Delete project
          </button>
        </DeleteProjectDialog>
      </div>
    </div>
  );
}

const PROPERTY_VALUE_CLASS =
  "flex h-8 w-full min-w-0 items-center gap-2 rounded-md border-none bg-transparent px-2 text-left text-[13px] text-fg shadow-none hover:bg-tint/5 focus-within:bg-tint/5 transition-colors cursor-pointer [&>svg:last-child]:hidden";

function PanelGroup({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-fg">{title}</h2>
        {meta && (
          <span className="text-[12px] tabular-nums text-muted">{meta}</span>
        )}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center">
      <span className="w-[5.5rem] shrink-0 text-[13px] text-muted">
        {label}
      </span>
      <div className="-mr-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}

function PropertyIcon({ children }: { children: ReactNode }) {
  return (
    <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">
      {children}
    </span>
  );
}

function StatusPill({ archived = false }: { archived?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-[13px]">
      <PropertyIcon>
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            archived ? "bg-muted" : "bg-success",
          )}
        />
      </PropertyIcon>
      {archived ? "Archived" : "Active"}
    </span>
  );
}

type SectionProps = {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
};

function Section({ title, count, action, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[13px] font-medium text-fg">
          {title}
          {!!count && (
            <span className="text-[12px] font-normal tabular-nums text-muted">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function RowGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line divide-y divide-line">
      {children}
    </div>
  );
}

function Row({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/row flex h-10 items-center gap-2.5 px-3 text-left hover:bg-tint/[0.03] transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
