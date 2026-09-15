import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { DocumentEditor } from "../components/document-editor";
import { DeleteDocumentButton } from "../components/delete-document-button";
import { useDocuments } from "../hooks/useDocuments";
import { useProjects } from "../hooks/useProjects";

export default function DocumentPage() {
  const { projectId, documentId } = useParams();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: documents = [] } = useDocuments(projectId ?? "");

  if (!projectId || !documentId) return null;

  const project = projects.find((p) => p.id === projectId);
  const title =
    documents.find((doc) => doc.id === documentId)?.title ?? "Untitled";
  const backToProject = () => navigate(`/projects/${projectId}`);

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-surface rounded-2xl border border-line overflow-hidden">
      <header className="shrink-0 pl-1 pr-2 border-b border-line flex items-center justify-between gap-2 h-12">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 min-w-0 text-sm text-muted"
        >
          <button
            type="button"
            onClick={backToProject}
            aria-label="Back to project"
            className="p-1.5 shrink-0 rounded-lg text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="truncate">{project?.name ?? "Project"}</span>
          <span aria-hidden="true">/</span>
          <span className="shrink-0">Documents</span>
          <span aria-hidden="true">/</span>
          <h1 className="truncate text-sm font-medium text-fg">{title}</h1>
        </nav>

        <DeleteDocumentButton
          documentId={documentId}
          projectId={projectId}
          title={title}
          onDeleted={backToProject}
        />
      </header>

      <DocumentEditor
        key={documentId}
        documentId={documentId}
        projectId={projectId}
      />
    </main>
  );
}
