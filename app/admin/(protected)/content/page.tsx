import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import {
  listPartners,
  listSponsors,
  listSpeakers,
  listSessions,
} from "@/lib/admin/cms-queries";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { href: "/admin/content/partners", label: "Partners", blurb: "Logos + links." },
  { href: "/admin/content/sponsors", label: "Sponsors", blurb: "Who's powering it." },
  { href: "/admin/content/speakers", label: "Speakers", blurb: "The people on stage." },
  { href: "/admin/content/sessions", label: "Sessions", blurb: "The schedule." },
] as const;

export default async function ContentHub() {
  await requireAdmin();
  const [partners, sponsors, speakers, sessions] = await Promise.all([
    listPartners(),
    listSponsors(),
    listSpeakers(),
    listSessions(),
  ]);
  const counts: Record<string, number> = {
    "/admin/content/partners": partners.length,
    "/admin/content/sponsors": sponsors.length,
    "/admin/content/speakers": speakers.length,
    "/admin/content/sessions": sessions.length,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Content"
        description="Everything that powers the public site."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col gap-2 rounded-lg border border-border bg-white p-5 transition-colors hover:border-magenta"
          >
            <div className="font-display text-4xl font-bold">
              {counts[s.href]}
            </div>
            <div className="font-medium">{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.blurb}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
