// Two-tier role model (locked decision #2).
//   superadmin — full access + user management (outside the workspace domain)
//   staff      — full admin (Geekdom workspace accounts)
export type Role = "superadmin" | "staff";

export interface AdminUser {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: Role;
}

function superAdminEmails(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function allowedDomain(): string {
  return (process.env.ALLOWED_WORKSPACE_DOMAIN ?? "geekdom.com").toLowerCase();
}

/**
 * Resolve a role from an email, or null if the account is not permitted.
 * This is the single source of truth for who may enter the admin portal.
 */
export function resolveRole(email: string | undefined | null): Role | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();

  if (superAdminEmails().includes(normalized)) return "superadmin";
  if (normalized.endsWith(`@${allowedDomain()}`)) return "staff";
  return null;
}

export function isAllowed(email: string | undefined | null): boolean {
  return resolveRole(email) !== null;
}
