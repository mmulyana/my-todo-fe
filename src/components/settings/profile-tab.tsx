import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Avatar } from "../avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useChangePassword,
  useMe,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "../../hooks/useMe";
import type { User } from "../../types";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
    >
      {message}
    </p>
  );
}

function AvatarSection({ me }: { me: User }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const busy = upload.isPending || remove.isPending;

  const onPick = (file?: File) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("Image must be 2 MB or smaller");
      return;
    }
    upload.mutate(file, { onError: (err) => setError(err.message) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <Avatar user={me} size={64} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? "Uploading..." : "Upload photo"}
            </Button>
            {me.avatarUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  remove.mutate(undefined, {
                    onError: (err) => setError(err.message),
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted">Image up to 2 MB.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <ErrorText message={error} />
    </div>
  );
}

type ProfileValues = { displayName: string; username: string };

function ProfileForm({ me }: { me: User }) {
  const update = useUpdateProfile();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileValues>({
    defaultValues: { displayName: me.displayName ?? "", username: me.username },
  });

  const onSubmit = handleSubmit((values) => {
    setError("");
    setSaved(false);
    update.mutate(
      { displayName: values.displayName.trim(), username: values.username.trim() },
      {
        onSuccess: (user) => {
          reset({ displayName: user.displayName ?? "", username: user.username });
          setSaved(true);
        },
        onError: (err) => setError(err.message),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <ErrorText message={error} />
      <Field id="profile-display-name" label="Display name" error={errors.displayName?.message}>
        <Input
          id="profile-display-name"
          maxLength={60}
          placeholder={me.username}
          {...register("displayName", { maxLength: { value: 60, message: "Max 60 characters" } })}
        />
      </Field>
      <Field id="profile-username" label="Username" error={errors.username?.message}>
        <Input
          id="profile-username"
          autoComplete="username"
          {...register("username", {
            required: "Username is required",
            pattern: {
              value: /^[a-zA-Z0-9_.-]{3,30}$/,
              message: "3-30 characters: letters, numbers, dot, underscore, dash",
            },
          })}
        />
      </Field>
      <Field id="profile-email" label="Email">
        <Input id="profile-email" value={me.email} readOnly disabled />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!isDirty || update.isPending}>
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
        {saved && !isDirty && <span className="text-xs text-success">Saved</span>}
      </div>
    </form>
  );
}

type PasswordValues = { current: string; next: string; confirm: string };

function PasswordForm() {
  const change = useChangePassword();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ defaultValues: { current: "", next: "", confirm: "" } });

  const onSubmit = handleSubmit(({ current, next }) => {
    setError("");
    setDone(false);
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          reset();
          setDone(true);
        },
        onError: (err) => setError(err.message),
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
      <ErrorText message={error} />
      <Field id="pw-current" label="Current password" error={errors.current?.message}>
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          {...register("current", { required: "Current password is required" })}
        />
      </Field>
      <Field id="pw-next" label="New password" error={errors.next?.message}>
        <Input
          id="pw-next"
          type="password"
          autoComplete="new-password"
          {...register("next", {
            required: "New password is required",
            minLength: { value: 8, message: "At least 8 characters" },
            validate: (v) =>
              v !== getValues("current") || "Must differ from the current password",
          })}
        />
      </Field>
      <Field id="pw-confirm" label="Confirm new password" error={errors.confirm?.message}>
        <Input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          {...register("confirm", {
            validate: (v) => v === getValues("next") || "Passwords do not match",
          })}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? "Updating..." : "Update password"}
        </Button>
        {done && <span className="text-xs text-success">Password updated</span>}
      </div>
    </form>
  );
}

export function ProfileTab() {
  const { data: me } = useMe();
  if (!me) return <p className="text-xs text-muted">Loading...</p>;

  return (
    <div className="flex flex-col gap-8 max-w-md">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-fg">Profile</h2>
        <AvatarSection me={me} />
        <ProfileForm me={me} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-fg">Change password</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
