import type { ReactNode } from "react";
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

type DeleteProjectDialogProps = {
  projectName: string;
  onConfirm: () => void;
  children: ReactNode;
};

export function DeleteProjectDialog({
  projectName,
  onConfirm,
  children,
}: DeleteProjectDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            "{projectName}" will be permanently deleted. Its lists, todos and
            sub projects stay, but they lose this project. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/15 text-danger hover:bg-danger/25 transition-colors cursor-pointer"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
