import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt = "The schedule — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "The schedule",
    // Two lines: a `text` + `magenta` row renders as no-shrink spans that
    // can't wrap between them, so a long single line runs into the bolt.
    lines: [{ text: "Coming online," }, { text: "room by", magenta: "room." }],
    tagline: "Confirmed activations · Sept 28 – Oct 2",
  });
}
