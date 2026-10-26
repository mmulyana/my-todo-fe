import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type CollapseProps = {
  open: boolean;
  children: ReactNode;
  className?: string;
};

// note: wrapper selalu ter-mount supaya grid-template-rows bisa transisi 0fr <-> 1fr; children baru di-unmount setelah fade-out selesai
export function Collapse({ open, children, className }: CollapseProps) {
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);

  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-in-out-strong motion-reduce:transition-opacity",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
      onTransitionEnd={(e) => {
        if (e.target !== e.currentTarget || e.propertyName !== "opacity") return;
        if (!open) setRendered(false);
      }}
    >
      <div className="min-h-0 overflow-hidden">{rendered && children}</div>
    </div>
  );
}
