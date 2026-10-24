import { resolveAttachmentUrl } from "../api";
import { userLabel } from "@/lib/user";
import { cn } from "@/lib/utils";
import type { User } from "../types";

type AvatarProps = {
  user?: Pick<User, "username" | "email" | "displayName" | "avatarUrl"> | null;
  size?: number;
  className?: string;
};

export function Avatar({ user, size = 26, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.46) };

  if (user?.avatarUrl) {
    return (
      <img
        src={resolveAttachmentUrl(user.avatarUrl)}
        alt=""
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      style={style}
      className={cn(
        "shrink-0 flex items-center justify-center rounded-full bg-accent text-white font-medium uppercase",
        className,
      )}
    >
      {(userLabel(user) || user?.email || "?").slice(0, 1)}
    </span>
  );
}
