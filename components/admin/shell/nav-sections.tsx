"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV,
  CONTENT_NAV,
  activeHref,
  type NavItem,
} from "@/lib/admin/nav";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/lib/auth/roles";

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/sastw-bolt.svg"
        alt="SASTW"
        className="h-7 w-7 shrink-0"
      />
      {!collapsed && (
        <span className="font-display text-sm font-bold uppercase tracking-tight">
          SASTW<span className="text-magenta"> Admin</span>
        </span>
      )}
    </Link>
  );
}

export function NavSections({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
      <ul className="flex flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={active === item.href}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>

      <div className="mt-5">
        {!collapsed && (
          <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Content
          </div>
        )}
        <ul className="flex flex-col gap-0.5">
          {CONTENT_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={active === item.href}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </div>

      {/* Escape hatch back to the public site. */}
      <div className="mt-auto border-t border-border pt-2">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "View site" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <ArrowUpRight className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
          {!collapsed && <span className="truncate">View site</span>}
        </Link>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Icon
          className={cn("h-[18px] w-[18px] shrink-0", active && "text-magenta")}
          strokeWidth={1.5}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

export function AccountBadge({
  user,
  collapsed = false,
}: {
  user: AdminUser;
  collapsed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5",
        collapsed && "justify-center",
      )}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium uppercase">
        {user.email[0]}
      </span>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{user.email}</div>
          <Badge tone={user.role === "superadmin" ? "magenta" : "blue"}>
            {user.role}
          </Badge>
        </div>
      )}
    </div>
  );
}
