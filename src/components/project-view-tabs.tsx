import { Link } from "react-router-dom";
import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectView = "list" | "kanban";

const viewKey = (projectId: string) => `projectView:${projectId}`;

export function readProjectView(projectId: string): "list" | "kanban" {
  try {
    return localStorage.getItem(viewKey(projectId)) === "kanban"
      ? "kanban"
      : "list";
  } catch {
    return "list";
  }
}

// note: entry point view (List/Board) disembunyikan dulu, ubah ke true untuk menampilkan lagi
export const SHOW_VIEW_CONTROLS = false;

export function isKanbanLocation(pathname: string, view: string | null): boolean {
  // note: selama view disembunyikan halaman project selalu List, jangan menekan panel detail karena preferensi Board lama di localStorage
  if (!SHOW_VIEW_CONTROLS) return false;
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  if (!match) return false;
  if (view === "kanban" || view === "list") return view === "kanban";
  return readProjectView(match[1]) === "kanban";
}

export function saveProjectView(projectId: string, view: "list" | "kanban") {
  try {
    localStorage.setItem(viewKey(projectId), view);
  } catch {
    // ignore (private mode / blocked storage)
  }
}

const TABS: { view: ProjectView; label: string; icon: typeof List }[] = [
  { view: "list", label: "List", icon: List },
  { view: "kanban", label: "Board", icon: KanbanSquare },
];

export function ProjectViewTabs({
  projectId,
  active,
}: {
  projectId: string;
  active: ProjectView;
}) {
  const hrefFor = (view: ProjectView) => `/projects/${projectId}?view=${view}`;

  return (
    <nav
      aria-label="Project views"
      className="flex items-center gap-0.5 rounded-lg bg-tab-track p-0.5 text-[13px] text-muted"
    >
      {TABS.map(({ view, label, icon: Icon }) => (
        <Link
          key={view}
          to={hrefFor(view)}
          replace
          aria-current={active === view ? "page" : undefined}
          onClick={() => {
            saveProjectView(projectId, view);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 font-medium transition-colors hover:text-fg max-lg:py-1.5",
            active === view && "bg-tab-active text-tab-active-fg shadow-sm",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="max-lg:hidden">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
