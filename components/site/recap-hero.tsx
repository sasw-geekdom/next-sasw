import Image from "next/image";
import Link from "next/link";
import { BoltShader } from "@/components/site/bolt-shader";
import { DriftingBolts } from "@/components/site/drifting-bolts";
import { RecapStrip } from "@/components/site/recap-strip";
import { RECAP, type RecapColumn, type RecapPhoto } from "@/lib/recap";
import { cn } from "@/lib/utils";

// The homepage hero after the week: the "ultimate" thank-you social video,
// rebuilt live. A filmstrip of the week's photos — spotlight frames for the
// best shots, stacked pairs between — scrolls past on a loop, the week's mini
// bolts drift up behind the whole hero, and the live WebGL bolt sits beside
// the headline. Live rather than the video file: that is a 1080×1350 phone
// clip, where this is sharp at every width and only fetches the image sizes
// a screen needs.
//
// The loop is CSS: the strip is drawn twice and slides left by exactly one
// copy, so it never visibly restarts. A button pauses it (recap-strip.tsx),
// and it holds still for anyone who has asked for reduced motion.
//
// Hero (hero.tsx) is the pre-week version, still in the tree for year 12.

const MAGENTA = "#ff32a0";

function Card({ p, spotlight, eager }: { p: RecapPhoto; spotlight: boolean; eager: boolean }) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl",
        spotlight
          ? "shadow-[0_0_0_2px_#ff32a0,0_20px_60px_rgba(255,50,160,0.3)]"
          : "shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.6)]",
      )}
    >
      <Image
        src={p.src}
        alt={p.cap ? `${p.cap}, San Antonio Startup + Tech Week 2026` : ""}
        fill
        // The tallest card is the spotlight at ~560px on a wide screen; it
        // is about 0.8 of that wide.
        sizes={spotlight ? "(min-width: 1536px) 460px, (min-width: 1024px) 380px, 290px" : "(min-width: 1536px) 300px, (min-width: 1024px) 250px, 190px"}
        loading={eager ? "eager" : "lazy"}
        className="object-cover"
        style={{ objectPosition: p.pos }}
      />
      {p.cap && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/80 to-transparent" />
          <p className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white lg:bottom-4 lg:left-5 lg:text-[11px]">
            {spotlight && <span style={{ color: MAGENTA }}>&#9679; </span>}
            {p.cap}
          </p>
        </>
      )}
    </div>
  );
}

function Column({ c, eager }: { c: RecapColumn; eager: boolean }) {
  // Right padding rather than a flex gap, so one copy of the strip is exactly
  // half the track and the loop's -50% lands seamlessly.
  return c.kind === "spotlight" ? (
    <div className="h-full shrink-0 pr-4 lg:pr-5" style={{ aspectRatio: "0.8 / 1" }}>
      <Card p={c.items[0]} spotlight eager={eager} />
    </div>
  ) : (
    <div className="flex h-full shrink-0 flex-col gap-4 pr-4 lg:gap-5 lg:pr-5" style={{ aspectRatio: "0.55 / 1" }}>
      {c.items.map((p, j) => (
        <div key={j} className="min-h-0 flex-1">
          <Card p={p} spotlight={false} eager={eager} />
        </div>
      ))}
    </div>
  );
}

export function RecapHero() {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-70">
        <DriftingBolts />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 50% at 50% 60%, rgba(255,50,160,0.12), transparent 70%)" }}
      />

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-10 px-6 pb-7 pt-9 lg:pb-8 lg:pt-10">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            Year 11 &middot; Sept 28 &ndash; Oct 2, 2026
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            Thank you, <span className="text-magenta">San Antonio.</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-white/80">
            Founders, builders, students and first-timers, sharing the same five blocks for five
            days. You kept showing up, rain and all.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/get-involved"
              className="inline-flex h-13 items-center rounded-md bg-magenta px-7 text-lg font-medium text-white transition-colors hover:bg-magenta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Get involved.
            </Link>
            <p className="text-sm text-white/60">Sponsor, host or partner on year 12.</p>
          </div>
        </div>
        {/* The live bolt, as it opens and closes the video. Desktop only: on a
            phone the strip below already carries the hero. */}
        <div aria-hidden="true" className="hidden w-56 shrink-0 drop-shadow-[0_0_40px_rgba(255,50,160,0.45)] lg:block xl:w-64">
          <BoltShader color={MAGENTA} />
        </div>
      </div>

      {/* The filmstrip, full-bleed. Two copies; the track slides left by one. */}
      <RecapStrip className="h-90 pb-10 lg:h-115 lg:pb-12 2xl:h-150">
        <div className="recap-marquee flex h-full w-max">
          {[0, 1].map((copy) =>
            RECAP.map((c, i) => (
              <Column key={`${copy}-${i}`} c={c} eager={copy === 0 && i < 4} />
            )),
          )}
        </div>
      </RecapStrip>
    </section>
  );
}
