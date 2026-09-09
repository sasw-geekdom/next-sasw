"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "motion/react";
import { Sidebar } from "@/components/admin/shell/sidebar";
import { MobileNav } from "@/components/admin/shell/mobile-nav";
import { Topbar } from "@/components/admin/shell/topbar";
import { CommandMenu } from "@/components/admin/shell/command-menu";
import type { AdminUser } from "@/lib/auth/roles";

const COOKIE = "admin_sidebar";

export function AdminShell({
  user,
  initialCollapsed,
  children,
}: {
  user: AdminUser;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      document.cookie = `${COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  // Close the mobile drawer on route change (belt-and-suspenders alongside onNavigate).
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Global ⌘K / Ctrl+K.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* `h-dvh flex-none`, not `h-full flex-1`.

          `<main>` below is `overflow-y-auto`, which never did anything: the
          shell is a flex item of `<body>`, and `<body>` is `min-h-full` — so
          its height is content-driven, `flex-1` resolves `flex-basis: 0%`, and
          an item whose basis wins over its height never gets a definite one to
          pass down. `<main>` therefore grew with its content and the document
          did the scrolling, while still being a scroll container as far as the
          browser was concerned. Anything `position: sticky` inside it bound to
          a scrollport that could not move, which is why the registrations
          table's header would not stick.

          The height has to be stated here and the flex basis has to get out of
          its way — `h-dvh` alone is ignored while `flex-1` is on. Not on
          `<body>`, which the public site shares. */}
      <div className="flex h-dvh flex-none overflow-hidden">
        <Sidebar user={user} collapsed={collapsed} onToggle={toggleCollapsed} />
        <MobileNav
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          user={user}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenCommand={() => setCmdOpen(true)}
            onOpenNav={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
        <CommandMenu open={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>
    </MotionConfig>
  );
}
