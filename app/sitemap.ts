import type { MetadataRoute } from "next";
import { loadLineup } from "@/lib/speakers";

const BASE = "https://sasw.co";

const STATIC_ROUTES = [
  "",
  "/speakers",
  "/sessions",
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
    ...lineup.map((s) => ({
      url: `${BASE}/speakers/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
