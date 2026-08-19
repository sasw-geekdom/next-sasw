import { ArrowUpRight, CalendarDays, Clock, MapPin, PackageOpen } from "lucide-react";
import { OrganizerLogo } from "@/components/site/organizer-logo";
import { ButtonLink } from "@/components/ui/button";
import { listPartners } from "@/lib/admin/cms-queries";
import {
  GIVE_A_LOT,
  GIVE_A_LOT_STATES,
  GIVE_AMBER,
  GIVE_PLUM,
  giveALotOrganizers,
} from "@/lib/give-a-lot";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Give-a-LOT's band — on /schedule/give-a-lot as the masthead, and ready to be
// a teaser on /schedule the moment it is wanted. The same shape as PysaBand,
// AccessGrantedBand and ModelBand: eyebrow, title, hook, event info, who runs
// it, one button, all in a single column beside the art.
//
// ── What separates this one ─────────────────────────────────────────────────
//
// Nothing much, on purpose, and that is the decision. The other three each
// invented a grammar — Access Granted's terminal, The Model's editor,
// PySanAntonio's mascot — because each had a brand with no artwork attached.
// Give-a-LOT arrives with a finished lockup, so this band keeps the site's own
// section rhythm (mono eyebrow in caps, display-weight title, blurb, one CTA)
// and lets the partner's mark be the only loud thing in it. Amber is the single
// colour taken from them; see the note at the top of lib/give-a-lot.ts for why
// that does not reopen the orange question The Model closed.
//
// The lockup is the title, following PysaBand: the mark sits inside the
// heading element and its `alt` carries the name. That is what keeps the band
// from setting "GIVE-A-LOT" in Oswald directly beside the same words
// hand-lettered, which is the same word twice in two voices.

/**
 * The palette as custom properties, so the classes below are ordinary Tailwind
 * reading one source of truth — including opacity modifiers, which Tailwind v4
 * compiles to `color-mix`. Same arrangement as ModelBand.
 */
const VARS = {
  "--lot-amber": GIVE_AMBER,
  "--lot-plum": GIVE_PLUM,
} as React.CSSProperties;

/**
 * The metadata row.
 *
 * Four entries, not the three the sibling bands carry, because this activation
 * is two things: a drop-off window across the first half of the week, and one
 * afternoon at the end of it. The drive leads — it is the row that asks the
 * reader to do something, and it starts first.
 */
const META = [
  { Icon: PackageOpen, label: "Donate", value: GIVE_A_LOT.driveLabel },
  { Icon: CalendarDays, label: "Workshop", value: GIVE_A_LOT.dateLabel },
  { Icon: Clock, label: "Time", value: GIVE_A_LOT.timeLabel },
  {
    Icon: MapPin,
    label: "Where",
    value: `${GIVE_A_LOT.venue}, ${GIVE_A_LOT.venueDetail}`,
  },
];

/**
 * What a donated machine arrives as, and what it leaves as.
 *
 * A table rather than a flow diagram. The transformation here is a list of
 * properties changing state, which is what a table is for — and The Model
 * three sections away is already a node graph, so drawing this as a second one
 * would have the two activations sharing a picture.
 *
 * The colour carries the whole idea: the left column is unpowered and the
 * right is lit. That is the same sentence the tagline makes, which is why
 * neither needs a caption explaining the other.
 */
function Artwork() {
  return (
    <div aria-hidden="true" className="relative select-none">
      {/* Light, and only light — the same treatment ModelSelection uses. Amber
          on the right where the lit column is, plum on the left where it
          isn't, so the glow says what the table says. Plum is far too dark to
          read as type (2.1:1 on black) and this is the one job it is right
          for: a ground, at a size where it is a cast rather than a colour. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-40%] left-[-20%] right-[-20%] blur-[90px]"
        style={{
          background: `radial-gradient(ellipse 34% 46% at 74% 50%, ${GIVE_AMBER}2e 0%, transparent 72%), radial-gradient(ellipse 34% 46% at 26% 50%, ${GIVE_PLUM}55 0%, transparent 72%)`,
        }}
      />

      <div className="relative font-mono text-[13px] sm:text-caption md:text-[15px] xl:text-[17px]">
        {/* Column heads as lowercase comments rather than the site's caps
            eyebrow — this is inside a picture, and a second `uppercase
            tracking-widest` label here would compete with the real one above
            the title. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-[2ch] pb-[1.1em] text-[0.82em] text-white/35 sm:gap-x-[3ch]">
          <span className="text-right">{"// donated"}</span>
          <span aria-hidden="true" className="w-4" />
          <span className="text-(--lot-amber)/70">{"// rebuilt"}</span>
        </div>

        <ul className="relative grid gap-y-[1.15em]">
          {GIVE_A_LOT_STATES.map((row) => (
            <li
              key={row.after}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-[2ch] sm:gap-x-[3ch]"
            >
              <span className="text-right text-white/40">{row.before}</span>
              {/* The connector, deliberately faint. It is punctuation between
                  the two halves, not a third thing to read. */}
              <span aria-hidden="true" className="w-4 text-center text-white/20">
                &rarr;
              </span>
              <span className="text-(--lot-amber)">{row.after}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function GiveALotBand({
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
  // Fetched here rather than threaded in from the page, so the call sites stay
  // the one-liners the other bands are. A Firestore outage costs nothing here:
  // both marks carry a local fallback.
  let partners: Awaited<ReturnType<typeof listPartners>> = [];
  try {
    partners = await listPartners();
  } catch {
    partners = [];
  }
  const orgs = giveALotOrganizers(partners);

  const Heading = masthead ? "h1" : "h2";

  return (
    <section
      style={VARS}
      className={cn(
        "relative overflow-hidden bg-black",
        // A seam when this is a section among others — see AccessGrantedBand,
        // where the same gap read as a hole without one.
        !masthead && "border-t border-white/10",
        masthead && "flex min-h-[calc(100vh-4rem)] flex-col justify-center",
        // And as a mid-page band, but only where there is screen for it. See
        // the `roomy` note in globals.css.
        !masthead &&
          "roomy:flex roomy:min-h-[calc(100vh-4rem)] roomy:flex-col roomy:justify-center",
      )}
    >
      <div
        className={cn(
          "relative z-20 mx-auto w-full max-w-7xl px-6 pb-16 lg:pb-28",
          masthead ? "pt-6 lg:pt-7" : "pt-16 lg:pt-28",
        )}
      >
        {/* `[auto_1fr]` with the copy capped at the same measure the sibling
            bands use, so every activation CTA on /schedule shares one left edge
            and one column width. */}
        <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12 xl:gap-16">
          <div className="contents lg:block lg:max-w-xl xl:max-w-2xl">
            {/* The site's standard eyebrow, not a bespoke marker. This band
                borrows the system rather than inventing a grammar — see the
                note at the top of the file. Amber rather than magenta, because
                the separator sits between a venue and a circuit that both
                belong to this activation. */}
            <p className="order-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
              {GIVE_A_LOT.venue}{" "}
              <span aria-hidden="true" className="text-(--lot-amber)">
                ·
              </span>{" "}
              Tech &amp; Builders
            </p>

            <Heading className="order-2 mt-5 flex flex-col items-start">
              {/* The lockup is the title; the alt carries the name for
                  anything that cannot render it. Capped rather than fluid —
                  the mark is a panel of amber, and at full column width it
                  became the brightest object on the page by a distance. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GIVE_A_LOT.lockup}
                alt={GIVE_A_LOT.fullName}
                width={GIVE_A_LOT.lockupWidth}
                height={GIVE_A_LOT.lockupHeight}
                className="h-auto w-full max-w-88 sm:max-w-104 lg:max-w-md"
              />
            </Heading>

            <p className="order-3 mt-6 border-l-2 border-(--lot-amber) pl-5 text-pretty text-lg text-white/80">
              {GIVE_A_LOT.tagline.setup}{" "}
              {/* Desktop-only. `hidden` below lg leaves the space above it
                  intact, so the two halves read as one sentence in a narrow
                  column; from lg the space collapses against the break. */}
              <br className="hidden lg:inline" />
              {GIVE_A_LOT.tagline.turn}
            </p>

            <dl className="order-5 mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
              {META.map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <dt className="sr-only">{label}</dt>
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-(--lot-amber)"
                    aria-hidden="true"
                  />
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {/* Hidden entirely if neither mark resolved, rather than leaving a
                "Powered by" label standing over nothing. */}
            {orgs.length > 0 && (
              <div className="order-8 mt-9">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                  Powered by
                </p>
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
              // White fill rather than amber. A filled amber button would be
              // the loudest thing on /schedule — louder than the week's own
              // magenta register CTA — and the lockup above it already spends
              // this band's amber. The arrow takes the colour instead.
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
                      "h-4 w-4 text-(--lot-amber) duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                    )}
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </ButtonLink>
              </div>
            )}
          </div>

          {/* Held inside the grid column rather than bled to the screen edge
              the way The Model's graph is. That one is a block of type that
              wants every pixel and clips itself when it runs out; this is a
              centred table with a fixed measure, and pushing it right would
              strand it away from the copy it belongs to. */}
          <div className="relative order-4 my-10 w-full lg:order-0 lg:my-0">
            <Artwork />
          </div>
        </div>
      </div>
    </section>
  );
}
