import { boltOgImage, OG_SIZE } from "@/lib/og";

/**
 * The share card for /faq.
 *
 * Every other route in the app defines one of these, and the reason this file
 * has to exist rather than inheriting `app/opengraph-image.tsx` is that the
 * root card does not cascade here: measured, /faq was the one page on the site
 * shipping no `og:image` tag at all, so a link to it previewed as a bare
 * title. A metadata file covers the segment it sits in; a route that wants a
 * card brings its own.
 *
 * The headline is the page's, minus the middle word — "Doors, badges,
 * parking." sets to three lines at card size, and a share card is read at
 * thumbnail scale where three lines of display type is a grey block.
 */
export const alt =
  "Badge pickup, parking and rooms — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "Know before you go",
    lines: [{ text: "Badges,", magenta: "parking." }],
    tagline: "Three desks · Four garages · Sept 28 – Oct 2",
  });
}
