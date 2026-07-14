import type { Metadata } from "next";
import { getGalleryImages } from "@/lib/gallery";
import { FifteenHero } from "@/components/site/fifteen-hero";
import { MemoryLane } from "@/components/site/memory-lane";

export const metadata: Metadata = {
  title: "15 Years of Geekdom",
  description:
    "Fifteen years of Geekdom, eleven years of San Antonio Startup + Tech Week — the people, the pitches, the community.",
};

export const dynamic = "force-dynamic";

export default async function FifteenYearsPage() {
  const images = await getGalleryImages();

  return (
    <main className="flex-1">
      <FifteenHero />
      {images.length > 0 && <MemoryLane images={images} />}
    </main>
  );
}
