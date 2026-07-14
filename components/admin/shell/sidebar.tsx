"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Brand,
  NavSections,
  AccountBadge,
} from "@/components/admin/shell/nav-sections";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AdminUser } from "@/lib/auth/roles";

/** Desktop-only persistent rail. Mobile uses MobileNav. */
export function Sidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: AdminUser;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-white transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Brand collapsed={collapsed} />
      </div>

      <NavSections collapsed={collapsed} />

      <div className="border-t border-border p-2">
        <AccountBadge user={user} collapsed={collapsed} />
        <div
          className={cn(
            "flex items-center pt-1",
            collapsed ? "justify-center" : "justify-between px-1",
          )}
        >
          {!collapsed && <SignOutButton />}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ToggleIcon className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </aside>
  );
}
