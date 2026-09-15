import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DocumentEditor } from "./document-editor";
import { DeleteDocumentButton } from "./delete-document-button";
import { useDocuments } from "../hooks/useDocuments";
import type { Project } from "../types";

type DocumentSheetProps = {
  documentId: string | null;
  project: Project;
  onOpenChange: (open: boolean) => void;
};

export function DocumentSheet({
  documentId,
  project,
  onOpenChange,
}: DocumentSheetProps) {
  const { data: documents = [] } = useDocuments(project.id);
  const title =
    documents.find((doc) => doc.id === documentId)?.title ?? "Untitled";

  return (
    <Sheet open={!!documentId} onOpenChange={onOpenChange}>
      <SheetContent hideClose aria-describedby={undefined}>
        <header className="shrink-0 flex items-center justify-between gap-4 h-12 px-4 border-b border-line">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 min-w-0 text-sm text-muted"
          >
            <span className="truncate">{project.name}</span>
            <span aria-hidden="true">/</span>
            <span className="shrink-0">Documents</span>
            <span aria-hidden="true">/</span>
            <SheetTitle className="truncate text-sm font-medium text-fg">
              {title}
            </SheetTitle>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            {documentId && (
              <DeleteDocumentButton
                documentId={documentId}
                projectId={project.id}
                title={title}
                onDeleted={() => onOpenChange(false)}
              />
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close document"
              className="p-1 rounded-md text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {documentId && (
          <DocumentEditor
            key={documentId}
            documentId={documentId}
            projectId={project.id}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
