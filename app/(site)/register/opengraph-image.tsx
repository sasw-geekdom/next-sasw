import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Register free — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "Register · Free",
    lines: [{ text: "Get on the", magenta: "list." }],
    tagline: "Sept 28 – Oct 2 · Downtown San Antonio",
  });
}
