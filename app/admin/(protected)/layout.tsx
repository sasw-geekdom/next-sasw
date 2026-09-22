import type { Metadata } from "next";
import { cookies } from "next/headers";
import { requireAdmin, DOOR_AND_STAFF } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /**
   * Real gate: verifies the session cookie, revocation, and role server-side.
   *
   * Every role that has any page at all, because this layout wraps the
   * check-in screen too — gating it to staff here would redirect a door
   * account to /admin/checkin, which renders inside this layout, which would
   * redirect it again. The page-level guards are what actually divide the
   * portal; this one only asks whether you are signed in.
   */
  const user = await requireAdmin(DOOR_AND_STAFF);

  // Read persisted sidebar state so the first paint matches (no flash).
  const store = await cookies();
  const collapsed = store.get("admin_sidebar")?.value === "collapsed";

  return (
    <AdminShell user={user} initialCollapsed={collapsed}>
      {children}
    </AdminShell>
  );
}
