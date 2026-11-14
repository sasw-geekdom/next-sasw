import { boltOgImage, OG_SIZE } from "@/lib/og";

// The report's cover, as the card a pasted link unfurls into — Geekdom sends
// this page as a link, so the preview is the first thing a sponsor sees.
export const alt = "2026 Sponsor Report — San Antonio Startup + Tech Week";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "2026 Sponsor Report",
    // The cover's own three lines, its last one all magenta as on the page.
    lines: [{ text: "You helped make" }, { text: "the current" }, { text: "", magenta: "run through SA." }],
    tagline: "Sept 28 – Oct 2, 2026",
    titleSize: 84,
  });
}
