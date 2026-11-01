import { useState, type ReactNode } from "react";
import { TriangleIcon } from "lucide-react";
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

  const toggle = () => setOpen((value) => !value);

  return (
    <div className={className}>
      <div
        className="group/sec flex items-center h-10 px-3 rounded-lg cursor-pointer select-none transition-colors hover:bg-tint/5"
        onClick={toggle}
      >
        <button
          type="button"
          className="flex p-0 items-center justify-center w-5 h-5 shrink-0 mr-2 rounded-md text-muted hover:bg-tint/10 hover:text-fg transition-colors cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          aria-expanded={open}
          aria-label={open ? `Hide ${label}` : `Show ${label}`}
        >
          <TriangleIcon
            size={8}
            strokeWidth={2.5}
            className={cn(
              "transition-transform duration-200 ease-out-strong fill-current",
              open ? "rotate-180" : "rotate-90",
            )}
          />
        </button>
        <span className="flex-1 min-w-0 truncate text-[16px] sm:text-[15px]">
          {label}
        </span>
      </div>
      <Collapse open={open}>{children}</Collapse>
    </div>
  );
}
