import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapse } from "@/components/ui/collapse";
import { cn } from "@/lib/utils";

const storageKey = (id: string) => `sidebarGroup:${id}`;

function readOpen(id: string): boolean {
  try {
    return localStorage.getItem(storageKey(id)) !== "0";
  } catch {
    return true;
  }
}

type SidebarGroupProps = {
  id: string;
  label: string;
  // note: function form supaya tombol aksi bisa membuka group yang lagi collapsed
  action?: ReactNode | ((ctl: { expand: () => void }) => ReactNode);
  children: ReactNode;
  className?: string;
};

export function SidebarGroup({
  id,
  label,
  action,
  children,
  className,
}: SidebarGroupProps) {
  const [open, setOpenState] = useState(() => readOpen(id));

  const setOpen = (next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(storageKey(id), next ? "1" : "0");
    } catch {
      // note: storage bisa diblokir (private mode), abaikan
    }
  };

  const toggle = () => setOpen(!open);

  return (
    <section className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between px-2.5 h-8 mb-0.5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex items-center gap-1 text-[13px] font-medium text-muted hover:text-fg transition-colors cursor-pointer"
        >
          <span>{label}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-200 ease-out-strong",
              !open && "-rotate-90",
            )}
          />
        </button>
        {typeof action === "function"
          ? action({ expand: () => setOpen(true) })
          : action}
      </div>
      <Collapse open={open}>{children}</Collapse>
    </section>
  );
}
