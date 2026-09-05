import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  MapPin,
} from "lucide-react";
import {
  SessionBento,
  type SessionCard,
} from "@/components/site/session-bento";
import { ButtonLink } from "@/components/ui/button";
import { eventLocation } from "@/lib/calendar";
import { ARROW_MOTION } from "@/lib/motion";
import { ActivationDetail } from "@/components/site/activation-detail";
import {
  ActivationSessions,
  HeroTalk,
} from "@/components/site/activation-sessions";
import type { CardSpeaker } from "@/components/site/speaker-card";
import {
  listPartners,
  listSponsors,
  listSessions,
  listSpeakers,
} from "@/lib/admin/cms-queries";
import type { SessionRow } from "@/lib/admin/cms-types";
import {
  dayMeta,
  resolveSchedule,
  scheduleSlugs,
  sessionDay,
  spanLabel,
  venueRedirect,
  RETIRED_PAGES,
  whenLabels,
  type CalendarItem,
  type ResolvedSession,
} from "@/lib/schedule";
import { liveCalendarItems } from "@/lib/live-schedule";
import { EVENT_DAYS } from "@/lib/event";
import { PYSA } from "@/lib/pysa";
import { BackLink } from "@/components/site/back-link";
import { activationEvent, jsonLd } from "@/lib/structured-data";
import { AccessGrantedBand } from "@/components/site/access-granted-band";
import { PoweredBy } from "@/components/site/powered-by";
import { PoweredByLine } from "@/components/site/powered-by-line";
import { CircuitSponsorLine } from "@/components/site/circuit-sponsor-line";
import { circuitSponsor, type CircuitSponsor } from "@/lib/circuit-sponsors";
import { GiveALotBand } from "@/components/site/give-a-lot-band";
import { ModelBand } from "@/components/site/model-band";
import { PysaBand } from "@/components/site/pysa-band";
import { AddToCalendar } from "@/components/site/add-to-calendar";
import { OpenCircuitGlow } from "@/components/site/open-circuit-glow";
import { cn } from "@/lib/utils";

// A venue's own week. /schedule is the whole grid; this is one room's slice of
// it, which is what room-flow's per-venue CTA promises.
//
// Static at build time from scheduleSlugs(), revalidated on the same cycle as
// /schedule so a CMS-driven partner logo lands here at the same moment.
// Dissolve the picture's left edge instead of cutting it — a hard vertical
// boundary beside the copy is exactly what makes an image look pasted on.
// `--hero-fade` is set by a class on the element so the dissolve can lengthen
// with the frame: past 2xl the picture starts far enough left to reach under
// the copy, and a fade that stayed at 28% would go solid on top of the text.
const HERO_MASK =
  "linear-gradient(to right, transparent 0%, black var(--hero-fade), black 100%)";

// And bring the copy side back to solid black, so the type sits on ground
// rather than on a photograph.
//
// Both of these have to be spent by roughly two-thirds across. The copy column
// is `max-w-3xl` inside `max-w-7xl`, which ends around 59% of a laptop screen
// and 55% of a wide monitor — so clearing by 70% covers the text everywhere
// and still leaves the subject in the open. Reaching further looks safer and
// isn't: it lands the darkest part of the gradient on the faces, which is the
// one thing in the frame the picture is here for.
const HERO_SCRIM =
  "linear-gradient(to right, #000 0%, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.5) 54%, rgba(0,0,0,0.12) 63%, transparent 70%)";

// And the vertical one, which stops the photograph ending in a hard edge at
// the top of the section and blends its foot into the black below.
//
// This was `from-black via-transparent to-black` — black at 0%, clear at 50%,
// black again at 100% — and the top half of that was far too much. These
// photographs are of people on a stage, and a stage photograph puts heads near
// the top of the frame: on the Mission Pitch hero the man holding the cheque
// has the crown of his head about 10% down, where a fade that does not clear
// until 50% is still better than half black. It read as the picture being cut
// off rather than as a vignette.
//
// Reported from a MacBook Air and not visible on a large external monitor,
// which sounds like a height bug and is not one. The gradient's stops are
// percentages and the image is `object-cover` with no vertical crop at either
// size, so the head sits at the same 8–10% of the frame on both — measured, on
// a 1440x900 and a 2560x1440. What differs is scale: at 1376px of hero the
// same proportional shadow falls across a much larger face and reads as
// lighting, while at 836px it lands on a small head as a smudge. Both were
// wrong; only one was obvious.
//
// So the top fade is short and the bottom is untouched. Clear by 18% frees the
// heads in every hero on the site — measured against all five — and 6% of
// section height is still enough of a band that the photograph does not butt
// into the row above it. The bottom holds its black to 58% rather than 50%
// because that half was never the problem and the copy sits on it.
const HERO_VEIL =
  "linear-gradient(to bottom, #000 0%, transparent 18%, transparent 58%, #000 100%)";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return scheduleSlugs().map((slug) => ({ slug }));
}

async function safeList<T>(p: Promise<T[]>): Promise<T[]> {
  try {
    return await p;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const schedule = resolveSchedule(slug);
  if (!schedule) return {};

  const { title, description, path } =
    schedule.kind === "venue"
      ? {
          title: schedule.room.name,
          description: `${schedule.room.desc} ${schedule.room.name} during San Antonio Startup + Tech Week, Sept 28 – Oct 2, 2026.`,
          path: `/schedule/${schedule.room.slug}`,
        }
      : {
          title: schedule.session.title,
          description: (() => {
            const w = schedule.session.when;
            // An activation whose location is disclosed on RSVP has no venue
            // to name here — "at Location shared on RSVP" reads as a bug, and
            // a description is not the place to advertise what is withheld.
            const at = schedule.session.venueReveal
              ? ""
              : ` at ${schedule.session.venue.name}`;
            if (!w) {
              return `${schedule.session.blurb}${at ? ` At ${schedule.session.venue.name}` : ""} during San Antonio Startup + Tech Week, Sept 28 – Oct 2, 2026.`;
            }
            const { date, time } = whenLabels(w);
            return `${schedule.session.blurb} ${date}, ${time}${at} — part of San Antonio Startup + Tech Week.`;
          })(),
          path: `/schedule/${schedule.session.page}`,
        };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} · SASTW 2026`, description, url: path },
    twitter: {
      card: "summary_large_image",
      title: `${title} · SASTW 2026`,
      description,
    },
  };
}

/**
 * The hero title, split at `heroBreakBefore` — or whole, when there's no break
 * or the substring isn't found. Editing a title can't break the page.
 */
/**
 * The title with its accent run in magenta — see `titleAccent`.
 *
 * Returns the plain string when there is no accent or the run is not found, so
 * the heading is never worse off for this.
 */
function accented(text: string, accent: string | undefined) {
  if (!accent) return text;
  const at = text.indexOf(accent);
  if (at === -1) return text;
  return (
    <>
      {text.slice(0, at)}
      <span className="text-magenta">{text.slice(at, at + accent.length)}</span>
      {text.slice(at + accent.length)}
    </>
  );
}

function heroTitleParts(session: ResolvedSession): [string] | [string, string] {
  const at = session.heroBreakBefore;
  if (!at) return [session.title];
  const i = session.title.indexOf(at);
  // A break at position 0 would leave an empty first line.
  if (i <= 0) return [session.title];
  return [session.title.slice(0, i).trimEnd(), session.title.slice(i)];
}

/**
 * An activation's own page.
 *
 * Four activations get a band as their masthead — PySanAntonio, Access
 * Granted, The Model and Give-a-LOT. Each already carries its own wordmark and
 * palette, so arriving confirms you clicked the right thing, and each renders
 * without its own CTA here since that button is what brought you. Give-a-LOT
 * is the one of the four with no band on /schedule: it is a card in the bento
 * there, and this page is the only place its band appears.
 *
 * Every other activation borrows its venue's portrait instead:
 * the same portrait-and-panel grammar as room-flow and the venue pages, using
 * art that already exists rather than leaving these pages type-only.
 *
 * These pages are honest about being thin. Only PySA has a date and a running
 * order; the rest carry a title, a circuit and a blurb. What saves them is
 * that they're partner-run events with their own sites — this page says where
 * the thing sits in the week and sends you to the organiser for the depth.
 */
function ActivationPage({
  session,
  sessions,
  speakers,
  sponsor,
}: {
  session: ResolvedSession;
  /** CMS sessions linked to this activation, in start order. */
  sessions: SessionRow[];
  /** Everyone in the CMS, so a session can show who is giving it. */
  speakers: CardSpeaker[];
  /** The sponsor behind this activation's circuit, where one exists. */
  sponsor: CircuitSponsor | null;
}) {
  const isPysa = session.page === "pysanantonio";
  const isAccessGranted = session.page === "access-granted";
  const isModel = session.page === "the-model";
  const isGiveALot = session.page === "give-a-lot";
  /**
   * Hero and nothing else — declared per activation, see `heroOnly`.
   *
   * An activation with no running order and no speakers to add has nothing to
   * put in the band below the masthead, so its message rides in the hero
   * column and `ActivationDetail` is skipped. The copy in lib/schedule.ts is
   * trimmed to one paragraph to pay for it.
   */
  const isHeroOnly = session.heroOnly === true;
  /**
   * Not a band — this one keeps the shared hero and only lights what is behind
   * the mark, which is why it is a flag here rather than a fifth entry in the
   * list above.
   */
  const isOpenCircuit = session.page === "open-circuit";
  /** Every banded activation renders the same actions in its band's slot. */
  const banded = isPysa || isAccessGranted || isModel || isGiveALot;
  /**
   * The one talk that goes in the hero instead of a section below it.
   *
   * One or two, and only where the hero has room: an activation with a `hero`
   * photograph already fills its right half, and a band-led one (PySA, Access
   * Granted, The Model, Give-a-LOT) does not use this hero at all.
   *
   * Two, not one, since Datanauts landed a pair. The old rule was that
   * anything past one is a running order and a list does not belong in a
   * masthead — true of a twelve-slot afternoon, and not of two half-hour
   * talks that between them *are* the hour. What a reader came to a community
   * page for is what is on, and with a pair the second one sat below the fold
   * under a heading, which is the scroll `HeroTalk` exists to remove.
   *
   * Three would be a list. The card carries a time, a title and the people
   * for each, so two is roughly 320px of panel and three would outgrow the
   * hero it is meant to fit inside.
   */
  const heroTalks =
    !banded &&
    !session.hero &&
    !session.detail?.ownProgramme &&
    sessions.length > 0 &&
    sessions.length <= 2
      ? sessions
      : [];

  /**
   * "Everything else at X" has to actually be true.
   *
   * Legacy Park and 300 Main host exactly one activation each, so on those
   * pages the link promises a room's week and delivers the page you are
   * already standing on. Read off the room rather than hardcoded, so it
   * returns by itself the moment a second session lands there.
   */
  const hasMoreAtVenue = session.venue.sessions.length > 1;
  const heroTitle = heroTitleParts(session);
  return (
    <main>
      {/* Event rich results for this activation, tied to the week through
          superEvent so the two read as parent and child rather than as rival
          events on the same day. Only when the time is confirmed — an Event
          without a start date isn't eligible anyway, and publishing one for
          something still being locked would be marking up a guess. */}
      {activationEvent(session) && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(activationEvent(session)!),
          }}
        />
      )}
      <section className="border-t border-white/10 bg-black">
        <div
          className={cn(
            "mx-auto w-full max-w-7xl px-6",
            isHeroOnly ? "pt-5 lg:pt-6" : "pt-8 lg:pt-10",
          )}
        >
          <BackLink
            href="/schedule"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
          >
            <ArrowLeft
              className={cn(
                ARROW_MOTION,
                "h-3.5 w-3.5",
                "group-hover:-translate-x-0.5 group-hover:text-magenta",
                "group-focus-visible:-translate-x-0.5 group-focus-visible:text-magenta",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
            Back
          </BackLink>
        </div>
      </section>

      {/* No `detailHref` — the band is the page here, not a link to it. The
          band carries its own date, time and venue, so PySanAntonio gets the
          actions in a strip beneath it rather than the detail row the
          type-led hero draws. */}
      {banded ? (
        /* The actions ride inside the band rather than in a strip beneath it.
           The art column runs taller than the copy, so a separate strip left
           ~140px of empty black under the organisers and put the register
           button below the fold on a MacBook Air once browser chrome is
           counted. In the band's own slot they sit right under the partners,
           where the eye already is.

           No `detailHref` on either — the band is the page here, not a link
           to it. */
        (() => {
          /*
           * Register always; the calendar only when there is a date to put in
           * it.
           *
           * This was one `session.when &&` around the pair, which was right
           * while every banded activation had a confirmed slot. Give-a-LOT
           * does not — its day is fixed and its hour is not — and the whole
           * block evaporating took the page's only CTA and its "everything
           * else at" link with it, leaving a masthead that stated an event and
           * offered no way in. Registration was never the thing that needed a
           * timestamp.
           */
          const actions = (
            <>
              {/* Full width below sm. These already wrap to two rows on a
                  390px phone — 178px and 238px inside a 342px container — so
                  stacking isn't the change; matching their widths is. Ragged
                  right edges on two stacked buttons read as a mistake, and the
                  tap targets get bigger for free. */}
              <div className="flex flex-wrap items-center gap-3">
                {/* `register` where the activation is entered somewhere else
                    — see the field in lib/schedule. Unset everywhere but
                    Trinity, where it is the week's list as usual. */}
                <ButtonLink
                  href={session.register?.href ?? "/register"}
                  size="lg"
                  className="w-full sm:w-auto"
                  {...(session.register
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {session.register?.label ?? "Get on the list."}
                </ButtonLink>
                {session.when && (
                  <AddToCalendar
                    icsHref={`/schedule/${session.page}/calendar`}
                    event={{
                      title: session.title,
                      details: `${session.blurb} Part of San Antonio Startup + Tech Week.`,
                      // Same builder the .ics routes use — the two calendar
                      // paths for one event must not disagree about where it
                      // is, and neither may assume the district.
                      location: eventLocation(session),
                      start: session.when.start,
                      end: session.when.end,
                    }}
                  />
                )}
              </div>
              {sponsor && (
                <CircuitSponsorLine sponsor={sponsor} className="mt-9" />
              )}
              {hasMoreAtVenue && (
                <p className="mt-8">
                  <Link
                    href={`/schedule/${session.venue.slug}`}
                    className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-200 hover:text-magenta"
                  >
                    Everything else at {session.venue.name}
                    <ArrowUpRight
                      className={cn(
                        ARROW_MOTION,
                        "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                      )}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Link>
                </p>
              )}
            </>
          );
          if (isPysa) return <PysaBand masthead actions={actions} />;
          if (isModel) return <ModelBand masthead actions={actions} />;
          if (isGiveALot) return <GiveALotBand masthead actions={actions} />;
          return <AccessGrantedBand masthead actions={actions} />;
        })()
      ) : (
        /* Type-led, and deliberately not the venue's portrait. Borrowing the
           room's art made the venue look like the subject — on
           /schedule/mission-pitch the first thing you saw was Texas Public
           Radio. These are their own events and will get their own hero art;
           until it lands, the title carries the page and the right-hand space
           is left open for it. */
        /* `min-h-[calc(100vh-4rem)]` is the site's full-viewport hero, the
           same measure hero-shell and form-page use — 4rem being the header.
           Without it this section was content-sized at a flat 578px, which
           looks deliberate on a laptop and leaves 700px of footer above the
           fold on a 1440px-tall monitor. Centred rather than top-aligned so
           the copy sits with the picture as the box grows. */
        <section
          className={cn(
            "relative flex items-center overflow-hidden bg-black",
            // The default reserves the header's 4rem and nothing else, which
            // is a masthead that fills the screen on its own terms. College
            // Night has to fit the screen instead — everything on it, down to
            // the hosts, above the fold on a laptop — and the BACK row above
            // this section costs another ~60px the calc never knew about.
            // The tighter calc is not College Night's alone any more. A page
            // whose hero carries the talks is making the same promise —
            // everything on it above the fold on a laptop — and the default
            // 4rem reserve does not know about the BACK row above this
            // section, which costs ~60px. Measured on a 1440x789 Air, GDG's
            // hero ran to y855 against a 789 fold; on this calc it lands
            // inside it.
            isHeroOnly || heroTalks.length > 0
              ? "min-h-[calc(100vh-9.5rem)]"
              : "min-h-[calc(100vh-4rem)]",
          )}
        >
          {/* Set into the black, not laid on top of it — the same grammar the
              PySanAntonio band uses for its clip.
    
              Three things do that work: the mask dissolves the left edge so
              there is no seam where the picture starts, the scrim carries the
              copy side back to solid, and a top-and-bottom fade settles the
              whole thing into the sections above and below.
    
              `lg` and up only. Below that the hero is one column and a
              photograph behind the type would just fight it. */}
          {session.hero && (
            <>
              <div
                aria-hidden="true"
                // Wider past 2xl, because the picture bleeds to the right edge
                // while the copy stops at the centred `max-w-7xl` — which
                // orphans the left gutter as a dead black quadrant, 664px of
                // it on a 2560px monitor. Reaching across means that space
                // holds the dissolved edge of the photograph instead of
                // nothing, without moving the copy off the site's grid.
                className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] [--hero-fade:28%] lg:block 2xl:w-[68%] 2xl:[--hero-fade:44%]"
              >
                <Image
                  src={session.hero.src}
                  alt=""
                  fill
                  sizes="54vw"
                  // Neither `priority` nor `loading="eager"`, which is why Next
                  // logs this as the LCP and asks for one on every build. The
                  // warning is expected. It is not a bug and it is not new.
                  //
                  // Both defeat the `hidden lg:block` wrapper: a hidden image
                  // is only skipped because the default is lazy, so anything
                  // that turns lazy off makes narrow viewports fetch a picture
                  // they never render.
                  //
                  // Measured on this photograph, per activation page:
                  //
                  //                          390px    820px    1440px
                  //   as it stands            0 KB     0 KB    60.6 KB
                  //   loading="eager"      17.9 KB  42.1 KB    60.6 KB
                  //   eager + narrow sizes 17.9 KB  17.9 KB    60.6 KB
                  //
                  // Two corrections to what this comment used to say. The
                  // phone figure was recorded as 30KB and is 17.9; and the
                  // tablet was never costed at all, which mattered, because at
                  // `sizes="54vw"` an 820px viewport pulls 42KB — more than
                  // twice the phone and the worst number on the table.
                  //
                  // That last row is why the tablet number is not an argument
                  // on its own: `sizes="(min-width: 1024px) 54vw, 1px"` drops
                  // it to the phone's. It does not go lower, and 1px is not a
                  // typo — Next serves a fixed ladder of widths, so anything
                  // below the smallest configured one resolves to the same
                  // 17.9KB variant. There is a floor, and eager loading pays
                  // it on every device that will never draw the image.
                  //
                  // So this stays a live trade rather than a closed one. ~18KB
                  // of unused transfer on every narrow viewport buys a real
                  // desktop LCP improvement on a photograph that is decorative
                  // and sits behind a scrim. If that call is ever taken,
                  // `loading="eager"` plus the narrow `sizes` above is the
                  // cheapest version of it — `priority` also emits a preload
                  // link and costs more.
                  //
                  // The wider the screen, the more `cover` has to crop off the
                  // vertical — 470px of a 1200px frame on a 2560px monitor.
                  // Centred, that takes half off the top, which on these
                  // photographs is where the faces are. Anchoring high spends
                  // the crop on the floor instead.
                  className="object-cover object-[center_15%]"
                  style={{ maskImage: HERO_MASK, WebkitMaskImage: HERO_MASK }}
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden lg:block"
                style={{ background: HERO_SCRIM }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden lg:block"
                style={{ background: HERO_VEIL }}
              />
            </>
          )}

          <div
            className={cn(
              "relative z-10 mx-auto w-full max-w-7xl px-6",
              // Same reserve as the calc above, and for the same reason: a
              // hero carrying the talks has to fit the laptop, and 56px of
              // top padding it does not need is 56px the panel does.
              isHeroOnly || heroTalks.length > 0
                ? "pb-10 pt-6 lg:pb-12 lg:pt-8"
                : "pb-16 pt-10 lg:pb-16 lg:pt-14",
            )}
          >
            {/* Two columns only when there is a talk to put in the second one.
                Without it the copy keeps its own `max-w-3xl` and the hero is
                unchanged for every other activation. */}
            <div
              className={cn(
                heroTalks.length > 0 &&
                  "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]",
              )}
            >
              <div className="max-w-3xl">
                <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                  {session.venue.name} · {session.circuit}
                </p>
                {/* The lockup replaces the typeset title where one exists, so
                  the page wears the event's own mark. The heading still has to
                  exist for the document outline and for anything that can't
                  render the image, so it goes visually-hidden rather than
                  away. */}
                {session.logo ? (
                  <>
                    <h1 className="sr-only">{session.title}</h1>
                    {/* The mark gets a positioned box of its own so an
                      activation can put something behind it — Open Circuit
                      does, and its glow has to be anchored to the lockup
                      rather than to the viewport. The width caps moved here
                      from the image, which now simply fills this; the drawn
                      size is identical either way.
                      `group/mark` is named rather than bare: the hero already
                      sits inside other groups, and an unnamed one here would
                      be claimed by whichever ancestor Tailwind resolved
                      last. */}
                    <div
                      className={cn(
                        "group/mark relative mt-6",
                        // Capped by width, a stacked mark comes out about twice
                        // the height of a wide one — 1 Million Cups rendered
                        // 512x256 against Mission Pitch's 512x125, and pushed
                        // the copy block from 430px to 557px. The bento cards
                        // already normalise on height; this does the same by
                        // giving anything squarer than 3:1 a narrower ceiling,
                        // which lands every mark near the same optical size
                        // without the distortion `max-height` would cause on an
                        // element whose width is already fixed.
                        session.logo.width / session.logo.height >= 3
                          ? "max-w-sm sm:max-w-md lg:max-w-lg"
                          : "max-w-56 sm:max-w-64 lg:max-w-xs",
                      )}
                    >
                      {isOpenCircuit && <OpenCircuitGlow />}
                      <Image
                        src={session.logo.src}
                        // Decorative here, deliberately: the sr-only h1 above
                        // already announces the name, so alt text on the mark
                        // would say it twice. `logo.alt` still carries a real name
                        // for the bento card, where the mark is the only content
                        // inside the link and has to name it.
                        alt=""
                        width={session.logo.width}
                        height={session.logo.height}
                        priority
                        // Above the board behind it. Without a stacking context of
                        // its own the mark would paint in DOM order, which puts it
                        // under the bright layer the cursor drags around.
                        className="relative z-10 h-auto w-full"
                      />
                    </div>
                  </>
                ) : (
                  <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl xl:text-7xl">
                    {/* `lg:block` on a span rather than a `<br>`: a break element
                      is unconditional, and below lg this has to fall back to
                      wrapping wherever the narrow column runs out. Going block
                      only at lg gives the tail its own line on desktop and
                      leaves the phone alone. The h1's text content is
                      unchanged either way, so the outline and anything reading
                      the page still see one clean string. */}
                    {accented(heroTitle[0], session.titleAccent)}
                    {heroTitle[1] && (
                      <>
                        {" "}
                        <span className="lg:block">
                          {accented(heroTitle[1], session.titleAccent)}
                        </span>
                      </>
                    )}
                  </h1>
                )}
                {/* The line that was heading the section below until that
                    section went, moved up under the title. It is the only
                    piece of that block worth carrying: an instruction, where
                    everything around it describes. Above the hook rather than
                    between hook and paragraph — title, deck, then body.
                    
                    Only where the title is typeset. An activation with a logo
                    has an image for its h1, and these lockups end in a display
                    line of their own — Alamo Angels' carries "5th Annual
                    Venture Brunch" — so a deck under it is a second headline
                    at the same weight rather than a deck. Theirs was also the
                    last clause of the paragraph below it. */}
                {isHeroOnly && !session.logo && session.detail?.headline && (
                  <p className="mt-4 text-pretty font-display text-2xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-3xl">
                    {session.detail.headline}
                  </p>
                )}
                {/* One paragraph, not two. College Night's lede opens on the
                    subjects and closes on the student ID, and the blurb in
                    front of it was a third thing to read before either. The
                    blurb still earns its keep off-page — meta description,
                    calendar details, JSON-LD — it just is not the hero copy
                    here. */}
                {isHeroOnly ? (
                  session.detail?.lede[0] && (
                    <p className="mt-5 max-w-xl text-pretty text-lg text-white/60">
                      {session.detail.lede[0]}
                    </p>
                  )
                ) : (
                  <p className="mt-6 max-w-xl text-pretty text-lg text-white/60">
                    {session.blurb}
                  </p>
                )}
                {/* A locked slot belongs in the hero, not filed under a
                  "running order" heading further down — once the date, the
                  hour and the room are all fixed, that IS the headline detail
                  and the page can go straight to the two things a reader
                  wants to do with it. */}
                {session.when ? (
                  <>
                    <dl
                      className={cn(
                        "flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55",
                        isHeroOnly ? "mt-6" : "mt-8",
                      )}
                    >
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays
                          className="h-4 w-4 shrink-0 text-magenta"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Date</dt>
                        <dd>{whenLabels(session.when).date}</dd>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Clock
                          className="h-4 w-4 shrink-0 text-magenta"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Time</dt>
                        <dd>{whenLabels(session.when).time}</dd>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <MapPin
                          className="h-4 w-4 shrink-0 text-magenta"
                          aria-hidden="true"
                        />
                        <dt className="sr-only">Location</dt>
                        <dd>
                          {session.venue.name}
                          {session.venueDetail
                            ? `, ${session.venueDetail}`
                            : ""}
                        </dd>
                      </div>
                    </dl>

                    {/* The terms the primary action is subject to, and ahead
                        of it rather than in a band below: "Request a seat." is
                        a different promise once you know attendance is by
                        invitation, and that is worth knowing before the click
                        rather than after it. */}
                    {isHeroOnly && session.detail?.access && (
                      <p className="mt-5 max-w-xl text-pretty text-sm text-white/55">
                        {session.detail.access}
                      </p>
                    )}

                    {/* Between the slot and the buttons, not after them. The
                        hosts are part of what the reader is deciding on — who
                        is running this — so they belong on the way to the CTA
                        rather than trailing it. Also keeps the buttons as the
                        last thing before the fold. */}
                    {isHeroOnly && session.detail?.poweredBy && (
                      <PoweredBy
                        orgs={session.detail.poweredBy}
                        className="mt-7"
                      />
                    )}

                    {/* Full width below sm — see the note on the banded row. */}
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-3",
                        isHeroOnly ? "mt-6" : "mt-8",
                      )}
                    >
                      {/* See the banded row above — same override, same
                          reason. */}
                      <ButtonLink
                        href={session.register?.href ?? "/register"}
                        size="lg"
                        className="w-full sm:w-auto"
                        {...(session.register
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                      >
                        {session.register?.label ?? "Get on the list."}
                      </ButtonLink>
                      <AddToCalendar
                        icsHref={`/schedule/${session.page}/calendar`}
                        event={{
                          title: session.title,
                          details: `${session.blurb} Part of San Antonio Startup + Tech Week.`,
                          location: eventLocation(session),
                          start: session.when.start,
                          end: session.when.end,
                        }}
                      />
                    </div>

                    {/* Below the buttons, with the organiser, not above them
                        with the facts.
                        
                        A presenting partner is a credit, not something the
                        reader is deciding on, and above the CTA it stood
                        between the time and place and the button — the two
                        things someone who has decided wants next to each
                        other. The page already had a credit zone down here,
                        and it was inverted: `Run by`, the operator and the
                        more useful of the two, sat below the button while the
                        sponsor sat above it. Nothing is lost by the move —
                        measured, this whole hero clears the fold on a
                        MacBook Air and a 13-inch, so the credit is still on
                        screen.

                        Above `Run by` rather than merged into it: that row is
                        11px mono, and folding a paying partner into it would
                        shrink the one line they are named on. */}
                    {session.poweredBy && (
                      <PoweredByLine
                        orgs={session.poweredBy}
                        className={isHeroOnly ? "mt-6" : "mt-8"}
                      />
                    )}
                    {/* With the presenting partner, not above the buttons.
                        The banded heroes already put this line below their
                        actions (see the `mt-9` copy in the band's `actions`),
                        so the same component was landing on opposite sides of
                        the same button depending on which hero a reader
                        happened to open. Below is the one that matches, and
                        the one the argument favours: a circuit's sponsor is a
                        credit, not something the reader is deciding on. */}
                    {sponsor && (
                      <CircuitSponsorLine
                        sponsor={sponsor}
                        className={
                          session.poweredBy
                            ? "mt-4"
                            : isHeroOnly
                              ? "mt-6"
                              : "mt-8"
                        }
                      />
                    )}
                    {/* The organiser and the room, kept in the hero rather than
                      given a section of their own — with the slot locked
                      there's nothing else to say, and a whole band under this
                      one to hold two links was padding. */}
                    <p
                      className={cn(
                        "flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55",
                        session.poweredBy || sponsor
                          ? "mt-4"
                          : isHeroOnly
                            ? "mt-6"
                            : "mt-8",
                      )}
                    >
                      {session.site &&
                        (session.site.href ? (
                          <a
                            href={session.site.href}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-magenta"
                          >
                            Run by {session.site.label}
                            <ArrowUpRight
                              className={cn(
                                ARROW_MOTION,
                                "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                              )}
                              strokeWidth={2.5}
                              aria-hidden="true"
                            />
                          </a>
                        ) : (
                          // No arrow and no link: an arrow promises somewhere to
                          // go, and this one is us.
                          <span>Run by {session.site.label}</span>
                        ))}
                      {hasMoreAtVenue && (
                        <Link
                          href={`/schedule/${session.venue.slug}`}
                          className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-magenta"
                        >
                          Everything else at {session.venue.name}
                          <ArrowUpRight
                            className={cn(
                              ARROW_MOTION,
                              "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                            )}
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        </Link>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-white/55">
                    Sept 28 – Oct 2 · San Antonio
                  </p>
                )}
              </div>
              {heroTalks.length > 0 && (
                <HeroTalk
                  sessions={heroTalks}
                  speakers={speakers}
                  // Only where the talk does not simply fill the activation.
                  // Moot for a pair — that card always prints its own times,
                  // because the hour on the left cannot say when either of
                  // two talks inside it starts.
                  showTime={
                    !session.when ||
                    new Date(session.when.start).getTime() !==
                      heroTalks[0].startsAt ||
                    new Date(session.when.end).getTime() !== heroTalks[0].endsAt
                  }
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* One programme or the other, never both. CMS rows win when they exist:
          they carry speakers, they link back from the speaker pages, and an
          organiser can change them without a deploy. The prose version is what
          an organiser sent over before any of that was entered.
      
          Unless the prose is the fuller account, which `ownProgramme` marks.
          The brunch is a five-act morning in `detail` and a single row in the
          CMS, and the default rule hid four of the five acts behind that row.
          The row still exists and still feeds the speaker pages; it just does
          not get to speak for the morning here. */}
      {sessions.length > 0 && !session.detail?.ownProgramme ? (
        // Suppressed when the hero has already said everything this would —
        // which is the single-talk case, where the card carries the abstract
        // whole. A pair rides in the hero as a bill with no abstracts, so the
        // order below still runs and is where they live. See `HeroTalk`.
        heroTalks.length === 1 ? null : (
          <ActivationSessions sessions={sessions} speakers={speakers} />
        )
      ) : isHeroOnly ? null : (
        <ActivationDetail detail={session.detail} speakers={speakers} />
      )}

      {/* Only while the slot is open, and only while nothing real has landed —
          a promise of times is worth printing until there are times and
          embarrassing after. A confirmed session is otherwise hero and nothing
          else: the date, the room, the two actions and the two links all fit
          above the fold.
      
          A prose programme counts as something real. Give-a-LOT has no `when`
          because it runs across four days and cannot sit on an hour axis, but
          its Friday giveaway has a fixed hour and states it two sections up —
          "times go up as they're confirmed" printed under a confirmed time. */}
      {!session.when && sessions.length === 0 && !session.detail?.programme && (
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                The running order
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
                Still being locked.
              </h2>
              {/* TODO(content): times land here as each organiser publishes
                them. Saying so plainly beats an empty grid. */}
              <p className="mt-4 max-w-xl text-pretty text-white/60">
                Times go up as they&rsquo;re confirmed. What&rsquo;s fixed is
                the room and who&rsquo;s running it.
              </p>

              <dl className="mt-10 grid gap-x-10 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-2">
                <div>
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                    Where
                  </dt>
                  <dd className="mt-1.5 text-white">
                    {isPysa
                      ? `${PYSA.venue}, ${PYSA.venueDetail}`
                      : session.venue.name}
                    {/* Into the rest of that room's week — the reason an
                      activation page and a venue page both exist. */}
                    {/* ArrowUpRight, not a `&rarr;` entity — every arrow that
                      leads somewhere else on this site is the diagonal lucide
                      glyph, and it jumps the way it points. */}
                    {hasMoreAtVenue && (
                      <Link
                        href={`/schedule/${session.venue.slug}`}
                        className="group mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-200 hover:text-magenta"
                      >
                        Everything else at {session.venue.name}
                        <ArrowUpRight
                          className={cn(
                            ARROW_MOTION,
                            "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                          )}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                  </dd>
                </div>

                {/* Where the depth actually lives. These are partner-run events
                  with their own schedules and applications; this page places
                  them in the week and hands off rather than half-copying. */}
                {session.site && (
                  <div>
                    <dt className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                      Run by
                    </dt>
                    <dd className="mt-1.5">
                      {session.site.href ? (
                        <a
                          href={session.site.href}
                          target="_blank"
                          rel="noreferrer"
                          className="group inline-flex items-center gap-1.5 text-white transition-colors duration-200 hover:text-magenta"
                        >
                          {session.site.label}
                          <ArrowUpRight
                            className={cn(
                              ARROW_MOTION,
                              "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                            )}
                            strokeWidth={2.5}
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <span className="text-white">{session.site.label}</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* Skipped when the hero already carries a register button — one
          primary action per page, not the same one twice.
      
          `!session.when` was doing that job on the assumption that the hero
          only draws its actions for a confirmed slot. A banded activation
          draws them either way — deliberately, so Give-a-LOT's page has a way
          in while its hour is unfixed — so this printed a second CTA under
          the first, and pointed it at the week's list rather than at the
          activation's own registration. */}
      {!session.when && !banded && (
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                Free registration · Sept 28 – Oct 2
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
                Get on the list.
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-white/60">
                One registration covers the whole week, {session.title}{" "}
                included.
              </p>
              <div className="mt-7">
                <ButtonLink href="/register" size="lg">
                  Get on the list.
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default async function VenueSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const schedule = resolveSchedule(slug);
  // A URL that shipped and then moved — see RETIRED_PAGES. Checked before the
  // 404, and 308 for the same reason the venue redirect is: the ranking moves
  // across rather than both being held.
  const moved = RETIRED_PAGES[slug];
  if (moved) permanentRedirect(`/schedule/${moved}`);

  if (!schedule) notFound();

  if (schedule.kind === "activation") {
    // Filtered in memory rather than queried: this is a handful of rows,
    // Firestore would want an index for it, and listSessions is already
    // fetched and request-cached for the speaker pages.
    const all = await safeList(listSessions());
    const mine = all.filter((s) => s.activation === schedule.session.page);
    // The roster where anything on the page will use it: a CMS session's
    // participants, or a hardcoded programme that names someone with a
    // `speaker` slug. Neither means no join, and no reason to read Firestore.
    const namesSpeakers = (schedule.session.detail?.programme ?? []).some((i) =>
      (i.people ?? []).some((who) => who.speaker),
    );
    const speakers =
      mine.length > 0 || namesSpeakers ? await safeList(listSpeakers()) : [];
    return (
      <ActivationPage
        session={schedule.session}
        sessions={mine}
        speakers={speakers}
        sponsor={circuitSponsor(
          schedule.session.circuit,
          await safeList(listSponsors()),
        )}
      />
    );
  }

  // A room with one activation sends people to that activation instead of
  // rendering a venue page restating it. 308 rather than 307, so search
  // engines move the ranking across rather than holding both.
  const to = venueRedirect(slug);
  if (to) permanentRedirect(to);

  const { room, sessions } = schedule;
  const partners = await safeList(listPartners());

  /**
   * The room's own CMS sessions, which this page did not used to read at all.
   *
   * `resolveSchedule` builds a venue's list from the hardcoded array, so a
   * standalone session entered in the admin reached the week grid and the day
   * view and never reached the page headed "What's running here." A room
   * running a dozen half-hour talks would have shown the two activations
   * around them and nothing else — a heading contradicted by its own contents.
   *
   * Same rule the calendar applies: rows with no activation, in this room. A
   * row that names an activation belongs inside it, and already renders there.
   */
  const talksByDay = new Map<string, CalendarItem[]>();
  for (const item of await liveCalendarItems()) {
    if (item.venueSlug !== room.slug) continue;
    const bucket = talksByDay.get(item.dayIso) ?? [];
    bucket.push(item);
    talksByDay.set(item.dayIso, bucket);
  }

  // Same lockup resolution as /schedule — a session that borrows a partner's
  // mark tracks whatever the admin has uploaded rather than a file in the repo.
  const cards: SessionCard[] = sessions.map((s) => {
    if (s.logo) return { ...s, logoSrc: s.logo.src, logoAlt: s.logo.alt };
    if (s.logoFromPartner) {
      const needle = s.logoFromPartner.toLowerCase();
      const match = partners.find((p) => p.name.toLowerCase().includes(needle));
      if (match?.imageUrl) {
        return { ...s, logoSrc: match.imageUrl, logoAlt: match.name };
      }
    }
    return s;
  });

  // One bucket per day this room actually runs, in week order, plus whatever
  // has no slot yet. `sessions` already arrives in date order, so pushing into
  // an insertion-ordered Map keeps the days in order without a second sort.
  const groups = new Map<
    string,
    {
      iso: string;
      weekday: string;
      label: string;
      cards: SessionCard[];
      talks: CalendarItem[];
    }
  >();
  // A span is not undated — it runs across days rather than on one. Filing it
  // under "slot to be confirmed" said the opposite of the truth for the one
  // activation whose dates were settled first.
  const spanned: SessionCard[] = [];
  const undated: SessionCard[] = [];
  for (const card of cards) {
    const day = sessionDay(card);
    if (!day) {
      (card.span ? spanned : undated).push(card);
      continue;
    }
    const bucket = groups.get(day.iso) ?? { ...day, cards: [], talks: [] };
    bucket.cards.push(card);
    groups.set(day.iso, bucket);
  }

  // A day can be all talks and no activation — a room running a speaker track
  // on a day nothing else is booked in it — so the buckets are opened from
  // both sources rather than only from the cards.
  for (const [iso, talks] of talksByDay) {
    const day = dayMeta(iso);
    if (!day) continue;
    const bucket = groups.get(iso) ?? { ...day, cards: [], talks: [] };
    bucket.talks = talks.sort((a, b) => a.startMin - b.startMin);
    groups.set(iso, bucket);
  }

  // Explicitly by date now. Insertion order was enough while every bucket came
  // from one already-sorted list; with a second source opening buckets of its
  // own, a Tuesday entered after a Thursday would have printed in that order.
  const dayGroups = [...groups.values()].sort(
    (a, b) =>
      EVENT_DAYS.findIndex((d) => d.iso === a.iso) -
      EVENT_DAYS.findIndex((d) => d.iso === b.iso),
  );

  return (
    <main>
      {/* The venue's own masthead — the same portrait-and-panel grammar as
          room-flow's rows, so arriving here reads as stepping into the row you
          clicked rather than landing somewhere unrelated. */}
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
          {/* Same back link as /speakers/[slug], down to the charge landing on
              the arrow rather than the whole control: the label lifts a step in
              brightness, the arrow is the only thing that takes colour. */}
          <BackLink
            href="/schedule"
            className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
          >
            <ArrowLeft
              className={cn(
                ARROW_MOTION,
                "h-3.5 w-3.5",
                "group-hover:-translate-x-0.5 group-hover:text-magenta",
                "group-focus-visible:-translate-x-0.5 group-focus-visible:text-magenta",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
            Back
          </BackLink>

          <div className="mt-8 grid overflow-hidden lg:grid-cols-[3fr_2fr]">
            <div className="relative aspect-4/3 bg-black lg:aspect-video">
              {room.image ? (
                <Image
                  src={room.image}
                  alt={room.name}
                  width={room.imageWidth ?? 1280}
                  height={room.imageHeight ?? 720}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority
                  className={cn(
                    "absolute inset-0 h-full w-full",
                    room.fit === "contain"
                      ? "object-contain"
                      : "object-cover object-center",
                  )}
                />
              ) : (
                <pre
                  aria-hidden="true"
                  className="overflow-x-auto p-4 font-mono text-[11px] leading-tight text-magenta"
                >
                  {room.ascii}
                </pre>
              )}
            </div>

            <div className="flex flex-col bg-black p-6 lg:p-8">
              <div className="mb-3.5 border-b border-white/10 pb-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">
                  {room.host}
                </p>
              </div>
              <h1 className="font-display text-3xl font-bold uppercase leading-none text-white sm:text-4xl">
                {room.name}
              </h1>
              <div className="mt-3">
                <span className="rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-magenta">
                  {room.tag}
                </span>
              </div>
              <p className="mt-4 text-pretty text-white/60">{room.desc}</p>
              <p className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-widest text-white/55">
                Sept 28 – Oct 2 · San Antonio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Confirmed
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              What&rsquo;s running here.
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              More lands as it&rsquo;s locked. These are confirmed for{" "}
              {room.name}.
            </p>
          </div>

          {/* Grouped by day, not one flat grid.
          
              A room's week arrived as cards ordered by date with the day
              printed small on each, which reads as a pile: nothing told you The
              Rand runs four things on Tuesday and one on Friday without
              checking five cards. The same data under day headings is a
              schedule — and it is the "this location, this day" view the grid
              pages cannot give, because they are one day or one week and never
              one room across both.
          
              Anything without a confirmed slot keeps the old ungrouped grid at
              the foot. A day heading over a session that has no day would be
              inventing one. */}
          {dayGroups.map((group) => (
            <div key={group.iso} className="mt-12 lg:mt-14">
              <div className="flex items-baseline gap-3 border-b border-white/10 pb-3">
                <h3 className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white sm:text-2xl">
                  {group.weekday}
                </h3>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                  {group.label} · {group.cards.length + group.talks.length}{" "}
                  {group.cards.length + group.talks.length === 1
                    ? "session"
                    : "sessions"}
                </p>
              </div>
              {group.cards.length > 0 && (
                <div className="mt-6 lg:mt-8">
                  <SessionBento
                    sessions={group.cards}
                    matchTitleSize
                    inContext
                  />
                </div>
              )}

              {/* The room's own talks, as rows rather than cards.
              
                  A bento card is ~260px and earns it for an activation: a
                  lockup, a hero, five hours and a partner to credit. A
                  thirty-minute talk by one person has none of that, and a
                  dozen of them in card form is 3,000px of scrolling for a
                  running order. Rows put the same day on one screen.
              
                  The split matches the one the week grid already makes
                  between a block and a summary: the shape follows how much is
                  behind it, not what kind of record it came from. */}
              {group.talks.length > 0 && (
                <ul
                  className={group.cards.length > 0 ? "mt-8" : "mt-6 lg:mt-8"}
                >
                  {group.talks.map((talk) => (
                    <li
                      key={talk.slug}
                      className="group relative flex items-baseline justify-between gap-6 border-b border-white/10 py-4"
                    >
                      <div className="min-w-0">
                        {/* The whole row, via the stretched `::after` the grid
                            blocks use — a 14px title is a small target and the
                            time on the far right is part of the same thing.
                            `href` is null for a talk inside an activation,
                            which is not reachable here (this list is built
                            from standalone sessions) but is cheap to honour
                            rather than assume. */}
                        {talk.href ? (
                          <Link
                            href={talk.href}
                            className="block text-pretty font-medium text-white transition-colors duration-200 after:absolute after:inset-0 hover:text-magenta focus-visible:text-magenta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta"
                          >
                            {talk.title}
                          </Link>
                        ) : (
                          <p className="text-pretty font-medium text-white">
                            {talk.title}
                          </p>
                        )}
                        {talk.people && (
                          <p className="mt-1 text-pretty text-sm text-white/60">
                            {talk.people}
                          </p>
                        )}
                      </div>
                      {/* The time, and — where the row leads somewhere — the
                          house arrow beside it. Without it the row announced
                          nothing at rest and only turned magenta on hover,
                          which is no affordance at all for anyone who does
                          not happen to sweep the mouse across it. */}
                      <p className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/55">
                        {talk.timeLabel}
                        {talk.href && (
                          <ArrowUpRight
                            className={cn(
                              ARROW_MOTION,
                              "h-3.5 w-3.5 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-magenta",
                            )}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {spanned.map((card) => (
            <div key={card.slug} className="mt-12 lg:mt-14">
              <div className="flex items-baseline gap-3 border-b border-white/10 pb-3">
                <h3 className="font-display text-xl font-bold uppercase leading-none tracking-tight text-white sm:text-2xl">
                  All week
                </h3>
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
                  {card.span ? spanLabel(card.span) : ""}
                </p>
              </div>
              <div className="mt-6 lg:mt-8">
                <SessionBento sessions={[card]} matchTitleSize inContext />
              </div>
            </div>
          ))}

          {undated.length > 0 && (
            <div className="mt-12 lg:mt-14">
              {dayGroups.length > 0 && (
                <p className="border-b border-white/10 pb-3 font-mono text-[11px] uppercase tracking-widest text-white/45">
                  Slot to be confirmed
                </p>
              )}
              <div className={dayGroups.length > 0 ? "mt-6 lg:mt-8" : ""}>
                <SessionBento sessions={undated} matchTitleSize />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Hosting is open · Sept 28 – Oct 2
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              Want a slot here?
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              Host an activation, sponsor the week, or just take a seat.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <ButtonLink href="/get-involved" size="lg">
                Get involved
              </ButtonLink>
              <Link
                href="/schedule"
                className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-white/50 transition-colors duration-200 hover:text-magenta"
              >
                Every room
                <ArrowUpRight
                  className={cn(
                    ARROW_MOTION,
                    "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  )}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
