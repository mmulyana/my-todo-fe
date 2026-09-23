import { NavLink } from "react-router-dom";
import {
  ChevronsUpDown,
  Infinity as InfinityIcon,
  LogOut,
  Moon,
  Share2,
  Star,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { SidebarTree } from "./sidebar-tree";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useMe } from "@/hooks/useMe";
import { cn } from "@/lib/utils";
import type { SmartListId } from "@/types";

type navlinks = {
  id: SmartListId;
  name: string;
  icon: LucideIcon;
};

export const NAVLIST: navlinks[] = [
  { id: "today", name: "Today", icon: Sun },
  { id: "important", name: "Important", icon: Star },
  { id: "all", name: "All", icon: InfinityIcon },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: me } = useMe();

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72.5 max-w-[85vw] flex flex-col min-h-0 pt-4 pb-2 px-2 bg-bg transition-transform duration-200 ease-out md:static md:z-auto md:w-auto md:max-w-none md:translate-x-0 md:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex justify-end shrink-0 px-1 mb-1 md:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-full text-muted hover:text-fg bg-tint/5 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-1 flex flex-col gap-0.5">
          {NAVLIST.map(({ icon: LinkIcon, ...link }) => {
            return (
              <NavLink
                key={link.id}
                to={`/${link.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 py-1.5 px-2.5 rounded-md",
                    isActive
                      ? "bg-tint/5 font-medium text-fg"
                      : "text-fg/50 hover:bg-tint/5",
                  )
                }
              >
                <LinkIcon className="shrink-0 w-4.5 h-4.5" />
                <span className="flex-1 truncate">{link.name}</span>
              </NavLink>
            );
          })}

          <SidebarTree />
        </nav>

        <div className="px-1 mt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 py-1.5 px-2.5 rounded-md text-left hover:bg-surface/50 data-[state=open]:bg-surface/50 transition-colors cursor-pointer"
              >
                <span className="shrink-0 flex items-center justify-center w-6.5 h-6.5 rounded-full bg-accent text-white text-xs font-medium uppercase">
                  {(me?.username ?? me?.email ?? "?").slice(0, 1)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">
                    {me?.username ?? "..."}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {me?.email ?? ""}
                  </span>
                </span>
                <ChevronsUpDown className="shrink-0 w-4 h-4 text-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="w-(--radix-dropdown-menu-trigger-width)"
            >
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <NavLink to="/mcp">
                  <Share2 className="w-4 h-4" />
                  MCP
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="gap-2 cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  import("../api").then(({ logout }) => logout());
                }}
                className="gap-2 text-danger focus:bg-danger/10 focus:text-danger cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
