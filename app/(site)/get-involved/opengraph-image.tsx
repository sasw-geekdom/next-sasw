import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt =
  "Sponsor, host an event, or ask — San Antonio Startup + Tech Week 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "Get involved",
    lines: [{ text: "Power the", magenta: "week." }],
    tagline: "Sponsor · Host an event · Sept 28 – Oct 2",
  });
}
