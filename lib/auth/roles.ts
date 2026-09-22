/**
 * Three roles now, and the third exists because the first two are both "all
 * of it".
 *
 *   superadmin — full access + user management (outside the workspace domain)
 *   staff      — full admin (Geekdom workspace accounts)
 *   door       — the check-in screen, and nothing else
 *
 * `door` is for the people running a badge desk who are not on the week's
 * staff: Launch SA at Central Library, and anyone else who mans a desk. They
 * need to search a name, tick somebody off and add a walk-up. They do not need
 * the registration export, the Get Involved inbox or the CMS, and handing an
 * external team a login that opens all three because the model had no smaller
 * door is how an events tool ends up leaking a mailing list.
 *
 * It is an allowlist rather than a domain, deliberately: a domain gate hands
 * access to every account an organisation ever creates, and this one is for
 * named people working a specific week.
 */
export type Role = "superadmin" | "staff" | "door";

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

/**
 * The named check-in accounts, comma-separated.
 *
 * Set in the Vercel project, not here. Any Google account can be listed —
 * these do not have to be workspace addresses, they only have to be able to
 * sign in with Google.
 */
function doorEmails(): string[] {
  return (process.env.DOOR_EMAILS ?? "")
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
  // Last, so a staff address that also appears on the door list keeps the
  // wider role rather than being demoted by it.
  if (doorEmails().includes(normalized)) return "door";
  return null;
}

export function isAllowed(email: string | undefined | null): boolean {
  return resolveRole(email) !== null;
}

/**
 * Full access, as opposed to the door.
 *
 * Pages and actions say this with `requireAdmin()`, whose default already
 * excludes `door`. Route handlers cannot: they answer with a status rather
 * than a redirect, so they check the user themselves — and the three CSV
 * exports are exactly the data a badge desk has no business downloading.
 */
export function isStaff(user: { role: Role } | null | undefined): boolean {
  return user?.role === "staff" || user?.role === "superadmin";
}
