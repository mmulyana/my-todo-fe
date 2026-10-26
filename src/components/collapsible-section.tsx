import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  label: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function CollapsibleSection({
  label,
  count,
  children,
  defaultOpen = false,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div className={className}>
      <div className="group/sec flex items-center group">
        <div className="w-5 h-5 flex justify-center items-center">
          <button
            type="button"
            className="sm:hidden group-hover:flex items-center text-muted hover:text-fg transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className="grid place-items-center w-5 h-5 shrink-0">
              <ChevronRight
                size={14}
                strokeWidth={2}
                className={cn(
                  "transition-transform duration-200 ease-out-strong",
                  open && "rotate-90",
                )}
              />
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer"
        >
          <span className="truncate text-sm font-medium">{label}</span>
          {count !== undefined && (
            <span className="text-xs tabular-nums text-muted">{count}</span>
          )}
        </button>
      </div>
      <Collapse open={open}>{children}</Collapse>
    </div>
  );
}
