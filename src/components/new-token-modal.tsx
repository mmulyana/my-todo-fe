import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { NewApiToken } from "../types";
import { useCreateApiToken } from "../hooks/useApiTokens";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NewTokenModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (token: NewApiToken) => void;
};

type NewTokenFormValues = {
  name: string;
  expiresInDays: string;
};

const EXPIRY_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

export function NewTokenModal({ open, onOpenChange, onCreated }: NewTokenModalProps) {
  const { register, handleSubmit, watch, reset } = useForm<NewTokenFormValues>({
    defaultValues: { name: "", expiresInDays: "" },
  });

  const createToken = useCreateApiToken();
  const name = watch("name");

  useEffect(() => {
    if (open) {
      reset({ name: "", expiresInDays: "" });
      createToken.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const submit = handleSubmit(({ name, expiresInDays }) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    createToken.mutate(
      {
        name: trimmed,
        expiresInDays: expiresInDays ? Number(expiresInDays) : null,
      },
      {
        onSuccess: (token) => {
          onOpenChange(false);
          onCreated(token);
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New Access Token</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 my-1">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-token-name" className="text-xs font-medium text-muted">
                Name
              </label>
              <Input
                id="new-token-name"
                autoFocus
                placeholder="e.g. Claude Desktop - laptop kantor"
                {...register("name", { required: true })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-token-expiry" className="text-xs font-medium text-muted">
                Expiry
              </label>
              <select
                id="new-token-expiry"
                className={cn(
                  "flex h-9 w-full rounded-md border border-line bg-raised px-3 py-1 text-sm shadow-xs transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                )}
                {...register("expiresInDays")}
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {createToken.isError && (
              <p className="text-xs text-red-400">
                {createToken.error instanceof Error
                  ? createToken.error.message
                  : "Failed to create token"}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || createToken.isPending}>
              {createToken.isPending ? "Creating..." : "Create Token"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
