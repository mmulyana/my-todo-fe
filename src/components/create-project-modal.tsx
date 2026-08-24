import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Project } from "../types";
import { useCreateProject } from "../hooks/useProjects";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCombobox } from "@/components/project-combobox";

type CreateProjectModalProps = {
  defaultParentId?: string | null;
  allProjects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type CreateProjectFormValues = {
  name: string;
  parentId: string;
  code: string;
};

export function CreateProjectModal({
  defaultParentId,
  allProjects,
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  const { register, handleSubmit, control, watch, reset } =
    useForm<CreateProjectFormValues>({
      defaultValues: {
        name: "",
        parentId: defaultParentId || "",
        code: "",
      },
    });

  const createProject = useCreateProject();
  const name = watch("name");

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        parentId: defaultParentId || "",
        code: "",
      });
    }
  }, [open, defaultParentId, reset]);

  const submit = handleSubmit(({ name, parentId, code }) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createProject.mutate({
      name: trimmed,
      parentId: parentId || null,
      code: code.trim() || null,
    });
    onOpenChange(false);
    onSuccess?.();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 my-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="create-project-name"
                className="text-xs font-medium text-muted"
              >
                Project Name
              </label>
              <Input
                id="create-project-name"
                autoFocus
                placeholder="Enter project name..."
                {...register("name", { required: true })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted">
                Parent Project (Optional)
              </label>
              <Controller
                name="parentId"
                control={control}
                render={({ field }) => (
                  <ProjectCombobox
                    projects={allProjects}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
