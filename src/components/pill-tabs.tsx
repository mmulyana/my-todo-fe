import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PillTab<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  count?: number;
};

type PillTabsProps<T extends string> = {
  tabs: PillTab<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
};

export function PillTabs<T extends string>({
  tabs,
  active,
  onChange,
  label,
  className,
}: PillTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {tabs.map(({ id, label: text, icon: Icon, count }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] transition-colors cursor-pointer",
            active === id
              ? "border-transparent bg-tint/10 text-fg"
              : "border-line text-muted hover:bg-tint/5 hover:text-fg",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {text}
          {!!count && (
            <span className="tabular-nums text-muted">{count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
