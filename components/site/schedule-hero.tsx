import Image from "next/image";
import Link from "next/link";
import { HeroShell } from "@/components/site/hero-shell";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { FeaturedBill } from "@/components/site/featured-bill";
import { featuredLineup } from "@/lib/featured";
import { PYSA } from "@/lib/pysa";
import { HoverPeek } from "@/components/site/hover-peek";
import { cn } from "@/lib/utils";
import { ModelFlow } from "@/components/site/model-flow";
import { MODEL_INK, MODEL_LAVENDER, MODEL_LAVENDER_LIT } from "@/lib/the-model";

// The schedule hero. Structure comes from HeroShell — only the charge and the
// copy differ, so the three page heroes read as one system at different points
// on the grid.
//
// House magenta, where the other two heroes mix a circuit colour. This one
// draws its bolt on the page's own white rather than in the bolt's column,
// and a cyan bolt there was the only cyan on a page whose every other accent
// — eyebrow, headline, button, the featured ramp — is `--magenta`. It read as
// a second brand rather than as the same current behind the type.
const SESSIONS_CURRENT = "#ff32a0";

// The homepage's floor, so this bolt is the homepage's bolt.
//
// `[0.08, 0, 0.05]` is ShaderCanvas's own default — the near-black plum
// components/site/hero.tsx gets by passing no `base` at all — and with the
// opacity below at 100 the two heroes now draw the same magenta at the same
// depth, rather than one rich mark and one pink wash.
//
// The versions before it are worth keeping straight, because two of them
// failed for reasons that were not the value. A near-black floor at *low*
// opacity greys out, which is what made the first attempt a smudge and sent
// this constant chasing lighter and lighter floors. And every light floor was
// judged against a bolt that was not using this constant at all: the backdrop
// below carried a hardcoded `base={[0.9, 0.96, 1]}`, a near-white *blue*, so
// the "smoke" was that blue showing wherever the flow ran thin, and deepening
// this appeared to do nothing.
//
// The cost is contrast, and it is a real one. Measured away from the cursor
// glow — the shader's default `u_mouse` is the canvas centre, so anything
// sampled near the middle sits in the glow and tells you nothing about the
// floor — black type over the bolt runs 3.09:1 at its darkest against 8.95:1
// on the light floor. That clears WCAG's 3:1 for large text, which is all
// that crosses it: the two display titles, the arrows and the row rules. No
// body copy sits on the bolt, and none should be allowed to — a row whose
// small print reached the ink would need 4.5:1 and would not have it.
const BASE: [number, number, number] = [0.08, 0.0, 0.05];

export async function SessionsHero() {
  const featured = await featuredLineup();
  return (
    <HeroShell
      eyebrow="The schedule · Sept 28 – Oct 2"
      // Was "Coming online, room by room." — which described the same thing
      // the week section's own headline described, one viewport apart, under
      // eyebrows that both ended "· Sept 28 – Oct 2" and blurbs that both said
      // "confirmed". The page read as two heroes stacked.
      //
      // So there is one now, and it took the better line. "Five days, one
      // current." names the shape of the thing the page is, which matters more
      // once the page *is* the calendar; the section below it has no header at
      // all any more.
      // Shorter than "Five days, one current." was, because the second
      // column is now a list of four events rather than a graphic, and a
      // three-line headline beside it pushed the CTA past the fold on a
      // MacBook Air. The line it replaces named the shape of the week; the
      // bill beside it now names four specific things, which is the more
      // useful half of the same job.
      headline={
        <>
          Start{" "}
          {/* The bolt, in the line rather than behind the bill.
              
              It spent this whole design as a `backdrop` in the featured
              column: 496px of shader sitting under four event rows, where it
              had to be positioned around their titles — the note that used to
              live here worked out that its top tip landed *in* the row
              carrying the Nopalera mark, and capped its height so a 27-inch
              screen would not push it back up there. That is a graphic
              fighting the content on top of it.
              
              In the headline it fights nothing. The left column is two words
              and the right is a list of four events; the bolt is what gives
              the left side the weight to hold that, and it lands in the first
              thing a reader looks at rather than behind the last.
              
              It also settles the contrast question the backdrop raised.
              Black display type crossing the ink measured 3.09:1 — clearing
              WCAG's 3:1 for large text and nothing more, with a standing rule
              that no body copy may ever be allowed over it. Beside the type
              instead of behind it, nothing crosses it at all. */}
          <span
            className={cn(
              // Square, because the mask is: the silhouette fills about
              // two-thirds of a 375×375 viewBox, so a box at cap height would
              // draw a bolt two-thirds the height of the letters beside it.
              // 1.5em puts its ink at roughly the caps' own height.
              "relative inline-block aspect-square h-[1.5em] w-[1.5em] align-[-0.34em]",
              // The transparent margin inside the SVG, taken back out. Left
              // alone it reads as two word-spaces around the mark.
              "-mx-[0.18em]",
            )}
          >
            <ShaderCanvas
              color={SESSIONS_CURRENT}
              base={BASE}
              maskClassName="bolt-mask"
              fallbackSrc="/brand/sastw-bolt.svg"
              className="h-full w-full"
            />
          </span>
          <span className="text-magenta">here.</span>
        </>
      }
      // Leads with the fact that moves someone, not with what the page is.
      // The bill beside it already names four events and the button below it
      // already says "See the week", so a sentence describing the calendar
      // was the third thing on screen saying the same thing. Free is the one
      // claim neither of them makes, and it is the one that decides whether a
      // stranger scrolls; the scale follows it as evidence, and the close
      // hands the reader the only decision left — which is also the decision
      // the grid underneath exists to serve.
      // Named events here are asserted against lib/schedule.ts, not recalled:
      // the Bash is Thursday 6–8pm and Friday still runs the Alamo Angels
      // brunch, the Give-a-LOT giveaway and PySanAntonio II until 6pm, so the
      // party is the week's Thursday night and PySA — HEADLINE_SESSION, and
      // the last thing to end — is what closes it. If either moves, this
      // sentence moves with it.
      blurb={
        <>
          {/* The scale sentence, phones excepted.
              
              `display: none`, so it is out of the accessibility tree on a
              phone too — this is genuinely dropped there, not visually hidden.
              What goes with it is the "free" claim, which is the strongest
              thing this hero says to a stranger; it survives on mobile only in
              the note under the button. Worth revisiting if the phone hero
              ever has room again. */}
          <span className="hidden sm:inline">
            Every session is free. Five circuits, six rooms, five days across
            downtown — the hard part is deciding where to be.{" "}
          </span>
          {/* The Model has no wordmark file to reach for — its mark is
              typeset. See the `the-model` branch in calendar/blocks.tsx: mono,
              uppercase, and the second word caught in a selection block, which
              is the band's own artwork rendered as type. Rebuilt here at
              sentence scale rather than lifted, because that one reads its
              colours off a brand record and takes a size meant for a calendar
              row; the three constants are the shared part.

              0.8em because mono runs wide and tall against Geist at the same
              size — set at 1em the mark stood a head above the line it was
              sitting in. `whitespace-nowrap` so "The" never ends a line with
              its own highlighted noun on the next one.

              The word space is mono's, which is a full 0.6em — wide enough
              between two words of a two-word mark that they read as two
              things rather than one. `-ml-[0.34em]` pulls the block back to a
              gap of about a third of an em without deleting the space itself,
              which is what a screen reader needs to say "The Model" rather
              than one word.

              The lit lavender is what the constant exists for: lib/the-model
              keeps #CBC2FD as "the same lavender lifted about 18% toward
              white, for one hover state". Both go through custom properties
              so the hover can be a class while the colours stay sourced from
              the brand file. */}
          <HoverPeek
            // The graph itself, not a picture of it. The Model's hero is
            // drawn rather than exported — model-band.tsx renders this same
            // component — so the honest peek is the component.
            //
            // Two things it needs to survive a 22rem box. Its type scale is
            // viewport-driven (`text-[11px]` up to `2xl:text-[19px]`), which
            // is right in a hero and far too big in a panel a fifth that
            // width, so every breakpoint is pinned to one size here — twMerge
            // resolves per-variant, so a bare `text-[7px]` would beat the
            // base and lose to `lg:text-[13px]`. And it is passed as `node`
            // rather than rendered inline, so it mounts on the hover: see the
            // note on that prop for why an always-mounted graph would have
            // finished its walk before anyone saw it.
            node={
              <ModelFlow className="text-[7px] sm:text-[7px] md:text-[7px] lg:text-[7px] xl:text-[7px] 2xl:text-[7px]" />
            }
            className="inline-block"
            panelClassName="w-[17rem]"
          >
            <Link
              href="/schedule/the-model"
              className="group whitespace-nowrap rounded-sm font-mono text-[0.92em] font-bold uppercase sm:text-[0.82em] tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
              style={
                {
                  "--model-mark": MODEL_LAVENDER,
                  "--model-mark-lit": MODEL_LAVENDER_LIT,
                } as React.CSSProperties
              }
            >
              The{" "}
              <span
                className="box-decoration-clone ml-[-0.34em] bg-(--model-mark) px-[0.13em] transition-colors duration-200 group-hover:bg-(--model-mark-lit)"
                style={{ color: MODEL_INK }}
              >
                Model
              </span>
            </Link>
          </HoverPeek>{" "}
          opens the week on Monday and{" "}
          {/* PySA is the one activation in the week with its own brand, so its
              name is set in its own mark. `wordmarkOnLight` is the cut this
              ground needs — the deep #0059b7, not the lighter blue PySA's own
              black band takes.

              Sized and seated off the file rather than by eye: "sanantonio"
              is 76.7% of the mark's height and its baseline sits 76.7% down
              the box, so a 1.25em mark wants -0.29em of `vertical-align` to
              put that baseline on the sentence's. Without it the mark hangs
              off the line by a quarter of its height, which on a blackletter
              face reads as a broken image rather than a deliberate one. */}
          <HoverPeek
            // The loop, not the still. lib/pysa already trimmed and
            // re-encoded this to 930KB with a faststart moov precisely so it
            // could be dropped in somewhere; `preload="none"` plus mounting
            // on hover means that 930KB is only ever fetched by someone who
            // pointed at the word.
            node={
              <video
                src={PYSA.video}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                className="h-full w-full rounded-lg object-cover"
              />
            }
            className="inline-block align-[-0.34em]"
            panelClassName="h-[8.5rem] w-[13rem]"
          >
            <Link
              href="/schedule/pysanantonio"
              className="block rounded-sm transition-opacity duration-200 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2"
            >
              <Image
                src={PYSA.wordmarkOnLight}
                alt="PySanAntonio"
                width={PYSA.wordmarkWidth}
                height={PYSA.wordmarkHeight}
                className="block h-[1.45em] w-auto"
              />
            </Link>
          </HoverPeek>{" "}
          closes it on Friday, with pitch nights, keynotes and community
          activations in between.
        </>
      }
      // Points at the calendar, not away from it. "Get on the list." sent the
      // reader to /register from the top of the one page whose whole job is to
      // be scrolled into — the hero's primary action was an exit. Register
      // survives in the note, plus the navbar, the footer and this page's own
      // closing band, so the funnel loses nothing.
      cta={{
        href: "#the-week",
        label: "See the week.",
        note: (
          <>
            Or{" "}
            <Link
              href="/register"
              // Dark on hover, not white. The note sits in
              // `text-muted-foreground` on the hero's *white* ground, so
              // `hover:text-white` painted the link the colour of the page
              // and the words vanished under the cursor.
              className="underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              get on the list
            </Link>{" "}
            — free registration.
          </>
        ),
      }}
      bolt={{ color: SESSIONS_CURRENT, base: BASE }}
      // Takes the bolt's column. See `aside` on HeroShell.
      aside={<FeaturedBill entries={featured} />}
      // The bolt, as ground under the featured column.
      //
      // The TPR cards run it at 0.62 over black and it burns; the same canvas
      // laid on this hero's white at an opacity low enough to read type
      // through came out a flat grey smudge with none of the flow in it. The
      // fix is the floor, not the alpha: `base` is what the shader mixes *up*
      // from, and at near-black every low-opacity sample of it is grey. Given
      // a near-white floor the same flow reads as tinted light on paper —
      // still the bolt, still moving, and legible under the type it crosses.
      //
      // Placed low and right, and sized so it stays there.
      //
    />
  );
}
