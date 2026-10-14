import type * as React from "react";
import Image from "next/image";
import Link from "next/link";

// A post-week thank-you hero over The Model's panel, the one photograph
// where the week's own screens ("San Antonio Startup + Tech Week · Plug in.")
// are part of the scene. It opened the homepage until the recap filmstrip
// took that spot (recap-hero.tsx); now the schedule page carries it, with its
// own words passed in, and the speakers page with its own photograph too.
//
// The photograph sits in the right of the frame rather than under the whole
// width: full-bleed, a 2560px monitor put the headline over the first
// panelist. On a phone it goes above the copy instead of behind it, cropped
// to the panel and the screen, because behind the type it was only a murk.

// Two fades, intersected: the left edge into the copy's black, and the foot
// into the section below. The foot is eased (several stops on a curve rather
// than one straight ramp) so the photo dissolves instead of ending on a line.
const MASK =
  "linear-gradient(to right, transparent 0%, black 30%, black 100%), " +
  "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.92) 63%, rgba(0,0,0,0.75) 71%, rgba(0,0,0,0.52) 79%, rgba(0,0,0,0.3) 87%, rgba(0,0,0,0.12) 94%, transparent 100%)";

// Darkest behind the text column, which starts at its 1.5rem gutter or
// further in once the viewport is wider than 80rem; lighter toward both edges.
const COL = "max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))";
const SHADE = `linear-gradient(to right, rgba(0,0,0,var(--edge)) 0px, rgba(0,0,0,0.95) ${COL}, rgba(0,0,0,0.9) calc(${COL} + 36rem), rgba(0,0,0,0.6) 100%), linear-gradient(to bottom, transparent 55%, #000 100%)`;

const PANEL = {
  wide: "/home/thank-you-panel.jpg",
  tall: "/home/thank-you-panel-tall.jpg",
  alt: "A panel on the Geekdom stage at The Rand, beside a screen reading San Antonio Startup + Tech Week, Plug in.",
  pos: "78% 50%",
};

export function PanelThanksHero({
  eyebrow = "Year 11 \u00b7 Sept 28 \u2013 Oct 2, 2026",
  image = PANEL,
  title,
  blurb,
  cta,
}: {
  eyebrow?: string;
  /**
   * The photograph: a wide crop for laptops and up (it sits in the right of
   * the frame), a taller one for phones (above the copy), and where the wide
   * one centres. Defaults to The Model's panel.
   */
  image?: { wide: string; tall: string; alt: string; pos?: string };
  title: React.ReactNode;
  blurb: string;
  cta: { href: string; label: string; note?: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      {/* Hidden from lg, so its size hint says so: a 1px slot from 1024px
          means a laptop never downloads the phone crop at full width. */}
      {/* Phone: the photo first, as its own block. */}
      <div className="relative aspect-[12/11] w-full lg:hidden">
        <Image
          src={image.tall}
          alt={image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 1px, 100vw"
          className="object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,#000_0%,rgba(0,0,0,0.85)_12%,rgba(0,0,0,0.5)_28%,rgba(0,0,0,0.18)_45%,transparent_60%)]" />
      </div>

      {/* Laptop and up, behind everything: the same photo across the full
          width, softened and dimmed, so a wide monitor has the room from edge
          to edge instead of black left of the navbar logo. The sharp copy on
          the right can't simply stretch: full-bleed, the headline lands on the
          first panelist. */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 hidden lg:block">
        <Image
          src={image.wide}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover object-[30%_50%] blur-2xl"
        />
        {/* --edge: dark at the screen's left edge on laptops, where the text
            column starts about 100px in; it opens up only on wide monitors. */}
        <div className="absolute inset-0 [--edge:0.97] 2xl:[--edge:0.6]" style={{ background: SHADE }} />
      </div>

      {/* Laptop and up: the photo in the right of the frame, fading into the
          dimmed copy behind it. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 -z-10 hidden w-[70%] lg:block 2xl:w-[62%]"
        style={{ maskImage: MASK, WebkitMaskImage: MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        <Image
          src={image.wide}
          alt=""
          fill
          priority
          sizes="70vw"
          className="object-cover"
          style={{ objectPosition: image.pos ?? "50% 50%" }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/30" />
      </div>

      <div className="mx-auto flex w-full max-w-7xl px-6 lg:min-h-[calc(100svh-4rem)] lg:items-center">
        <div className="max-w-xl pb-16 pt-2 lg:py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.92] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-6 text-pretty text-lg text-white/80 lg:max-w-md">{blurb}</p>
          <div className="mt-8">
            <Link
              href={cta.href}
              className="inline-flex h-13 items-center rounded-md bg-magenta px-7 text-lg font-medium text-white transition-colors hover:bg-magenta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {cta.label}
            </Link>
            {cta.note && <p className="mt-3 text-sm text-white/60">{cta.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
