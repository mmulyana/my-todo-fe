import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { TodoInput } from "./todo-input";

type NewTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string | null;
};

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: NewTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-xl p-3 gap-2">
        <DialogTitle className="sr-only">New task</DialogTitle>
        <DialogDescription className="sr-only">
          Add a task to your inbox or a project
        </DialogDescription>
        <TodoInput
          autoFocus
          staticCheckbox
          defaultProjectId={defaultProjectId}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
