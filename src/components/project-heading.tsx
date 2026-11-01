import { useEffect, useState } from "react";
import { Box } from "lucide-react";
import { ProjectColorPicker } from "./project-color-picker";
import { useUpdateProject } from "../hooks/useProjects";
import type { Project } from "../types";

type ProjectHeadingProps = {
  project: Project;
};

export function ProjectHeading({ project }: ProjectHeadingProps) {
  const updateProject = useUpdateProject();
  const [nameDraft, setNameDraft] = useState(project.name);
  const [descriptionDraft, setDescriptionDraft] = useState(
    project.description ?? "",
  );

  useEffect(() => {
    setNameDraft(project.name);
  }, [project.name]);

  useEffect(() => {
    setDescriptionDraft(project.description ?? "");
  }, [project.description]);

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

  return (
    <header className="flex flex-col gap-3 px-3 pt-2">
      <ProjectColorPicker
        color={project.color}
        onChange={(color) => updateProject.mutate({ id: project.id, color })}
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
  );
}
