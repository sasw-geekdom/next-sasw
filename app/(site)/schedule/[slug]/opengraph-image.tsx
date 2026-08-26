import { boltOgImage, OG_SIZE } from "@/lib/og";
import { resolveSchedule, scheduleSlugs, whenLabels } from "@/lib/schedule";

// Per-page share card for everything under /schedule.
//
// These were the pages with no image at all: sharing an activation anywhere —
// LinkedIn, X, iMessage, Slack — produced a bare text card, on exactly the
// URLs this site exists to have shared. The index and the speaker pages each
// had their own card; this segment was simply never given one.
//
// Two shapes, because the segment serves two things. An activation leads with
// its own name and says when it runs; a venue leads with the room and says
// what it is. Both fall back to the generic schedule card if the slug doesn't
// resolve, which is what the crawler gets for a stale link.

export const alt = "San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

// Prerendered alongside the pages, so unfurling a shared link doesn't build a
// card on demand.
export function generateStaticParams() {
  return scheduleSlugs().map((slug) => ({ slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const schedule = resolveSchedule(slug);

  if (schedule?.kind === "activation") {
    const s = schedule.session;
    const when = s.when ? whenLabels(s.when) : null;

    // `ogTitle` where the activation sets one — the card is the surface with
    // the least room for a formal name and the most to lose to an extra line
    // of display type. Everything else falls through to its own title.
    const name = s.ogTitle ?? s.title;

    // Split on the same word the card and the page break on, so a long title
    // lays out as two readable lines rather than one that runs into the bolt.
    // `lines` renders each entry as a no-shrink span, so the split has to
    // happen here rather than being left to wrapping.
    const at = s.titleBreakBefore ? name.indexOf(s.titleBreakBefore) : -1;
    const lines =
      at > 0
        ? [{ text: name.slice(0, at).trimEnd() }, { text: name.slice(at) }]
        : [{ text: name }];

    return boltOgImage({
      eyebrow: s.venue.name,
      lines,
      // The date earns the space when it's locked; otherwise the circuit says
      // what kind of thing this is.
      tagline: when
        ? `${when.date} · ${when.time}`
        : `${s.circuit} · Sept 28 – Oct 2`,
    });
  }

  if (schedule?.kind === "venue") {
    return boltOgImage({
      eyebrow: "The schedule",
      lines: [{ text: schedule.room.name }],
      tagline: schedule.room.tag,
    });
  }

  return boltOgImage({
    eyebrow: "The schedule",
    lines: [{ text: "Five days," }, { text: "one", magenta: "current." }],
    tagline: "Confirmed activations · Sept 28 – Oct 2",
  });
}
