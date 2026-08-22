import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { Project } from "../types";
import { useUpdateProject } from "../hooks/useProjects";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCombobox } from "@/components/project-combobox";

type EditProjectModalProps = {
  project: Project;
  allProjects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditProjectFormValues = {
  name: string;
  parentId: string;
  code: string;
};

export function EditProjectModal({
  project,
  allProjects,
  open,
  onOpenChange,
}: EditProjectModalProps) {
  const { register, handleSubmit, control, watch, reset } =
    useForm<EditProjectFormValues>({
      defaultValues: {
        name: project.name,
        parentId: project.parentId || "",
        code: project.code || "",
      },
    });

  const updateProject = useUpdateProject();

  const name = watch("name");

  useEffect(() => {
    if (open) {
      reset({
        name: project.name,
        parentId: project.parentId || "",
        code: project.code || "",
      });
    }
  }, [open, project, reset]);

  const availableProjects = allProjects.filter((p) => p.id !== project.id);

  const submit = handleSubmit(({ name, parentId, code }) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    updateProject.mutate({
      id: project.id,
      name: trimmed,
      parentId: parentId || null,
      code: code.trim() || null,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project name and parent project setting.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 my-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-project-name"
                className="text-xs font-medium text-muted"
              >
                Project Name
              </label>
              <Input
                id="edit-project-name"
                autoFocus
                placeholder="Enter project name..."
                {...register("name", { required: true })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-project-code"
                className="text-xs font-medium text-muted"
              >
                Code
              </label>
              <Input
                id="edit-project-code"
                placeholder="Enter project code..."
                {...register("code")}
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
                    projects={availableProjects}
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
