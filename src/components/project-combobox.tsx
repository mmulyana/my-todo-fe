import * as React from "react";
import { Box, BoxIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "../types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ProjectComboboxProps = {
  projects: Project[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string
  hideIcon?: boolean
};

export function ProjectCombobox({
  projects,
  value,
  onChange,
  placeholder = "No Project",
  className,
  hideIcon
}: ProjectComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedProject = React.useMemo(
    () => projects.find((p) => p.id === value),
    [projects, value]
  );

  const triggerText = React.useMemo(() => {
    if (!value) return placeholder;
    return selectedProject?.name || "Select project...";
  }, [value, selectedProject, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal text-left h-9 px-3 bg-raised border-line cursor-pointer", className)}
        >
          <span className="truncate flex items-center gap-2">
            {!hideIcon && <Box className="h-4 w-4 shrink-0" />}
            <span className={cn("truncate", !value && "text-muted")}>
              {triggerText}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup heading="Projects">
              <CommandItem
                value="no-project-option"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer py-2 px-3"
              >
                <Check
                  className={cn(
                    "h-4 w-4 text-accent shrink-0",
                    value === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-fg truncate">
                  {placeholder}
                </span>
              </CommandItem>

              {projects.map((project) => {
                const isSelected = value === project.id;

                return (
                  <CommandItem
                    key={project.id}
                    value={`${project.name} ${project.id}`}
                    onSelect={() => {
                      onChange(project.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer py-2 px-3"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 text-accent shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <BoxIcon className="h-3.5 w-3.5 text-muted shrink-0" />
                    <span className="truncate text-fg font-normal">
                      {project.name}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
