// PySanAntonio II — the one activation inside Startup + Tech Week that has its
// own brand. Values mirror the DEVSA site's `data/pysa/2026` so the two can't
// disagree about when or where it runs; update both if the event moves.
//
// The wordmark SVGs were copied into `public/pysa/` from
// devsanantonio/next-devsa. The mascot clip and still are hotlinked from the
// same S3 bucket that site uses — the video isn't served through next/image,
// so it needs no `remotePatterns` entry, but it does mean the band depends on
// a bucket this repo doesn't control.

/**
 * PySA's blue — its own accent, deliberately not SASTW's magenta.
 *
 * Its ink (#0a0a0a) used to live here too and grounded the band, but a second
 * near-black on a site whose sections are otherwise pure black read as drift
 * rather than as PySA's palette. The band sits on site black now and carries
 * its brand through this blue instead.
 */
export const PYSA_BLUE = "#4a90d9";

export const PYSA = {
  name: "PySanAntonio II",
  dateLabel: "Friday, October 2, 2026",
  timeLabel: "1:00 – 6:00 PM",
  venue: "Geekdom",
  venueDetail: "3rd Floor",

  // Two cuts of one mark, and the names say which *ground* each is for, not
  // which colour it is: `wordmark` is the lighter blue (#4a90d9) that PySA's
  // own dark band takes, `wordmarkOnLight` the deep #0059b7 for white. Both
  // pair that blue with the same #edca00.
  wordmark: "/pysa/wordmark-dark.svg",
  wordmarkOnLight: "/pysa/wordmark.svg",
  wordmarkWidth: 4066,
  wordmarkHeight: 958,

  /**
   * Trimmed to the loop and re-encoded, so nothing here has to hold a window
   * any more: the file starts where the loop starts and ends where it ends,
   * and `loop` on the element replays it from the buffer.
   *
   * The reel it came from was 6.8MB at 5.83Mbps for nine seconds, with its
   * moov atom after 7MB of media data — so the browser downloaded to the end
   * to find the index, started over, and did it again on every pass. This is
   * the same seven seconds at 930KB, faststart, visually identical (SSIM
   * 0.991, PSNR 41.2dB against a lossless cut).
   *
   * New filename on purpose: browsers and CDNs cache video by URL, so
   * replacing the bytes behind the old path would have left caches serving
   * the 6.8MB reel. Same trap the padlock hit.
   */
  video: "/pysa/pysa2-loop.mp4",
  mascotStill:
    "https://devsa-assets.s3.us-east-2.amazonaws.com/pysa/pysa2-bgdark.jpg",
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
