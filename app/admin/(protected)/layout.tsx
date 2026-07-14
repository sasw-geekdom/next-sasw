import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/shell/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real gate: verifies the session cookie, revocation, and role server-side.
  const user = await requireAdmin();

  // Read persisted sidebar state so the first paint matches (no flash).
  const store = await cookies();
  const collapsed = store.get("admin_sidebar")?.value === "collapsed";

  return (
    <AdminShell user={user} initialCollapsed={collapsed}>
      {children}
    </AdminShell>
  );
}
