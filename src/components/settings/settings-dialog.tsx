import { Palette, Share2, User, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AppearanceTab } from "./appearance-tab";
import { McpTab } from "./mcp-tab";
import { ProfileTab } from "./profile-tab";
import type { SettingsTab } from "@/lib/settings-tabs";
import { cn } from "@/lib/utils";

const NAV: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "mcp", label: "MCP", icon: Share2 },
];

type SettingsDialogProps = {
  tab: SettingsTab | null;
  onTabChange: (tab: SettingsTab) => void;
  onClose: () => void;
};

export function SettingsDialog({ tab, onTabChange, onClose }: SettingsDialogProps) {
  const active = tab ?? "profile";
  const current = NAV.find((n) => n.id === active)!;

  return (
    <Dialog open={tab !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[min(620px,90dvh)] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:flex-row">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Profile, appearance, and MCP access
        </DialogDescription>

        <nav
          aria-label="Settings sections"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface p-2 sm:w-52 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3"
        >
          <p className="hidden px-2.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted sm:block">
            Settings
          </p>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              aria-current={id === active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm cursor-pointer transition-colors",
                id === active
                  ? "bg-tint/5 font-medium text-fg"
                  : "text-fg/50 hover:bg-tint/5",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <h2 className="shrink-0 border-b border-line px-6 py-3.5 pr-12 text-sm font-medium text-fg">
            {current.label}
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {active === "profile" && <ProfileTab />}
            {active === "appearance" && <AppearanceTab />}
            {active === "mcp" && <McpTab />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
