import type { Metadata } from "next";
import { getGalleryImages } from "@/lib/gallery";

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
      <section className="bg-black text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/og-geekdom.svg"
            alt="Geekdom"
            className="mx-auto h-9 w-auto sm:h-11"
          />
          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-magenta">
            The throwback
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-none sm:text-7xl">
            15 Years of Geekdom
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-white/60">
            Eleven years of San Antonio Startup + Tech Week. The people, the
            pitches, the late nights, and the community that plugged in. Here's
            the current — all the way back.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-16 text-center">
            <p className="font-display text-2xl font-bold text-foreground">
              The archive is loading.
            </p>
            <p className="mt-2 text-muted-foreground">
              80+ photos from 15 years are on the way. Check back soon.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {images.length} moments
            </p>
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.name}
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="mb-3 w-full break-inside-avoid rounded-lg border border-border"
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
