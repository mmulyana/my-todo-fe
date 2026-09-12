import * as React from "react";
import { Check, ChevronsUpDown, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { List } from "../types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type ListComboboxProps = {
  lists: List[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ListCombobox({
  lists,
  value,
  onChange,
  placeholder = "No List",
  className,
}: ListComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedList = React.useMemo(
    () => lists.find((l) => l.id === value),
    [lists, value]
  );

  const triggerText = React.useMemo(() => {
    if (!value) return placeholder;
    return selectedList?.name || "Select list...";
  }, [value, selectedList, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal text-left h-7 text-xs px-2.5 bg-tint/5 border-line hover:bg-tint/10 hover:text-fg text-muted cursor-pointer rounded-lg",
            className
          )}
        >
          <span className="truncate flex items-center gap-1.5">
            <ListFilter className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className={cn("truncate", !value && "text-muted", value && "text-fg")}>
              {triggerText}
            </span>
          </span>
          <ChevronsUpDown className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search list..." />
          <CommandList>
            <CommandEmpty>No list found.</CommandEmpty>
            <CommandGroup heading="Lists">
              <CommandItem
                value="no-list-option"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex items-center gap-2 cursor-pointer py-1.5 px-2 text-xs"
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 text-accent shrink-0",
                    value === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium text-fg truncate">
                  {placeholder}
                </span>
              </CommandItem>

              {lists.map((list) => {
                const isSelected = value === list.id;

                return (
                  <CommandItem
                    key={list.id}
                    value={`${list.name} ${list.id}`}
                    onSelect={() => {
                      onChange(list.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 cursor-pointer py-1.5 px-2 text-xs"
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 text-accent shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate text-fg font-normal">
                      {list.name}
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
