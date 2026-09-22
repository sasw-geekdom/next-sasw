// Admin navigation model — shared by the sidebar, breadcrumb, and command menu.

import {
  LayoutGrid,
  Mic,
  Users,
  UserCheck,
  Handshake,
  Inbox,
  Star,
  Calendar,
  Layers,
  Mail,
  Images,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Ops / review.
export const PRIMARY_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/speakers", label: "Speakers", icon: Mic },
  { href: "/admin/registrations", label: "Registrations", icon: Users },
  { href: "/admin/get-involved", label: "Get Involved", icon: Inbox },
  { href: "/admin/checkin", label: "Check-in", icon: UserCheck },
];

// Content management.
export const CONTENT_NAV: NavItem[] = [
  { href: "/admin/content/partners", label: "Partners", icon: Handshake },
  { href: "/admin/content/sponsors", label: "Sponsors", icon: Star },
  { href: "/admin/content/speakers", label: "Speakers", icon: Mic },
  { href: "/admin/content/sessions", label: "Sessions", icon: Calendar },
  { href: "/admin/content/emails", label: "Emails", icon: Mail },
  { href: "/admin/content/gallery", label: "Gallery", icon: Images },
];

export const ALL_NAV: NavItem[] = [
  ...PRIMARY_NAV,
  { href: "/admin/content", label: "Content", icon: Layers },
  ...CONTENT_NAV,
];

// Longest-prefix match so /admin/content/sponsors resolves to Sponsors, not Content.
export function activeHref(pathname: string): string | null {
  const match = ALL_NAV.filter(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? null;
}

// Breadcrumb trail from a pathname, e.g. Content › Sponsors.
export function breadcrumb(pathname: string): NavItem[] {
  const trail: NavItem[] = [];
  const inContent = pathname.startsWith("/admin/content");
  if (inContent && pathname !== "/admin/content") {
    trail.push({ href: "/admin/content", label: "Content", icon: Layers });
  }
  const active = ALL_NAV.find((n) => n.href === activeHref(pathname));
  if (active) trail.push(active);
  return trail;
}

/**
 * The nav a role actually has.
 *
 * A door account can open one screen, so it is shown one link and no Content
 * group. This is cosmetic — `requireAdmin` is what enforces it, and a hidden
 * link typed into the address bar still lands on the check-in page — but a
 * sidebar full of doors that bounce you is a worse tool than a sidebar with
 * one door that opens.
 */
export function navFor(role: Role): { primary: NavItem[]; content: NavItem[] } {
  if (role === "door") {
    return {
      primary: PRIMARY_NAV.filter((n) => n.href === "/admin/checkin"),
      content: [],
    };
  }
  return { primary: PRIMARY_NAV, content: CONTENT_NAV };
}
