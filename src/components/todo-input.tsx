import { useEffect, useMemo, useState } from "react";
import { useCreateTodo } from "../hooks/useTodos";
import { useProjects } from "../hooks/useProjects";
import { activeProjects, isArchived } from "../projects";
import { useLists } from "../hooks/useLists";
import { ProjectCombobox } from "./project-combobox";
import { ListCombobox } from "./list-combobox";
import { cn } from "@/lib/utils";
import type { List, View } from "../types";

type TodoInputProps = {
  view?: View;
  defaultProjectId?: string | null;
  defaultListId?: string | null;
  lists?: List[];
  autoFocus?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
  className?: string;
  hideComboboxes?: boolean;
  placeholder?: string;
};

export function TodoInput({
  view,
  defaultProjectId,
  defaultListId,
  lists: propLists = [],
  autoFocus,
  onCancel,
  onSuccess,
  className,
  hideComboboxes = false,
  placeholder = "Add a task",
}: TodoInputProps) {
  const [draft, setDraft] = useState("");
  const { data: allProjects = [] } = useProjects();
  const { data: allLists = propLists } = useLists();

  const initProjectId =
    defaultProjectId !== undefined
      ? defaultProjectId || ""
      : view?.kind === "project"
        ? view.id
        : "";

  const initListId =
    defaultListId !== undefined
      ? defaultListId || ""
      : view?.kind === "list"
        ? view.id
        : "";

  const [selectedProjectId, setSelectedProjectId] = useState(initProjectId);
  const [selectedListId, setSelectedListId] = useState(initListId);

  const projects = useMemo(() => {
    const active = activeProjects(allProjects);
    const selected = allProjects.find((p) => p.id === selectedProjectId);
    return selected && isArchived(selected) ? [...active, selected] : active;
  }, [allProjects, selectedProjectId]);

  useEffect(() => {
    if (defaultProjectId !== undefined) {
      setSelectedProjectId(defaultProjectId || "");
    } else if (view?.kind === "project") {
      setSelectedProjectId(view.id);
    }
  }, [view, defaultProjectId]);

  useEffect(() => {
    if (defaultListId !== undefined) {
      setSelectedListId(defaultListId || "");
    } else if (view?.kind === "list") {
      setSelectedListId(view.id);
    }
  }, [view, defaultListId]);

  const availableLists = selectedProjectId
    ? allLists.filter((l) => l.projectId === selectedProjectId)
    : allLists;

  const createTodo = useCreateTodo();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) {
      onCancel?.();
      return;
    }

    createTodo.mutate({
      title,
      projectId:
        selectedProjectId || (view?.kind === "project" ? view.id : null),
      listId: selectedListId || (view?.kind === "list" ? view.id : null),
      important: view?.kind === "smart" && view.id === "important",
      myDay: view?.kind === "smart" && view.id === "today",
    });
    setDraft("");
    onSuccess?.();
  };

  return (
    <form
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 py-2 px-3.5 rounded-xl bg-raised border border-line focus-within:border-accent transition-colors shadow-xs",
        className,
      )}
      onSubmit={handleSubmit}
    >
      <div className="flex-1 flex items-center gap-2.5 min-w-0">
        <span className="grid place-items-center w-5.5 h-5.5 shrink-0 rounded-[7px] border-[1.5px] border-line hover:border-muted" />
        <input
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel?.();
          }}
          onBlur={() => {
            if (!draft.trim()) onCancel?.();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 min-w-0 border-none bg-transparent text-fg text-[14px] outline-none placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!hideComboboxes && (
          <>
            <ProjectCombobox
              projects={projects}
              value={selectedProjectId}
              onChange={(pId) => {
                setSelectedProjectId(pId);
                if (selectedListId) {
                  const list = allLists.find((l) => l.id === selectedListId);
                  if (list && pId && list.projectId !== pId) {
                    setSelectedListId("");
                  }
                }
              }}
              placeholder="No Project"
              className="h-7 text-xs px-2.5 bg-tint/5 border-line rounded-lg w-auto min-w-27.5 max-w-40"
            />

            <ListCombobox
              lists={availableLists}
              value={selectedListId}
              onChange={setSelectedListId}
              placeholder="No List"
              className="h-7 text-xs px-2.5 bg-tint/5 border-line rounded-lg w-auto min-w-23.75 max-w-35"
            />
          </>
        )}
      </div>
    </form>
  );
}
