import type { ReactNode } from "react";
import {
  Box,
  Flag,
  ListChecks,
  Paperclip,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTab } from "@/lib/project-tabs";

const TABS: { id: ProjectTab; label: string; icon: LucideIcon }[] = [
  { id: "todo", label: "Todo", icon: ListChecks },
  { id: "milestone", label: "Milestone", icon: Flag },
  { id: "project", label: "Project", icon: Box },
  { id: "resource", label: "Resource", icon: Paperclip },
];

export function ProjectContentTabs({
  active,
  onChange,
  actions,
}: {
  active: ProjectTab;
  onChange: (tab: ProjectTab) => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <div
        role="tablist"
        aria-label="Project content"
        className="flex flex-wrap items-center gap-2"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => onChange(id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors cursor-pointer",
              active === id
                ? "border-transparent bg-tint/10 text-fg"
                : "border-line text-muted hover:bg-tint/5 hover:text-fg",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
      {actions}
    </div>
  );
}
