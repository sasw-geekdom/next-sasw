import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Pitch a session — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "Plug in",
    lines: [{ text: "Get in the", magenta: "current." }],
    tagline: "Pitch a session · Sept 28 – Oct 2",
    titleSize: 84,
  });
}
