// PySanAntonio II — the one activation inside Startup + Tech Week that has its
// own brand. Values mirror the DEVSA site's `data/pysa/2026` so the two can't
// disagree about when or where it runs; update both if the event moves.
//
// The wordmark SVGs were copied into `public/pysa/` from
// devsanantonio/next-devsa. The mascot clip and still are hotlinked from the
// same S3 bucket that site uses — the video isn't served through next/image,
// so it needs no `remotePatterns` entry, but it does mean the band depends on
// a bucket this repo doesn't control.

/** PySA's ink, blue and yellow — its palette, deliberately not SASTW's. */
export const PYSA_INK = "#0a0a0a";
export const PYSA_BLUE = "#4a90d9";

export const PYSA = {
  name: "PySanAntonio II",
  dateLabel: "Friday, October 2, 2026",
  timeLabel: "1:00 – 6:00 PM",
  venue: "Geekdom",
  venueDetail: "3rd Floor",

  wordmark: "/pysa/wordmark-dark.svg",
  wordmarkWidth: 4066,
  wordmarkHeight: 958,

  video: "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/pysa2.mp4",
  mascotStill:
    "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/pysa2-bgdark.jpg",
  /** The reel is longer than the loop we want; hold this window. */
  clip: { start: 1.3, end: 8.4 },
} as const;

/**
 * The orgs running PySanAntonio — mirrors `PYSA_ORGANIZERS` on the DEVSA site.
 *
 * Logos are hotlinked from the same bucket rather than copied in, so a
 * refreshed mark propagates without a deploy here. They render through a plain
 * `<img>`: one is an SVG, which next/image won't optimize without
 * `dangerouslyAllowSVG`, and none of them are large enough to be worth adding
 * a third-party host to `remotePatterns` for.
 */
export const PYSA_ORGANIZERS = [
  {
    name: "Alamo Python",
    href: "https://www.devsa.community/buildingtogether/alamo-python",
    logo: "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/flyers-46-alamo-py-white.png",
    heightClass: "h-12 sm:h-14",
  },
  {
    name: "PyTexas Foundation",
    href: "https://www.pytexas.org/",
    logo: "https://devsa-assets.s3.us-east-2.amazonaws.com/pytexas.png",
    heightClass: "h-12 sm:h-14",
  },
  {
    name: "DEVSA",
    href: "https://www.devsa.community/",
    logo: "https://devsa-assets.s3.us-east-2.amazonaws.com/devsa-logo.svg",
    heightClass: "h-10 sm:h-12",
  },
] as const;
