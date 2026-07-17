import { boltOgImage, OG_SIZE } from "@/lib/og";

export const alt = "San Antonio Startup + Tech Week — Sept 28 – Oct 2, 2026";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function OgImage() {
  return boltOgImage({
    eyebrow: "Sept 28 – Oct 2, 2026",
    lines: [{ text: "San Antonio" }, { text: "Startup + Tech Week" }],
    tagline: "Plug in.",
    titleSize: 78,
  });
}
