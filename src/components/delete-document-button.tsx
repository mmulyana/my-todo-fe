import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteDocument } from "../hooks/useDocuments";

type DeleteDocumentButtonProps = {
  documentId: string;
  projectId: string;
  title: string;
  onDeleted: () => void;
};

export function DeleteDocumentButton({
  documentId,
  projectId,
  title,
  onDeleted,
}: DeleteDocumentButtonProps) {
  const deleteDocument = useDeleteDocument();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          aria-label="Delete document"
          className="p-1 rounded-md text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete document?</AlertDialogTitle>
          <AlertDialogDescription>
            "{title || "Untitled"}" will be permanently deleted. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              deleteDocument.mutate({ id: documentId, projectId });
              onDeleted();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/15 text-danger hover:bg-danger/25 transition-colors cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
