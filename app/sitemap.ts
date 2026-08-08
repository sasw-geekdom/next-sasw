import type { MetadataRoute } from "next";
import { loadLineup } from "@/lib/speakers";
import { scheduleSlugs, venueRedirect } from "@/lib/schedule";
import { SITE_URL } from "@/lib/event";

const BASE = SITE_URL;

const STATIC_ROUTES = [
  "",
  "/speakers",
  "/schedule",
  "/register",
  "/plug-in",
  "/get-involved",
  "/15-years",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Speaker pages are the reason slugs exist — they're what gets shared, so
  // they belong in the sitemap. `loadLineup` swallows Firestore failures and
  // returns [], which degrades to the static routes rather than a build error.
  const lineup = await loadLineup();

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${BASE}${path}`,
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
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...lineup.map((s) => ({
      url: `${BASE}/speakers/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
