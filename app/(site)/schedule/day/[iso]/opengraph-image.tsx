import { boltOgImage, OG_SIZE } from "@/lib/og";
import { EVENT_DAYS } from "@/lib/event";

/**
 * A card per day.
 *
 * These five were the only public pages on the site with no `og:image` at all.
 * They inherit nothing: `/schedule/opengraph-image` covers that segment, not
 * this one, so a shared day — which is the whole reason this route exists,
 * "here's Tuesday" — unfurled as a bare title on a blank card.
 *
 * Static params rather than a runtime lookup, for the same reason the page
 * prerenders: there are exactly five and they are known at build time.
 */
export const alt = "A day at San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return EVENT_DAYS.map((d) => ({ iso: d.iso }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ iso: string }>;
}) {
  const { iso } = await params;
  const day = EVENT_DAYS.find((d) => d.iso === iso);
  const weekday = new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
  });

  return boltOgImage({
    eyebrow: day ? `Day ${EVENT_DAYS.indexOf(day) + 1} of 5` : "The schedule",
    // One white line. The other cards hand their last word to magenta, and
    // this one does not: an empty `text` with a `magenta` renders an empty
    // span plus a 20%-of-title left margin, which indents the weekday off the
    // grid every other card sits on. The eyebrow above is already magenta,
    // and the page's own h1 sets the weekday in plain white too.
    lines: [{ text: `${weekday}.` }],
    tagline: day
      ? `${day.label} · Every room, side by side`
      : "Sept 28 – Oct 2 · San Antonio",
  });
}
