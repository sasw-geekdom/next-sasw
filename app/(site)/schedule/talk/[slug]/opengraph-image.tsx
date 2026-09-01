import { boltOgImage, OG_SIZE } from "@/lib/og";
import { listTalks, resolveTalk } from "@/lib/talks";

// Per-talk share card. The point of giving a talk its own URL is that the
// speaker posts it, so the preview carries the talk's name and theirs — not
// the site's.
export const alt = "A talk at San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

// Prerender alongside the pages, so a crawler unfurling a shared link doesn't
// pay a cold Firestore read to build the card.
export async function generateStaticParams() {
  return (await listTalks()).map((t) => ({ slug: t.row.slug }));
}

// A talk title runs long where a speaker's name does not — "Building Nopalera
// on Her Own Terms: A Founder Fireside Chat with Sandra Velasquez" is 76
// characters against a name's 15. At the 96px default that overruns the card,
// so the size steps down past the lengths that still fit.
function titleSize(title: string): number {
  if (title.length > 70) return 56;
  if (title.length > 45) return 68;
  return 88;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const talk = (await resolveTalk(slug))?.talk ?? null;

  // Everything `boltOgImage` reads lives in public/brand — see the note there.
  // This route renders on demand for any talk added since the last deploy, so
  // it is exactly the case that used to throw ENOENT on a font behind a pnpm
  // symlink. Nothing here may reach into node_modules.
  if (!talk) {
    return boltOgImage({
      eyebrow: "The week",
      lines: [{ text: "Five days" }, { text: "one", magenta: "current." }],
      tagline: "Sept 28 – Oct 2 · San Antonio",
    });
  }

  const who = talk.row.participants
    .map((p) => p.name)
    .filter(Boolean)
    .join(" · ");

  return boltOgImage({
    eyebrow: talk.row.track ?? "On the schedule",
    lines: [{ text: talk.row.title }],
    titleSize: titleSize(talk.row.title),
    tagline: [who, talk.room?.name].filter(Boolean).join(" · "),
  });
}
