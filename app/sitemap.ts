import type { MetadataRoute } from "next";
import { loadLineup } from "@/lib/speakers";
import { scheduleSlugs, venueRedirect } from "@/lib/schedule";
import { allTalks } from "@/lib/talks";
import { EVENT_DAYS, SITE_URL } from "@/lib/event";

const BASE = SITE_URL;

const STATIC_ROUTES = [
  "",
  "/speakers",
  "/schedule",
  "/register",
  "/get-involved",
  "/15-years",
];

/**
 * One date for the whole sitemap.
 *
 * `lastModified` is the only one of the three hints Google still reads —
 * it has said publicly that it ignores `changeFrequency` and `priority`,
 * which is what every entry here used to carry and nothing else. So the file
 * was advertising exclusively in signals the reader discards.
 *
 * Build time rather than a per-page timestamp, and honestly so: this is a
 * statically generated site whose pages are rebuilt together, and the CMS
 * rows behind them carry `createdAt` rather than an edit time. A per-entry
 * date would have to be invented to look more precise than the truth.
 */
const LAST_MODIFIED = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Speaker pages are the reason slugs exist — they're what gets shared, so
  // they belong in the sitemap. `loadLineup` swallows Firestore failures and
  // returns [], which degrades to the static routes rather than a build error.
  const lineup = await loadLineup();

  // Talks with their own page. `listTalks` is the same source /schedule/talk
  // builds its routes from, so this cannot list one that 404s or miss one that
  // exists — which it did: eleven talk pages, each with its own OG card and
  // its own Event markup, were absent from here entirely.
  const talks = await allTalks().catch(() => []);

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${BASE}${path}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    // One page per venue under /schedule. Derived rather than listed, so a
    // room gaining or losing its programming can't leave a 404 in here.
    ...scheduleSlugs()
      // A single-activation venue slug only redirects to its activation, and
      // listing a redirect asks Google to crawl a hop to a URL already here.
      .filter((slug) => !venueRedirect(slug))
      .map((slug) => ({
        url: `${BASE}/schedule/${slug}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    // The five days. Prerendered, linkable and the obvious thing to send
    // someone — "here's Tuesday" is the reason the route exists — and they
    // were not listed.
    ...EVENT_DAYS.map((d) => ({
      url: `${BASE}/schedule/day/${d.iso}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...talks.map((t) => ({
      url: `${BASE}/schedule/talk/${t.row.slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...lineup.map((s) => ({
      url: `${BASE}/speakers/${s.slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
