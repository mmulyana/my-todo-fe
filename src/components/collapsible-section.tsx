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
    <div className="flex flex-col mt-4">
      <button
        type="button"
        className="flex items-center py-1.5 text-sm font-medium text-muted hover:text-fg tracking-wide cursor-pointer gap-1"
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
        {label} <span className="text-fg">{count}</span>
      </button>
      {open && children}
    </div>
  );
}
