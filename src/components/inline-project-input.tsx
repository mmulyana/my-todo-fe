import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useCreateProject } from "../hooks/useProjects";
import { Input } from "@/components/ui/input";

type InlineProjectInputProps = {
  parentId?: string | null;
  onClose: () => void;
  className?: string;
  leading?: ReactNode;
  autoFocus?: boolean;
};

export function InlineProjectInput({
  parentId = null,
  onClose,
  className,
  leading,
  autoFocus = true,
}: InlineProjectInputProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const createProject = useCreateProject();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || createProject.isPending) return;

    createProject.mutate({ name: trimmed, parentId });
    setName("");
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <form onSubmit={submit} className={className}>
      {leading}
      <Input
        ref={inputRef}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onClose}
        placeholder="Project name..."
        aria-label="Project name"
        className="h-8 flex-1 bg-transparent border-0 px-0 shadow-none outline-none focus-visible:ring-0"
      />
    </form>
  );
}
