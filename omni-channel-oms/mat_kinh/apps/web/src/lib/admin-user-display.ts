import type { User } from "@optiqis/shared";

/**
 * Return initials for the user avatar.
 * "System Admin" -> "SA", "Thai Van Nam" -> "TN"
 */
export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? "";
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

/** Human-readable label for each role. */
export const ROLE_LABELS: Record<User["role"], string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  MEDICAL_REVIEWER: "Reviewer",
};

/** Color variant for each role badge. */
export const ROLE_COLORS: Record<User["role"], string> = {
  ADMIN: "bg-[color:var(--primary)] text-white",
  EDITOR: "bg-[color:var(--secondary)] text-white",
  MEDICAL_REVIEWER:
    "bg-[color:var(--surface-soft)] text-[color:var(--primary)]",
};
