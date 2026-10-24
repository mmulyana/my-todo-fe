import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ] as const;

  return (
    <section className="flex flex-col gap-3 max-w-md">
      <h2 className="text-sm font-medium text-fg">Theme</h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={theme === id}
            onClick={() => theme !== id && toggleTheme()}
            className={cn(
              "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors",
              theme === id
                ? "border-accent bg-accent/5 text-fg"
                : "border-line text-muted hover:text-fg",
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
