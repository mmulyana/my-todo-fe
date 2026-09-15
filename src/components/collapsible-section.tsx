import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type CollapsibleSectionProps = {
  label: string;
  count: number;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleSection({
  label,
  count,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <div>
      <div className="group/sec flex items-center group">
        <div className="w-5 h-5 flex justify-center items-center">
          <button
            type="button"
            className="hidden group-hover:flex items-center text-muted hover:text-fg transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className="grid place-items-center w-5 h-5 shrink-0">
              {open ? (
                <ChevronDown size={14} strokeWidth={2} />
              ) : (
                <ChevronRight size={14} strokeWidth={2} />
              )}
            </span>
          </button>
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <span className="truncate text-[15px] font-medium cursor-pointer">
            {label}
          </span>
        </div>
      </div>
      {open && children}
    </div>
  );
}
