import { boltOgImage, OG_SIZE } from "@/lib/og";
import { loadLineup, resolveSlug } from "@/lib/speakers";

// Per-speaker share card — the whole point of giving speakers their own URL
// is that they post it, so the preview should carry their name, not the
// site's. Falls back to the generic lineup card if the slug doesn't resolve.
export const alt = "Speaking at San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

// Prerender alongside the pages — otherwise every crawler that unfurls a
// shared link pays a cold Firestore read to build the card.
export async function generateStaticParams() {
  const lineup = await loadLineup();
  return lineup.map((s) => ({ slug: s.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const speaker = resolveSlug(await loadLineup(), slug)?.speaker;

  const role = speaker
    ? [speaker.title, speaker.company].filter(Boolean).join(" · ")
    : "";

  // A lone span wraps inside the text column, so even a long name lays out
  // cleanly — unlike a `text` + `magenta` pair, which can't break between the
  // two spans. Keep the name as the only line.
  return boltOgImage({
    eyebrow: "The lineup",
    lines: speaker
      ? [{ text: speaker.name }]
      : [{ text: "Every name" }, { text: "on the", magenta: "grid." }],
    tagline: role || "Sept 28 – Oct 2 · San Antonio",
  });
}
