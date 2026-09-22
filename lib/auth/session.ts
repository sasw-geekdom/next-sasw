import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/admin";
import { resolveRole, type AdminUser, type Role } from "@/lib/auth/roles";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

/**
 * Exchange a Firebase ID token for a server-verified session cookie.
 * Rejects any account that doesn't resolve to a role (domain gate + superadmin).
 * Returns the cookie string + maxAge on success, or null if not permitted.
 */
export async function createSession(
  idToken: string,
): Promise<{ cookie: string; maxAge: number; user: AdminUser } | null> {
  const decoded = await adminAuth.verifyIdToken(idToken, true);
  const role = resolveRole(decoded.email);
  if (!role) return null;

  const cookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });

  return {
    cookie,
    maxAge: EXPIRES_IN_MS / 1000,
    user: {
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      role,
    },
  };
}

/** Read + verify the current session. Returns the admin user or null. */
export async function getSessionUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    // checkRevoked = true — a disabled/rotated account loses access immediately.
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const role = resolveRole(decoded.email);
    if (!role) return null;

    return {
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Who a page or action is for, where it is not everybody.
 *
 * Check-in is the only surface the `door` role reaches, so it names itself
 * here and every other caller keeps the bare `requireAdmin()` it already had.
 * That is the whole point of the default: a page added next year is staff-only
 * without anybody remembering to make it so, and the failure mode of
 * forgetting is a locked door rather than an open one.
 */
export const DOOR_AND_STAFF: Role[] = ["superadmin", "staff", "door"];

/**
 * Guard for server components / route handlers. Redirects to login if absent.
 *
 * `allow` defaults to the two full-access roles. A `door` account that reaches
 * anything else is sent to the one screen it has rather than to the login page
 * — it is signed in correctly, it is just somewhere it cannot be.
 */
export async function requireAdmin(
  allow: Role[] = ["superadmin", "staff"],
): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!allow.includes(user.role)) {
    redirect(user.role === "door" ? "/admin/checkin" : "/admin");
  }
  return user;
}

/** Guard that additionally requires the superadmin role. */
export async function requireRole(role: Role): Promise<AdminUser> {
  const user = await requireAdmin();
  if (role === "superadmin" && user.role !== "superadmin") {
    redirect("/admin");
  }
  return user;
}
