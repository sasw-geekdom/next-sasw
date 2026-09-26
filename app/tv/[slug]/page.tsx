import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TvLoop } from "@/components/tv/tv-loops";
import { TvStage } from "@/components/tv/tv-stage";
import {
  TV_DAYS,
  TV_EVENTS,
  tvDay,
  tvEvent,
  tvGroup,
  tvGroups,
  tvWeek,
  type TvData,
} from "@/lib/tv";

// One loop per screen: /tv/week, /tv/<event>, /tv/<day>, /tv/<group>.
//
// ISR'd like the schedule (300s) and busted by the same CMS saves — see
// `revalidateActivationPages` in lib/admin/cms-actions.ts — and the stage
// calls `router.refresh()` every few minutes, so an edit reaches a TV that
// has been on since morning without anyone touching it.

export const revalidate = 300;

export async function generateStaticParams() {
  const groups = await tvGroups().catch(() => []);
  return [
    { slug: "week" },
    ...TV_EVENTS.map((slug) => ({ slug })),
    ...Object.keys(TV_DAYS).map((slug) => ({ slug })),
    ...groups.map((g) => ({ slug: g.slug })),
  ];
}

async function load(slug: string): Promise<TvData | null> {
  if (slug === "week") return tvWeek();
  if ((TV_EVENTS as readonly string[]).includes(slug))
    return tvEvent(slug as (typeof TV_EVENTS)[number]);
  if (slug in TV_DAYS) return tvDay(slug);
  return tvGroup(slug);
}

const NAMES: Record<string, string> = {
  week: "Startup + Tech Week",
  "the-model": "The Model",
  "access-granted": "Access Granted",
  pysanantonio: "PySanAntonio",
  tuesday: "Tuesday at Geekdom",
  thursday: "Thursday at Geekdom",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `TV · ${NAMES[slug] ?? slug}` };
}

export default async function TvPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  return (
    <TvStage>
      <TvLoop data={data} />
    </TvStage>
  );
}
