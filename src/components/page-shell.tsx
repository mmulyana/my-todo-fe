import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, SquarePen } from "lucide-react";
import { useSetAtom } from "jotai";
import { openNewTaskAtom, sidebarOpenAtom } from "@/atoms/layout";
import type { Project } from "../types";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  subtitle?: string | null;
  icon?: ReactNode;
  actions?: ReactNode;
  trail?: Project[];
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  classNameChildren?: string;
  fill?: boolean;
  newTaskProjectId?: string | null;
  newTaskMyDay?: boolean;
  newTaskImportant?: boolean;
  hideNewTask?: boolean;
  wide?: boolean;
};

export function PageShell({
  title,
  icon,
  actions,
  trail = [],
  backTo,
  backLabel = "Back",
  children,
  footer = null,
  classNameChildren,
  fill = false,
  newTaskProjectId = null,
  newTaskMyDay = false,
  newTaskImportant = false,
  hideNewTask = false,
  wide = false,
}: PageShellProps) {
  const setSidebarOpen = useSetAtom(sidebarOpenAtom);
  const openNewTask = useSetAtom(openNewTaskAtom);
  const navigate = useNavigate();

  const goBack = (to?: string) => {
    // note: bail out when backTo is not set, never trust the target to be there
    if (!to) return;
    // note: pop history instead of pushing the target, pushing made the browser back button bounce between both pages
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
    else navigate(to, { replace: true });
  };

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-surface rounded-2xl border border-line overflow-hidden relative">
      <header className="shrink-0 px-3.75 border-b border-line flex items-center justify-between gap-4 w-full h-12">
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="lg:hidden -ml-1.5 mr-1.5 p-1.5 shrink-0 rounded-lg text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          {backTo && (
            <button
              type="button"
              onClick={() => goBack(backTo)}
              aria-label={backLabel}
              title={backLabel}
              className="-ml-1.5 mr-1.5 p-1.5 shrink-0 rounded-lg text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          {trail.length > 0 && (
            <nav
              className="flex flex-wrap items-center gap-1.5 text-[15px] text-muted"
              aria-label="Parent projects"
            >
              {trail.map((project) => (
                <span key={project.id} className="flex items-center gap-1.5">
                  <Link
                    to={`/projects/${project.id}`}
                    className="truncate hover:text-fg"
                  >
                    {project.name}
                  </Link>
                  <span aria-hidden="true">/</span>
                </span>
              ))}
            </nav>
          )}
          {icon && (
            <span className="ml-1.5 shrink-0 text-muted [&_svg]:w-4 [&_svg]:h-4">
              {icon}
            </span>
          )}
          <h1 className="ml-1.5 h-fit m-0 text-[15px] tracking-[-0.02em] truncate font-medium text-fg">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          {!hideNewTask && (
            <button
              type="button"
              onClick={() =>
                openNewTask({
                  projectId: newTaskProjectId,
                  myDay: newTaskMyDay,
                  important: newTaskImportant,
                })
              }
              aria-label="New task"
              title="New task"
              className="grid place-items-center w-8 h-8 rounded-full bg-bg text-muted hover:text-fg transition-colors cursor-pointer"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {fill ? (
        <div className={cn("flex-1 min-h-0 flex flex-col", classNameChildren)}>
          {children}
        </div>
      ) : (
        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto py-4",
            wide ? "px-0.5 pr-4" : "px-4",
            classNameChildren,
          )}
        >
          <div
            className={cn(
              "flex flex-col",
              !wide && "w-full max-w-[1200px] mx-auto",
            )}
          >
            {children}
          </div>
        </div>
      )}

      {footer}
    </main>
  );
}
