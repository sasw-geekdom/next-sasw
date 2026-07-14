// Admin navigation model — shared by the sidebar, breadcrumb, and command menu.

import {
  LayoutGrid,
  Mic,
  Users,
  UserCheck,
  Handshake,
  Star,
  Calendar,
  Layers,
  Mail,
  Images,
  type LucideIcon,
} from "lucide-react";

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
