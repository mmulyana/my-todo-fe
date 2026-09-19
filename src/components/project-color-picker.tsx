import { Box, Check, Palette } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PROJECT_COLORS = [
  "#475569",
  "#0f766e",
  "#0d9488",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#4f46e5",
  "#6366f1",
  "#7c3aed",
  "#9333ea",
  "#a21caf",
  "#db2777",
  "#e11d48",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#16a34a",
];

type ProjectColorPickerProps = {
  color: string | null | undefined;
  onChange: (color: string | null) => void;
};

export function ProjectColorPicker({
  color,
  onChange,
}: ProjectColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="grid h-14 w-14 place-items-center rounded-2xl bg-tint/8 text-muted transition-colors hover:bg-tint/15 cursor-pointer"
          aria-label="Choose project color"
        >
          <Box className="h-7 w-7" style={{ color: color ?? undefined }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="grid grid-cols-6 gap-1.5">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md border border-line bg-raised text-muted hover:bg-tint/10 cursor-pointer",
              !color && "ring-2 ring-accent ring-offset-1 ring-offset-surface",
            )}
            aria-label="Remove project color"
            title="No color"
          >
            <Palette className="h-3.5 w-3.5" />
          </button>
          {PROJECT_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onChange(value);
                setOpen(false);
              }}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-md border border-black/10 shadow-sm cursor-pointer transition-transform hover:scale-110",
                color === value &&
                  "ring-2 ring-accent ring-offset-1 ring-offset-surface",
              )}
              style={{ backgroundColor: value }}
              aria-label={`Set project color ${value}`}
            >
              {color === value && (
                <Check className="h-4 w-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
