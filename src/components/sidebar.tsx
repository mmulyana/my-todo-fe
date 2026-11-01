import { NavLink, useMatch } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Share2,
  Sun,
  X,
} from "lucide-react";
import { SidebarTree } from "./sidebar-tree";
import { Avatar } from "./avatar";
import { userLabel } from "@/lib/user";
import { NAV_ITEMS } from "@/lib/nav";
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

const ICON_BUTTON_CLASS =
  "grid place-items-center w-8 h-8 shrink-0 rounded-full text-muted hover:bg-tint/5 hover:text-fg transition-colors cursor-pointer";

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

function UserMenu() {
  const { theme, toggleTheme } = useTheme();
  const { data: me } = useMe();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 h-8 pl-1 pr-2 rounded-full text-left hover:bg-tint/5 data-[state=open]:bg-tint/5 transition-colors cursor-pointer"
        >
          <Avatar user={me} size={24} />
          <span className="truncate text-[15px] font-medium text-fg">
            {userLabel(me) || "..."}
          </span>
          <ChevronDown className="shrink-0 w-3.5 h-3.5 text-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-56 px-0">
        <div className="px-2 py-1.5 text-xs text-muted truncate">
          {me?.email ?? ""}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2 cursor-pointer rounded-none">
          <NavLink to="?settings=profile">
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2 cursor-pointer rounded-none">
          <NavLink to="?settings=mcp">
            <Share2 className="w-4 h-4" />
            MCP
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme} className="gap-2 cursor-pointer rounded-none">
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
          className="gap-2 text-danger focus:bg-danger/10 focus:text-danger cursor-pointer rounded-none"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
};

export function Sidebar({ open, onClose, onSearch }: SidebarProps) {
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
          "fixed inset-y-0 left-0 z-50 w-72.5 max-w-[85vw] flex flex-col min-h-0 pt-3 pb-2 px-2 bg-bg transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-auto lg:max-w-none lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-1 shrink-0 px-1 mb-4">
          <UserMenu />
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSearch();
              }}
              aria-label="Search"
              title="Search (Ctrl K)"
              className={ICON_BUTTON_CLASS}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className={cn(ICON_BUTTON_CLASS, "lg:hidden")}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-1 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ icon: LinkIcon, ...link }) => (
              <NavLink
                key={link.id}
                to={`/${link.id}`}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 py-1.5 px-2.5 rounded-md text-[14px]",
                    isActive
                      ? "bg-tint/5 font-medium text-fg"
                      : "text-fg/50 hover:bg-tint/5",
                  )
                }
              >
                <LinkIcon className="shrink-0 w-4 h-4" />
                <span className="flex-1 truncate">{link.name}</span>
                {link.id === "timer" && <SidebarTimerClock />}
              </NavLink>
            ))}
          </div>

          <SidebarTree />
        </nav>
      </aside>
    </>
  );
}
