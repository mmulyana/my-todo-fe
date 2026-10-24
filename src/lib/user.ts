import type { User } from "../types";

export function userLabel(user?: Pick<User, "username" | "displayName"> | null) {
  return user?.displayName || user?.username || "";
}
