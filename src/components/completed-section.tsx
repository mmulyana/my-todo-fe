import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

type CompletedSectionProps = {
  count: number;
  children: ReactNode;
};

export function CompletedSection({ count, children }: CompletedSectionProps) {
  const [open, setOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="flex flex-col mt-4">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted hover:text-fg uppercase tracking-wide cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={14} strokeWidth={2} />
        ) : (
          <ChevronRight size={14} strokeWidth={2} />
        )}
        Completed ({count})
      </button>
      {open && children}
    </div>
  );
}
