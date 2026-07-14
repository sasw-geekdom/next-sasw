"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { breadcrumb } from "@/lib/admin/nav";

export function Topbar({
  onOpenCommand,
  onOpenNav,
}: {
  onOpenCommand: () => void;
  onOpenNav: () => void;
}) {
  const pathname = usePathname();
  const trail = breadcrumb(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenNav}
          aria-label="Open menu"
          className="-ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.6} />
        </button>

        <nav className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link
            href="/admin"
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            Admin
          </Link>
          {trail.map((item, i) => {
            const last = i === trail.length - 1;
            return (
              <span key={item.href} className="flex min-w-0 items-center gap-1.5">
                <span className="hidden text-muted-foreground/50 sm:inline">/</span>
                {last ? (
                  <span className="truncate font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      <button
        onClick={onOpenCommand}
        className="flex shrink-0 items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted sm:px-3"
      >
        <Search className="h-4 w-4" strokeWidth={1.6} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded bg-muted px-1.5 font-mono text-xs sm:inline">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
