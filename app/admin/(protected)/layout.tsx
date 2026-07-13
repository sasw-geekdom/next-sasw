import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/speakers", label: "Speakers" },
  { href: "/admin/registrations", label: "Registrations" },
  { href: "/admin/checkin", label: "Check-in" },
  { href: "/admin/content", label: "Content" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real gate: verifies the session cookie, revocation, and role server-side.
  const user = await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-display text-lg font-bold uppercase tracking-tight"
            >
              SASTW<span className="text-magenta"> Admin</span>
            </Link>
            <nav className="hidden gap-4 text-sm text-muted-foreground md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Badge tone={user.role === "superadmin" ? "magenta" : "blue"}>
              {user.role}
            </Badge>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
