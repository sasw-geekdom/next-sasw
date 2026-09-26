import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { ModelRoamers } from "@/components/site/model-roamers";
import { OrganizerLogo } from "@/components/site/organizer-logo";
import { ButtonLink } from "@/components/ui/button";
import { listPartners } from "@/lib/admin/cms-queries";
import { ARROW_MOTION } from "@/lib/motion";
import {
  MODEL_CYAN,
  MODEL_INK,
  MODEL_LAVENDER,
  THE_MODEL,
  modelOrganizers,
} from "@/lib/the-model";
import { cn } from "@/lib/utils";

// The Model's band — on /schedule as a teaser, on its own page as the masthead.
// The same two jobs, and deliberately the same shape, as PysaBand and
// AccessGrantedBand: heading, tagline, event info, who runs it, one button, all
// in a single column beside the art. Three sibling bands that behave the same
// way is the point; what separates them is the brand each carries.
//
// What this one carries is the artwork's own system — see the header of
// lib/the-model.ts for where it came from and what it replaced. Access
// Granted's brand is terminal grammar (`>_`, green); this one's is an editor's.
// Three things say so and nothing else needs to:
//
//   · `//` opens every label, the way the artwork's own top line does.
//   · the wordmark is a half-finished selection — "The" plain, "Model" caught
//     inside a selection block with its ink knocked out. That is the single
//     gesture the picture is of, at the one size where it can be read as a
//     gesture rather than as a highlight.
//   · Geist Mono throughout, because the artwork is set in a plain monospace
//     and a display face beside it would be a second voice. Geist Pixel is out:
//     it was the old sheet's, and measured on this page it only resolved as a
//     pixel face above ~22px anyway, so every label wearing it was paying a
//     display face's costs to look like a mono.
//
// Site black as the ground. Both other banded activations landed there too.

/**
 * The palette, handed to the section as custom properties so every class below
 * is ordinary Tailwind (`text-(--model-cyan)`) reading one source of truth.
 *
 * The alternative — an inline `style={{ color }}` on each element, as Access
 * Granted does — works, but it puts the colour outside Tailwind's reach and
 * means hand-appending hex alpha wherever a tint is wanted. Set once here, the
 * utilities do it, opacity modifiers included: Tailwind v4 compiles
 * `text-(--model-cyan)/60` to a `color-mix`, with a plain-colour rule ahead of
 * it for browsers that lack one.
 *
 * The one place that still takes an inline style is `Selected`, whose colour is
 * a prop rather than a fixed role — a class can't be built from a value the
 * component only learns at runtime.
 */
const VARS = {
  "--model-lavender": MODEL_LAVENDER,
  "--model-cyan": MODEL_CYAN,
  "--model-ink": MODEL_INK,
} as React.CSSProperties;

/**
 * A section label, opened by a `//` in the artwork's comment colour.
 *
 * The old `+` marker came from the discarded sheet. A comment slash is the same
 * job done in the picture's own language, and it costs a reader nothing to
 * parse — it is the one piece of code syntax everybody already knows.
 *
 * Lowercase, unlike every other eyebrow on this site. Those are `uppercase
 * tracking-widest` because they are labels; this one is meant to read as a line
 * someone typed, and comments are not shouted.
 */
function Marker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-caption tracking-tight text-white/45">
      <span aria-hidden="true" className="text-(--model-lavender)">
        {"// "}
      </span>
      {children}
    </p>
  );
}

/**
 * Text caught inside a selection — a block of colour with the ink knocked out.
 *
 * The whole identity in one element. `box-decoration-clone` so that a phrase
 * wrapping to a second line gets a block on each, the way a real selection
 * does, rather than one box stretched around the turn.
 */
function Selected({
  color,
  className,
  children,
  ...rest
}: {
  color: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...rest}
      className={cn("box-decoration-clone text-(--model-ink)", className)}
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  );
}

const META = [
  { Icon: CalendarDays, label: "Date", value: THE_MODEL.dateLabel },
  { Icon: Clock, label: "Time", value: THE_MODEL.timeLabel },
  {
    Icon: MapPin,
    label: "Where",
    value: `${THE_MODEL.venue}, ${THE_MODEL.venueDetail}`,
  },
];

/*
 * The node graph that stood here is gone from the band: the Claude Code
 * mascots roaming the whole section are its visual now (ModelRoamers). The
 * graph is still components/site/model-flow.tsx, which the schedule hero's
 * hover peek uses.
 */

export async function ModelBand({
  detailHref,
  actions,
  masthead = false,
}: {
  /** Omitted on the activation's own page, where it would link to itself. */
  detailHref?: string;
  /** Register + calendar, for the band's own page. */
  actions?: React.ReactNode;
  masthead?: boolean;
} = {}) {
  // Fetched here rather than threaded in from each page, so the two call sites
  // stay the one-liners the other bands are. A Firestore outage costs the
  // marks that have no local fallback, not the band.
  let partners: Awaited<ReturnType<typeof listPartners>> = [];
  try {
    partners = await listPartners();
  } catch {
    partners = [];
  }
  const orgs = modelOrganizers(partners);

  // The band is the page's masthead on /schedule/the-model, so its name is the
  // document's h1 there and a section heading everywhere else.
  const Heading = masthead ? "h1" : "h2";

  return (
    <section
      style={VARS}
      className={cn(
        "relative overflow-hidden bg-black",
        // A seam when this is a section among others — see AccessGrantedBand,
        // where the same 240px gap read as a hole without one.
        !masthead && "border-t border-white/10",
        masthead && "flex min-h-[calc(100vh-4rem)] flex-col justify-center",
        // And as a mid-page band too, but only where there is screen for it.
        // Content-height is right on a laptop; on an external monitor it left
        // this band sharing the screen with the one above and the one below,
        // so whichever activation you came to read arrived framed by its
        // competitors. `roomy` is defined in globals.css and gated on viewport
        // height, which is the real constraint — see the note there.
        !masthead &&
          "roomy:flex roomy:min-h-[calc(100vh-4rem)] roomy:flex-col roomy:justify-center",
      )}
    >
      {/* The mascots walk the whole section — this `section` is the
          positioned ancestor that makes the layer's `inset-0` mean "the band".
          They sit under the copy (z-10 against its z-20) and fade behind
          anything in the `data-roam-keep` column. */}
      <ModelRoamers color={MODEL_LAVENDER} />
        <div
          className={cn(
            "relative z-20 mx-auto w-full max-w-7xl px-6 pb-16 lg:pb-28",
            masthead ? "pt-6 lg:pt-7" : "pt-16 lg:pt-28",
          )}
        >
          {/* `[auto_1fr]` with the copy capped at the same measure the sibling
            bands use, so the three CTAs on /schedule share one left edge and
            one column width. This ran `minmax(0,28rem)` for a while to give the
            old staircase more room, and the result was that The Model's copy
            column was four rem narrower than Access Granted's directly above
            it — the kind of difference nobody can name and everybody sees.

            Historic note, since the numbers here look arbitrary otherwise.

            Their reason for `auto` was that a fixed-size piece of art in a
            `1fr` column leaves the column's leftover width sitting between the
            copy and the picture as an effective 240px trench. This artwork has
            no fixed size — it is a block of type that wants every pixel it can
            have and clips itself on the left when it runs out — so there is no
            leftover to strand, and the trade reverses: an even split is what
            keeps the bottom rungs of the staircase in the frame at laptop
            width. */}
          <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 xl:gap-16">
            <div data-roam-keep className="contents lg:block lg:max-w-xl xl:max-w-2xl">
              <div className="order-1">
                <Marker>The Rand · AI &amp; Applied Innovation</Marker>
              </div>

              {/*
              The wordmark is a half-finished selection.

              "The" sits plain and "Model" is caught inside a selection block
              with its ink knocked out — which is the artwork's single gesture,
              reproduced at the one size on this page where it reads as a
              gesture rather than as a highlighter. It is also the same split
              the band carried before, with the accent moved from a colour on
              the glyphs to a block behind them.

              Mono, not Oswald and not Pixel. The artwork is set in a plain
              monospace; a display face beside it is a second voice, and the
              pixel face this used to wear belonged to a system this page has
              dropped.

              The class sits on a span rather than on the heading, because
              globals.css sets `font-family` on bare h1/h2/h3 outside any
              cascade layer — unlayered rules beat every Tailwind utility, so
              `font-mono` on the element itself would silently lose to Oswald.

              `pr-1.5` on the block and `-mr-1.5` after it: a selection ends a
              hair past its last glyph, and without the padding the block stops
              flush against the "L" and reads as a crop. The negative margin
              keeps that padding from shifting anything that follows.
            */}
              <Heading className="order-2 mt-4">
                <span className="block font-mono text-4xl font-medium uppercase leading-[1.05] tracking-tight text-white/85 sm:text-6xl">
                  The{" "}
                  <Selected color={MODEL_LAVENDER} className="px-1.5">
                    Model
                  </Selected>
                </span>
              </Heading>

              <p className="order-3 mt-6 border-l-2 border-(--model-cyan) pl-5 text-pretty text-lg text-white/80">
                {THE_MODEL.tagline.setup}{" "}
                {/* Desktop-only. `hidden` below lg leaves the space above it
                  intact, so the two halves read as one sentence on a narrow
                  column; from lg the space collapses against the break and
                  costs nothing. */}
                <br className="hidden lg:inline" />
                {THE_MODEL.tagline.turn}
              </p>

              {/* Mono and sentence-case, not the site's `uppercase
                tracking-widest` metadata row. Everything in this column now
                reads as something typed rather than something set, and caps
                with letterspacing is the one treatment that would break that. */}
              <dl className="order-5 mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-caption text-white/55">
                {META.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <dt className="sr-only">{label}</dt>
                    <Icon
                      className="h-3.5 w-3.5 shrink-0 text-(--model-cyan)"
                      aria-hidden="true"
                    />
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Three marks, so this is a flex row at every width — the fixed
                three-column grid Access Granted needs is for six. Hidden
                entirely if none resolved, rather than leaving a "Powered by"
                label standing over nothing. */}
              {orgs.length > 0 && (
                <div className="order-8 mt-9">
                  <Marker>powered by</Marker>
                  <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-6 sm:gap-x-10">
                    {orgs.map((o) => (
                      <li key={o.name}>
                        <OrganizerLogo org={o} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {actions && <div className="order-9 mt-9">{actions}</div>}

              {detailHref && (
                // Full width below sm, matching the other bands: two controls six
                // pixels apart on a phone read as a ragged edge, and the tap
                // target gets bigger for free.
                //
                // White fill rather than a selection colour. A filled lavender
                // button would be the loudest thing on /schedule — louder than
                // the week's own magenta register CTA, and out of step with the
                // two bands it sits beside. The arrow takes the colour instead,
                // which is enough to say whose button it is.
                <div className="order-10 mt-12 flex flex-wrap items-center gap-3">
                  <ButtonLink
                    href={detailHref}
                    size="md"
                    className="group w-full justify-center bg-white/10 text-white duration-200 hover:bg-white/20 sm:w-auto"
                  >
                    Full event details
                    <ArrowUpRight
                      className={cn(
                        ARROW_MOTION,
                        "h-4 w-4 text-(--model-lavender) duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      )}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </ButtonLink>
                </div>
              )}
            </div>

            {/* Open ground for the mascots where the graph used to sit: on a
                phone, between the tagline and the details, so they have
                somewhere to walk that isn't behind a line of copy; from lg,
                the right-hand column. */}
            <div data-roam-field aria-hidden="true" className="order-4 my-6 h-72 w-full sm:h-80 lg:order-0 lg:my-0 lg:h-auto lg:min-h-112" />
          </div>
        </div>
    </section>
  );
}
