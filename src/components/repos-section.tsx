import { useState } from "react";
import { ExternalLink, GitBranch, Plus, X } from "lucide-react";
import { useUpdateProject } from "../hooks/useProjects";
import { repoName } from "../lib/repo";
import type { Project } from "../types";

export function ReposSection({ project }: { project: Project }) {
  const updateProject = useUpdateProject();
  const [draft, setDraft] = useState("");

  const save = (repos: string[]) =>
    updateProject.mutate({ id: project.id, repos });

  const add = () => {
    const url = draft.trim();
    if (!url) return;
    save([...project.repos, url]);
    setDraft("");
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line divide-y divide-line">
      {project.repos.map((url) => (
        <div
          key={url}
          className="group/row flex h-10 items-center gap-2.5 px-3"
        >
          <GitBranch className="w-4 h-4 shrink-0 text-muted" />
          <span className="shrink-0 text-sm">{repoName(url)}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted hover:text-fg"
          >
            <span className="truncate">{url}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <button
            type="button"
            onClick={() => save(project.repos.filter((repo) => repo !== url))}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-tint/10 hover:text-fg group-hover/row:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
            aria-label={`Remove ${repoName(url)}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <form
        className="flex h-10 items-center gap-2 px-3 text-muted"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Plus className="shrink-0" size={14} />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          aria-label="Add repository URL"
        />
      </form>
    </div>
  );
}
