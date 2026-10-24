import { NavLink, useMatch } from "react-router-dom";
import {
  CalendarClock,
  CalendarDays,
  ChevronsUpDown,
  Infinity as InfinityIcon,
  LogOut,
  Moon,
  Search,
  Settings,
  Share2,
  Star,
  Sun,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { SidebarTree } from "./sidebar-tree";
import { Avatar } from "./avatar";
import { userLabel } from "@/lib/user";
import { BrandLogo } from "./brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useMe } from "@/hooks/useMe";
import { useNow, useRunningTimeEntry } from "@/hooks/useTimeEntries";
import { entrySeconds, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { SmartListId } from "@/types";

type navlinks = {
  id: SmartListId | "upcoming";
  name: string;
  icon: LucideIcon;
};

export const NAVLIST: navlinks[] = [
  { id: "today", name: "Today", icon: Sun },
  { id: "upcoming", name: "Upcoming", icon: CalendarClock },
  { id: "important", name: "Important", icon: Star },
  { id: "all", name: "All", icon: InfinityIcon },
];

// note: only this component ticks, it pauses on the timer page since the input already shows the time
function SidebarTimerClock() {
  const onTimerPage = Boolean(useMatch("/timer"));
  const { data: running } = useRunningTimeEntry();
  const active = Boolean(running) && !onTimerPage;
  const now = useNow(active);
  if (!active || !running) return null;

  return (
    <span className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-accent">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      {formatDuration(entrySeconds(running, now))}
    </span>
  );
}

function TimerNavLink() {
  return (
    <NavLink
      to="/timer"
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 py-1.5 px-2.5 rounded-md",
          isActive
            ? "bg-tint/5 font-medium text-fg"
            : "text-fg/50 hover:bg-tint/5",
        )
      }
    >
      <Timer className="shrink-0 w-4.5 h-4.5" />
      <span className="flex-1 truncate">Timer</span>
      <SidebarTimerClock />
    </NavLink>
  );
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
};

export function Sidebar({ open, onClose, onSearch }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { data: me } = useMe();

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72.5 max-w-[85vw] flex flex-col min-h-0 pt-4 pb-2 px-2 bg-bg transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between shrink-0 px-2.5 mb-3">
          <BrandLogo showName size={26} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-full text-muted hover:text-fg bg-tint/5 transition-colors cursor-pointer lg:hidden"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="px-1 mb-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearch();
            }}
            className="flex w-full items-center gap-2.5 py-1.5 px-2.5 rounded-md text-fg/50 bg-tint/5 hover:text-fg transition-colors cursor-pointer"
          >
            <Search className="shrink-0 w-4.5 h-4.5" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="hidden lg:block text-[11px] text-muted font-sans">Ctrl K</kbd>
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
          <TimerNavLink />
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 py-1.5 px-2.5 rounded-md",
                isActive
                  ? "bg-tint/5 font-medium text-fg"
                  : "text-fg/50 hover:bg-tint/5",
              )
            }
          >
            <CalendarDays className="shrink-0 w-4.5 h-4.5" />
            <span className="flex-1 truncate">Calendar</span>
          </NavLink>

          <SidebarTree />
        </nav>

        <div className="px-1 mt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 py-1.5 px-2.5 rounded-md text-left hover:bg-surface/50 data-[state=open]:bg-surface/50 transition-colors cursor-pointer"
              >
                <Avatar user={me} size={26} />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">
                    {userLabel(me) || "..."}
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
                <NavLink to="?settings=profile">
                  <Settings className="w-4 h-4" />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                <NavLink to="?settings=mcp">
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
