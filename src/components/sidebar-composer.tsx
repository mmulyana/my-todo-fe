import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCreateProject } from "../hooks/useProjects";
import type { Project } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCombobox } from "@/components/project-combobox";

type SidebarComposerProps = {
  projects: Project[];
};

type ProjectFormValues = {
  name: string;
  parentId: string;
  code: string
};

const defaultValues: ProjectFormValues = { name: "", parentId: "", code: "" };

export function SidebarComposer({ projects }: SidebarComposerProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, control, watch, reset } =
    useForm<ProjectFormValues>({ defaultValues });

  const createProject = useCreateProject();

  const name = watch("name");

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) reset(defaultValues);
  };

  const submit = handleSubmit(({ name, parentId, code }) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createProject.mutate({
      name: trimmed,
      parentId: parentId || null,
      code: code.trim() || null,
    });
    handleOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 w-full py-1.5 px-2.5 rounded text-left text-accent hover:bg-white/5 transition-colors cursor-pointer"
        >
          <span className="flex-1 truncate font-medium">+ New project</span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to organize your tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 my-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="project-name"
                className="text-xs font-medium text-muted"
              >
                Project Name
              </label>
              <Input
                id="project-name"
                autoFocus
                placeholder="Enter project name..."
                {...register("name", { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="code-name"
                className="text-xs font-medium text-muted"
              >
                Code
              </label>
              <Input
                id="code-name"
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
                    projects={projects}
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
              onClick={() => handleOpenChange(false)}
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
