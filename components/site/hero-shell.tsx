import * as React from "react";
import Link from "next/link";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { ButtonLink } from "@/components/ui/button";

// The shell every page hero is built from: full viewport minus the navbar,
// copy on the left and the bolt on the right from lg, one column before that.
//
// This exists because there were three copies of it — home, /sessions,
// /speakers — and they drifted. The mobile reorder and the bolt resize landed
// on the homepage alone, so the other two kept shipping the older layout and
// the same button made different promises depending on which page you were on.
// Only the charge and the copy are meant to vary between pages; everything
// structural lives here now, and a change to the shell reaches all three.

export interface HeroBolt {
  /** Resting colour. The homepage drives this from the hovered circuit. */
  color: string;
  /** Optional colours swept across the silhouette on cursor move. */
  sweep?: string[];
  /**
   * Floor the flow mixes up from. Keep it in the same family as `color` — a
   * near-black magenta floor under a cyan current reads as two lights
   * fighting rather than one charge.
   */
  base?: [number, number, number];
  /**
   * Makes the bolt a doorway. Only the homepage sets this (it opens the
   * hidden /bolt-runner); elsewhere the bolt leads nowhere, and wrapping it
   * in an anchor would be a dead click and a lie to a screen reader.
   */
  href?: string;
  /** Required alongside `href` — the link has no text of its own. */
  label?: string;
}

export interface HeroShellProps {
  /** Mono, magenta, `·`-separated. Stays `text-sm` on every page. */
  eyebrow: string;
  /**
   * A node, not a string: each page ends on a magenta word, and the last two
   * words are wrapped in `whitespace-nowrap` so the accent never orphans.
   */
  headline: React.ReactNode;
  blurb: string;
  cta: {
    href: string;
    label: string;
    /**
     * Small print under the button. "Get on the list." is on-voice but opaque
     * about whether it's a waitlist, a newsletter or the real thing, so the
     * pages pointing at /register disclose it here.
     *
     * A node rather than a string since /schedule's hero started pointing at
     * its own calendar: register had to keep a route out of that hero, and it
     * is a link now rather than a sentence about one. Strings still pass —
     * home and /speakers are unchanged.
     */
    note?: React.ReactNode;
  };
  bolt: HeroBolt;
  /**
   * Optional block between the blurb and the CTA. The homepage puts its five
   * interactive circuits here; the other two heroes have no equivalent.
   */
  children?: React.ReactNode;
}

export function HeroShell({
  eyebrow,
  headline,
  blurb,
  cta,
  bolt,
  children,
}: HeroShellProps) {
  const canvas = (
    <ShaderCanvas
      color={bolt.color}
      sweep={bolt.sweep}
      base={bolt.base}
      maskClassName="bolt-mask"
      fallbackSrc="/brand/sastw-bolt.svg"
      className="aspect-square w-full"
    />
  );

  // w-64 on phones, not w-80. A sweep of widths showed the CTA moving only
  // 13px between w-64 and w-48, because `min-h` floors the section and
  // `items-center` turns anything reclaimed past that into centred
  // whitespace — w-64 is where content stops driving the height.
  const boltBox =
    "group mx-auto block w-64 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:w-96 lg:w-full";

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      {/*
        `contents` on phones, a real block from lg up. That one switch is what
        lets the bolt sit between the headline and the rest on a phone while
        desktop keeps the two-column layout unchanged.

        Dissolving this wrapper promotes masthead and detail to grid items, so
        `order` can interleave them with the bolt. From lg it becomes a normal
        block again and is a single grid item — which matters, because the
        obvious alternative (three grid items, bolt spanning two rows) does
        not work: the bolt is taller than the copy beside it, and a row span
        hands that difference to the gap between the two text blocks.
      */}
      <div className="contents lg:block lg:text-left">
        {/* Masthead — eyebrow and headline. First thing on a phone, so the
            page says what it is before it shows the graphic. */}
        <div className="order-1 text-center lg:text-left">
          <p className="font-mono text-sm uppercase tracking-widest text-magenta-ink">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
            {headline}
          </h1>
        </div>

        {/* The detail. `order-3` puts it after the bolt on a phone; from lg
            the wrapper is a block again and this simply follows the masthead.
            `lg:mt-5` carries the spacing the blurb's own top margin used to
            provide, which had to move here so the phone's grid gap isn't
            doubled up. */}
        <div className="order-3 text-center lg:mt-5 lg:text-left">
          <p className="mx-auto max-w-lg text-pretty text-lg text-muted-foreground lg:mx-0">
            {blurb}
          </p>

          {children}

          <div className="mt-6 flex flex-col items-center gap-2.5 sm:mt-8 sm:gap-3 lg:items-start">
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
            {cta.note && (
              <p className="text-sm text-muted-foreground">{cta.note}</p>
            )}
          </div>
        </div>
      </div>

      {/* The current. `order-2` drops it between the masthead and the detail
          on a phone, so it's the thing you scroll into rather than past. A
          sibling of the wrapper, not a child, because from lg it has to be
          the second column. */}
      <div className="order-2">
        {bolt.href ? (
          <Link
            href={bolt.href}
            aria-label={bolt.label}
            className={`${boltBox} cursor-pointer`}
          >
            {canvas}
          </Link>
        ) : (
          <div className={boltBox}>{canvas}</div>
        )}
      </div>
    </section>
  );
}
