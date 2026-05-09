import type { UserRole } from "@/lib/types";

/** Compare DB role string to expected enum (trim + case-insensitive). */
export function profileMatchesRole(
  roleFromDb: string | null | undefined,
  expected: UserRole
): boolean {
  if (typeof roleFromDb !== "string") return false;
  const r = roleFromDb.trim().toLowerCase();
  return r === expected;
}
