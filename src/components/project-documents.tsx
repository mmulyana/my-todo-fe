import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { DocumentSheet } from "./document-sheet";
import { useCreateDocument, useDocuments } from "../hooks/useDocuments";
import { useIsDesktop } from "../hooks/useMediaQuery";
import type { Project } from "../types";

type ProjectDocumentsProps = {
  project: Project;
};

export function ProjectDocuments({ project }: ProjectDocumentsProps) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { data: documents = [] } = useDocuments(project.id);
  const createDocument = useCreateDocument();
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);

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

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded-xl border border-line divide-y divide-line">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            onClick={() => openDocument(doc.id)}
            className="flex h-10 items-center gap-2.5 px-3 text-left hover:bg-tint/[0.03] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 shrink-0 text-muted" />
            <span className="flex-1 min-w-0 truncate text-sm">
              {doc.title || "Untitled"}
            </span>
            <span className="shrink-0 text-[12px] text-muted">
              {formatDistanceToNow(new Date(doc.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={addDocument}
          className="flex h-10 items-center gap-2 px-3 text-sm text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>
            {documents.length === 0 ? "Write the first document" : "New document"}
          </span>
        </button>
      </div>

      <DocumentSheet
        documentId={openDocumentId}
        project={project}
        onOpenChange={(open) => !open && setOpenDocumentId(null)}
      />
    </>
  );
}
