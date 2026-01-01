import { ApiError } from "./http";
import type { Role } from "./models";

export type Permission =
  | "project:read"
  | "project:write"
  | "entity:read"
  | "entity:write"
  | "story:read"
  | "story:write"
  | "continuity:check"
  | "prompt:compose"
  | "export:read"
  | "version:publish";

const rolePermissions: Record<Role, Set<Permission>> = {
  ADMIN: new Set([
    "project:read",
    "project:write",
    "entity:read",
    "entity:write",
    "story:read",
    "story:write",
    "continuity:check",
    "prompt:compose",
    "export:read",
    "version:publish",
  ]),
  WRITER: new Set([
    "project:read",
    "entity:read",
    "entity:write",
    "story:read",
    "story:write",
    "continuity:check",
  ]),
  EDITOR: new Set([
    "project:read",
    "entity:read",
    "story:read",
    "continuity:check",
    "prompt:compose",
    "export:read",
  ]),
};

export function requirePermission(roles: Role[], permission: Permission) {
  const ok = roles.some((r) => rolePermissions[r]?.has(permission));
  if (!ok) {
    throw new ApiError("FORBIDDEN", 403, "Forbidden");
  }
}
