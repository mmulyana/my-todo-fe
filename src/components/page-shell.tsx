import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useSidebarContext } from "../layouts/app-layout";
import type { Project } from "../types";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  subtitle?: string | null;
  icon?: ReactNode;
  actions?: ReactNode;
  trail?: Project[];
  children: ReactNode;
  footer?: ReactNode;
  classNameChildren?: string;
};

export function PageShell({
  title,
  icon,
  actions,
  trail = [],
  children,
  footer = null,
  classNameChildren,
}: PageShellProps) {
  const { openSidebar } = useSidebarContext();

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-surface rounded-2xl border border-line overflow-hidden relative">
      <header className="shrink-0 px-3.75 border-b border-line flex items-center justify-between gap-4 w-full h-12">
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open menu"
            className="lg:hidden -ml-1.5 mr-1.5 p-1.5 shrink-0 rounded-lg text-muted hover:text-fg hover:bg-tint/5 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          {trail.length > 0 && (
            <nav
              className="flex flex-wrap items-center gap-1.5 text-sm text-muted"
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
          <h1 className="ml-1.5 h-fit m-0 text-sm tracking-[-0.02em] truncate font-medium text-fg">
            {title}
          </h1>
        </div>
        {actions}
      </header>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto px-0.5 py-4 pr-4",
          classNameChildren,
        )}
      >
        <div className="flex flex-col">{children}</div>
      </div>

      {footer}
    </main>
  );
}
