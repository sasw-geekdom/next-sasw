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
  /**
   * Optional — it became so when /schedule's second column turned into a list
   * of four named events and a sentence describing the week was saying what
   * the list said with specifics. That hero carries a blurb again, but a
   * different kind: a claim the bill can't make rather than a summary of it.
   *
   * A node rather than a string, for the same reason `cta.note` is one: that
   * blurb names PySanAntonio, and PySA is the one activation in the week with
   * its own wordmark, so the name is set in its own mark rather than in the
   * paragraph's grey. Plain strings still pass — home and /speakers are
   * unchanged.
   */
  blurb?: React.ReactNode;
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
  /**
   * Takes the bolt's column.
   *
   * The schedule hero is the featured lineup now, and the lineup has to sit
   * beside the headline rather than under it — a hero whose second column is
   * a graphic has room for four events in that column, and no room for them
   * anywhere else without pushing the CTA past the fold. The section is
   * already floored at the viewport, so anything that fits this column fits
   * the screen.
   *
   * `bolt` is still required and still drives the shader's colour on the
   * pages that draw it; passing an aside simply means this page does not.
   */
  aside?: React.ReactNode;
  /**
   * A layer behind both columns, bled to the section's edges.
   *
   * The bolt is the right column on the two heroes that still have it, so
   * "no bolt" and "a bill instead" were the same decision — and that is what
   * made /schedule the one hero on the site with no graphic in it at all.
   * This is where it comes back: not as a column but as ground the two
   * columns sit on, which is the only place left once the column is spent.
   *
   * The section is `isolate`, so a backdrop can use negative z without
   * escaping behind the page, and `overflow-hidden`, so it can be sized past
   * the edges the way the social cards bleed their bolt off two sides.
   * Anything passed here is decoration: it is `aria-hidden` and takes no
   * pointer events, because a hero's ground must never eat a click meant for
   * the CTA behind it.
   */
  backdrop?: React.ReactNode;
}

export function HeroShell({
  eyebrow,
  headline,
  blurb,
  cta,
  bolt,
  children,
  aside,
  backdrop,
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
    <section className="relative isolate mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl grid-cols-1 items-center gap-6 overflow-hidden px-6 py-8 lg:grid-cols-2 lg:gap-12 lg:py-0">
      {backdrop && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          {backdrop}
        </div>
      )}
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
          {/* `text-5xl` on phones, not `text-4xl`.

              The jump from 36px to the 60px it takes at `sm` was the largest
              step in the scale and it landed at the wrong end: a hero
              headline in a 342px column was the one place the type was
              smallest. Oswald is condensed enough to absorb it — the longest
              of the three, the homepage's, still sets in two lines. */}
          <h1 className="mt-4 font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
            {headline}
          </h1>
        </div>

        {/* The blurb, above the aside on a phone.
            
            It used to sit below it, with the whole detail block as one
            `order-3` item — right when the aside was the bolt, since a
            sentence has no business coming before the graphic it introduces.
            On /schedule the aside is four named events, and orientation copy
            landing *after* the list it orients reads as a footnote. So the
            block splits: the sentence goes up with the masthead, the action
            stays at the bottom, and the content sits between them.

            `lg:mt-5` moves here with it — it carries the spacing the blurb's
            own top margin used to provide, kept off the paragraph so the
            phone's grid gap isn't doubled up. Rendered only when there is a
            blurb, or an empty div would spend a grid gap on nothing. */}
        {blurb && (
          <div className="order-2 text-center lg:mt-5 lg:text-left">
            {/* `text-base` on phones, `text-lg` from sm.

                Not a space grab — a measure fix. At 18px in the 342px column a
                390px phone leaves, /schedule's blurb sets 8 lines at 31
                characters, and comfortable running text wants 45–75. The type
                was too big for the column, which is what produced both the
                ragged block and its height. 16px buys back four characters a
                line and 40px of height, and the two shorter blurbs on / and
                /speakers get the same better measure at their own lengths. */}
            <p className="mx-auto max-w-lg text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0">
              {blurb}
            </p>
          </div>
        )}

        {/* Whatever the page puts between the copy and its action, and the
            action itself. `order-4` keeps it last on a phone, so the button
            follows the content rather than the sentence. */}
        <div className="order-4 text-center lg:text-left">
          {children}

          {/* `lg:mt-8` only. Below lg this is its own grid item and the
              grid's own `gap-6` already separates it — a margin as well
              stacked on that gap and made the split layout 24px taller than
              the block it replaced. From lg the wrapper is a block again and
              the margin is the only thing holding the button off the copy. */}
          <div className="flex flex-col items-center gap-2.5 sm:gap-3 lg:mt-8 lg:items-start">
            <ButtonLink href={cta.href} size="lg">
              {cta.label}
            </ButtonLink>
            {cta.note && (
              <p className="text-sm text-muted-foreground">{cta.note}</p>
            )}
          </div>
        </div>
      </div>

      {/* The current. `order-3` on a phone: after the headline and the
          sentence that frames it, before the button. A sibling of the
          wrapper, not a child, because from lg it has to be the second
          column. */}
      <div className="order-3">
        {aside ??
          (bolt.href ? (
            <Link
              href={bolt.href}
              aria-label={bolt.label}
              className={`${boltBox} cursor-pointer`}
            >
              {canvas}
            </Link>
          ) : (
            <div className={boltBox}>{canvas}</div>
          ))}
      </div>
    </section>
  );
}
