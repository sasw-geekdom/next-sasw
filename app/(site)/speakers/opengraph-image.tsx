import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt = "The speaker lineup — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "The lineup",
    // Two lines, not one: a `text` + `magenta` row renders as no-shrink spans
    // that can't wrap between them, so a long single line runs past the text
    // column and into the bolt. Matches the page's own h1.
    lines: [{ text: "Every name" }, { text: "on the", magenta: "grid." }],
    tagline: "Five circuits · Sept 28 – Oct 2",
  });
}
