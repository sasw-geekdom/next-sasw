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
import { ButtonLink } from "@/components/ui/button";
import { eventLocation } from "@/lib/calendar";
import { ARROW_MOTION } from "@/lib/motion";
import { AccessContinuous } from "@/components/site/access-continuous";
import {
  ACCESS_CONTINUOUS,
  ACCESS_GREEN,
  accessBlockFor,
} from "@/lib/access-granted";
import { ActivationDetail } from "@/components/site/activation-detail";
import {
  ActivationSessions,
  HeroTalk,
} from "@/components/site/activation-sessions";
import type { CardSpeaker } from "@/components/site/speaker-card";
import {
  listSponsors,
  listSessions,
  listSpeakers,
} from "@/lib/admin/cms-queries";
import type { SessionRow } from "@/lib/admin/cms-types";
import {
  activationSearchText,
  allSessions,
  dayMeta,
  standaloneItems,
  weekCalendar,
  resolveSchedule,
  scheduleSlugs,
  sessionDay,
  venueRedirect,
  RETIRED_PAGES,
  whenLabels,
  type ResolvedSession,
} from "@/lib/schedule";
import {
  VenueAgenda,
  type AgendaDay,
  type AgendaEntry,
} from "@/components/site/venue-agenda";
import { EVENT_DAYS } from "@/lib/event";
import { PYSA } from "@/lib/pysa";
import { MODEL_LAVENDER } from "@/lib/the-model";
import { BackLink } from "@/components/site/back-link";
import { activationEvent, jsonLd, venuePlace } from "@/lib/structured-data";
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
            // Always named. This used to go blank for an activation whose
            // address was disclosed only on RSVP, because "at Location shared
            // on RSVP" read as a bug and a description is no place to
            // advertise what is withheld. Every venue on the week is named
            // now, popups included, so the guard went with the field.
            const at = ` at ${schedule.session.venue.name}`;
            if (!w) {
              return `${schedule.session.blurb} At ${schedule.session.venue.name} during San Antonio Startup + Tech Week, Sept 28 – Oct 2, 2026.`;
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
 * Why a Python afternoon is here at all, pinned beside its running order.
 *
 * Python and PyTexas lead; DEVSA gets the last block, under its own name for
 * the programme — "Building Together", and the line off that page. A passing
 * clause at the end of a paragraph was the wrong shape for it: the reader has
 * already met the DEVSA mark in the hero wall above, so what the column owes
 * them is not another mention but somewhere to go, which is why the block ends
 * in a link rather than a sentence.
 *
 * Every claim is theirs, from pytexas.org. "2026 marked the 20th year of the
 * largest gathering of Python developers within the great state of Texas" is
 * verbatim off their 2026 page; the 2027 dates, the Austin Central Library and
 * "y'all means all" are off the 2027 one. The CFP date is the fact worth the
 * column, and it is printed as a date rather than as "Thursday of this week":
 * this page is read months before the week, during it and long after, and only
 * one of those readers knows which week that is. "Open from Thursday, October
 * 1" is true in all three tenses.
 *
 * Jordana Naftali is deliberately not billed here as the PyLadies organiser.
 * Her own bio, which her speaker page prints, says she "supports PyLadies
 * Austin even if not as actively as she'd like" — so a page calling her its
 * organiser would contradict the page one click away. Her line about community
 * is quoted instead, which is hers and needs no title. Upgrade this if she
 * confirms the role.
 */
/**
 * Why a creative-economy afternoon is here, pinned beside its running order.
 *
 * The Model's half of what `PysaAside` does for PySanAntonio, and written off
 * the same source of truth its band is: lib/the-model. Two things are carried
 * over from the long note on THE_MODEL's hook, because both are easy to
 * undo by accident.
 *
 * It does not sell anything. Three earlier passes at that hook borrowed
 * sentence shapes from elevenlabs.io/creative and runway.com and each one came
 * back a capability promise — "turn ideas into finished image, film and
 * voice". An event cannot turn a reader's ideas into anything. Borrow those
 * sites for vocabulary, never for sentence shape.
 *
 * And the order of the three nouns is load-bearing: creatives, founders,
 * builders run in the same order as The Creative Futures, Tech Bloc and
 * DEVSA in the wall above. Nothing labels that mapping and nothing needs to —
 * reorder MODEL_ORGANIZERS and this quietly stops working.
 */
function ModelAside() {
  return (
    <>
      <p
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color: MODEL_LAVENDER }}
      >
        Why this room
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
        Three rooms,
        <br />
        one afternoon.
      </h2>
      <div className="mt-6 space-y-4 text-pretty text-white/60">
        <p>
          Creatives, founders and builders do not usually share a floor. The
          Creative Futures, Tech Bloc and DEVSA put them on one for five hours
          &mdash; a community-driven activation that brings San Antonio&rsquo;s
          creative economy directly into the same room as the people building
          the tools it runs on.
        </p>
        <p>
          It opens on what is coming, and then it gets specific: local makers on
          the work itself &mdash; virtual reality, audio, Claude, and the image
          and video models &mdash; and on the recipes they actually ship with
          rather than the ones that demo well.
        </p>
        <p>
          Nobody is selling you a tool this afternoon. Every session here is
          somebody showing how they made something, in a city that has been
          making things a long time.
        </p>
      </div>
    </>
  );
}

function PysaAside() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-widest text-magenta">
        Why Python, why here
      </p>
      <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
        Community first,
        <br />
        language second.
      </h2>
      <div className="mt-6 space-y-4 text-pretty text-white/60">
        <p>
          That is Jordana Naftali&rsquo;s line, and it is the afternoon&rsquo;s
          too. Nothing here asks what you do for a living or how long
          you&rsquo;ve been writing Python &mdash; sensors and air quality,
          agents and their bad habits, and a quiz at the end that anybody can
          shout at.
        </p>
        <p>
          PyTexas is the through-line. The conference is its own event, run by
          the PyTexas Foundation, and 2026 marked its twentieth year and the
          largest gathering of Python developers in the state. The president of
          the Foundation opens this afternoon. PyTexas 2027 runs 16 &ndash; 18
          April at the Austin Central Library, with the call for proposals open
          from Thursday, October 1 &mdash; so if something here gives you an
          idea, you can act on it before the week is out.
        </p>
        <p>
          &ldquo;Y&rsquo;all means all&rdquo; is how PyTexas puts it. That is
          why the last hour is a quiz with a ticket to Austin on the board
          rather than another talk.
        </p>
      </div>
      <div className="mt-8 border-t border-white/10 pt-6">
        <p className="font-mono text-xs uppercase tracking-widest text-white/40">
          Building Together
        </p>
        {/* Their words, not ours. "Keeps this room going the other fifty-one
            weeks of the year" was a nice line and the wrong voice — DEVSA
            describes itself as a bridge across an ecosystem, not as a host
            with a key. See devsa.community. */}
        <p className="mt-3 text-pretty text-white/60">
          Where partners and communities come together to build. DEVSA is the
          bridge across San Antonio&rsquo;s tech ecosystem, connecting 20+
          grassroots groups into one.
        </p>
        <a
          href="https://www.devsa.community/buildingtogether"
          target="_blank"
          rel="noreferrer"
          className="group mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:text-magenta"
        >
          Find your people
          <ArrowUpRight
            className={cn(
              ARROW_MOTION,
              "h-3.5 w-3.5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            )}
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </a>
      </div>
    </>
  );
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
                unchanged for every other activation.

                Two sets of column widths, because the two things that can sit
                in that second column want opposite treatment. `HeroTalk` is a
                card of type — a time, a title and the people — and 24rem is a
                measure chosen for reading. A mark is one object, and at 24rem
                it was small enough on a 13-inch screen to read as a logo
                parked in the corner rather than as half the composition.

                `items-center` for the same reason. Against `items-start` the
                mark hangs off the top of a column the copy fills to the
                bottom, which is what makes it look parked; centred, it sits
                with the block it belongs to. The talk bill keeps `items-start`
                — that one is a card with its own top edge to align. */}
            <div
              className={cn(
                heroTalks.length > 0
                  ? "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"
                  : session.heroMark &&
                      "grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-14 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]",
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
                  <h1
                    className={cn(
                      "mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl",
                      // One size down at xl for a title too long to set at
                      // the full one — see `heroTitleTight`.
                      session.heroTitleTight ? "xl:text-6xl" : "xl:text-7xl",
                    )}
                  >
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
                        {/* The street, where the activation asks for it —
                            see `pinAddress`. Falls back to the venue's name
                            whenever there is no address to show, so turning
                            the flag on can never blank the line. */}
                        <dd>
                          {(session.pinAddress &&
                            session.venue.place?.address) ||
                            session.venue.name}
                          {session.venueDetail
                            ? `, ${session.venueDetail}`
                            : ""}
                        </dd>
                      </div>
                    </dl>

                    {/* Not a fourth item in the row above.
                        
                        It was one, and it read as more chrome: that row is
                        11px mono at 55% white because a date and a room are
                        facts nobody has to act on, and dressing a limit the
                        same way says it matters as little as they do. It also
                        wrapped onto a line of its own at narrow widths, which
                        is how a constraint ends up looking like a footnote.
                        
                        So it leaves the row and takes the one thing the row
                        cannot give it — weight — directly above the button,
                        where the decision is. "First come" only when the
                        week's own list is the way in; where `register` points
                        at somebody else's capped RSVP, a seat is reserved
                        rather than raced for. */}
                    {session.capacity ? (
                      <p className="mt-5 border-l-2 border-magenta pl-4 font-mono text-xs uppercase tracking-widest text-white">
                        {session.capacity} seats
                        {session.register ? null : " · first come"}
                      </p>
                    ) : null}

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
                        last thing before the fold.

                        Unless there is a mark in the second column, in which
                        case nothing is drawn here at all and the wall lives
                        under that mark instead — which means it is drawn from
                        `lg` up only, because that column does not exist below
                        it.

                        So an activation with a `heroMark` credits its
                        partners on laptops and monitors and not on phones.
                        That is a deliberate call rather than a gap: Texas
                        Venture Fest carries eight of them, which wrap to
                        three rows on a phone, and three rows of marks is a
                        screenful of other people's logos between a reader and
                        the thing they came to do. The names are all on the
                        organiser's own page, one tap away under `Run by`.

                        College Night has no `heroMark`, so its two marks stay
                        exactly here at every width. */}
                    {isHeroOnly &&
                      session.detail?.poweredBy &&
                      !session.heroMark && (
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
              {/* The organiser's mark, in the column the talk bill would use.
                  From `lg` up only — see `heroMark` in lib/schedule. */}
              {session.heroMark && (
                <div className="hidden lg:flex lg:justify-end">
                  {/* No `max-w-sm` here any more. It capped the mark at 384px
                      inside a column that is now 512px at `xl`, so the column
                      widths above would have had no effect at all. The column
                      is the cap. */}
                  <div className="w-full">
                    <Image
                      src={session.heroMark.src}
                      alt={session.heroMark.alt}
                      width={session.heroMark.width}
                      height={session.heroMark.height}
                      priority
                      className="h-auto w-full"
                    />
                    {/* The partners under the mark, not beside the copy — see
                        the note above the buttons, which is where this would
                        otherwise be drawn. Only when there is a mark to sit
                        under, and inside that column's `hidden lg:flex` — so
                        this is the wall's only copy, and it is a laptops-and-
                        monitors surface by construction. */}
                    {isHeroOnly && session.detail?.poweredBy && (
                      <PoweredBy
                        orgs={session.detail.poweredBy}
                        // No width of its own: the column is the measure. A
                        // 22rem cap lived here while there were six marks,
                        // because at the full width they packed four onto the
                        // first row and left the second trailing with half the
                        // column empty. The seventh partner made that cap the
                        // problem rather than the fix — it pushed the split to
                        // three, three and one, and a mark alone on a third
                        // row is worse than an uneven second one.
                        //
                        // Uncapped, seven wrap four and three at `xl` and
                        // three and four at `lg`. Both are even enough, and
                        // neither is a number written down anywhere: they fall
                        // out of the column. An eighth partner is worth
                        // re-measuring, not worth a constant.
                        className="mt-10 border-t border-white/10 pt-8"
                      />
                    )}
                  </div>
                </div>
              )}
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
          <ActivationSessions
            sessions={sessions}
            speakers={speakers}
            /* Only PySanAntonio. Six sessions run by two nonprofits, and the
               rows cap at a reading measure — so the right half of this
               section was empty black for the length of the afternoon. The
               pinned column fills it with the thing a reader arriving from
               /schedule does not have: who is putting this on. */
            /* PySanAntonio and The Model. Both are long afternoons whose
               rows cap at a reading measure, so the right half of this
               section was empty black for the length of the event; the
               pinned column fills it with the thing a reader arriving from
               /schedule does not have, which is who is putting this on and
               why it is one room rather than three.

               Only reaches the page at two sessions or more. Below that
               `ActivationSessions` takes its solo branch, where the talk's
               own title is the heading and a column of context beside it
               would outweigh the thing it is context for — which is where
               The Model sits today, with one session in the CMS against an
               afternoon its own blurb describes as five. */
            aside={
              isPysa ? <PysaAside /> : isModel ? <ModelAside /> : undefined
            }
            /* Access Granted's afternoon is five community groups with an
               hour each — see `ACCESS_BLOCKS`. The Model has one hosted block
               inside it: AlamoCityAI's hour, three presenters and a panel,
               entered as one session. Keyed on its slug rather than a time
               window, because it is one session and not an hour of several.
               Every other activation passes nothing and every row draws as it
               always has. */
            credit={
              isAccessGranted
                ? (s) => accessBlockFor(s.startsAt)
                : isModel
                  ? (s) =>
                      s.slug === "alamo-city-ai"
                        ? { name: "AlamoCityAI", href: "https://alamocityai.com/" }
                        : undefined
                  : undefined
            }
            creditAccent={isAccessGranted ? ACCESS_GREEN : undefined}
          />
        )
      ) : isHeroOnly ? null : (
        <ActivationDetail detail={session.detail} speakers={speakers} />
      )}

      {/* Under the running order, not in the band above it.
          Three things with no start time — see `ACCESS_CONTINUOUS`. They are
          the answer to "and if I can't make any of those?", which is a
          question a reader only has once they have read the order. */}
      {isAccessGranted && <AccessContinuous />}

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

  /**
   * The room's week as one running order — see VenueAgenda.
   *
   * Built from the same week calendar the day pages draw, so the two cannot
   * disagree about what is in this room: curated blocks and the room's own
   * CMS talks, the talks that sit inside an activation folded into it, and
   * Access Granted's village at the foot of its afternoon. The page used to
   * read the curated list and the CMS talks separately and draw them in two
   * shapes — cards and rows — which is what made a day read as two lists.
   */
  const rows = await safeList(listSessions());
  const week = weekCalendar(standaloneItems(rows), activationSearchText(rows));
  const blurbs = new Map(allSessions().map((s) => [s.slug, s.blurb ?? ""]));
  const localDay = (ms: number) =>
    new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const minuteOf = (ms: number) => {
    const [h, m] = new Date(ms)
      .toLocaleTimeString("en-GB", {
        timeZone: "America/Chicago",
        hour: "2-digit",
        minute: "2-digit",
      })
      .split(":")
      .map(Number);
    return h * 60 + m;
  };
  // Speakers first, a moderator last and marked — the person chairing is not
  // one of the people the session is about.
  const peopleOf = (r: SessionRow) => {
    const on = r.participants.filter((p) => p.role !== "moderator" && p.name);
    const mod = r.participants.filter((p) => p.role === "moderator" && p.name);
    return (
      [
        on.map((p) => p.name).join(", "),
        mod.length ? `Moderated by ${mod.map((p) => p.name).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" · ") || undefined
    );
  };

  const byDay = new Map<string, AgendaEntry[]>();
  for (const item of week.items) {
    if (item.venueSlug !== room.slug) continue;
    const slug = item.href?.split("/").pop() ?? item.slug;
    let entry: AgendaEntry;
    if (item.href?.startsWith("/schedule/talk/")) {
      const row = rows.find((r) => r.slug === slug);
      entry = {
        kind: "talk",
        key: item.slug,
        startMin: item.startMin,
        title: item.longTitle || item.title,
        href: item.href,
        people: row ? peopleOf(row) : item.people,
        circuit: item.circuit || undefined,
      };
    } else {
      const talks = rows
        .filter(
          (r) =>
            r.activation === slug &&
            r.location === room.slug &&
            r.startsAt &&
            localDay(r.startsAt) === item.dayIso,
        )
        .sort((x, y) => x.startsAt - y.startsAt)
        .map((r) => ({
          key: r.id,
          startMin: minuteOf(r.startsAt),
          title: r.title,
          href: `/schedule/talk/${r.slug}`,
          people: peopleOf(r),
        }));
      entry = {
        kind: "block",
        key: `${item.slug}-${item.dayIso}`,
        startMin: item.startMin,
        timeLabel: item.timeLabel,
        title: item.longTitle || item.title,
        href: item.href,
        brand: item.brand,
        blurb: blurbs.get(item.slug) || undefined,
        circuit: item.circuit || undefined,
        talks,
        continuous:
          slug === "access-granted"
            ? ACCESS_CONTINUOUS.items.map((c) => ({ name: c.name, by: c.by }))
            : [],
      };
    }
    const list = byDay.get(item.dayIso) ?? [];
    list.push(entry);
    byDay.set(item.dayIso, list);
  }

  const agendaDays: AgendaDay[] = EVENT_DAYS.flatMap((d) => {
    const entries = byDay.get(d.iso);
    const meta = dayMeta(d.iso);
    if (!entries || !meta) return [];
    return [
      {
        ...meta,
        entries: entries.sort((x, y) => (x.startMin ?? 0) - (y.startMin ?? 0)),
      },
    ];
  });

  // A span runs across days rather than on one — the Give-a-LOT drop-off —
  // and an undated activation has no day yet. Both stay in the list, headed
  // for what they are, rather than being filed under a day they are not on.
  const spanDays: AgendaDay[] = week.spans
    .filter((sp) => sp.venueSlug === room.slug)
    .map((sp) => ({
      iso: `span-${sp.slug}`,
      weekday: "All week",
      label: sp.dayLabel,
      entries: [
        {
          kind: "block" as const,
          key: sp.slug,
          // Blank, because the heading already says "All week" and the dates;
          // in the time column the range wrapped onto two lines to say it again.
          timeLabel: "",
          title: sp.title,
          href: sp.page ? `/schedule/${sp.page}` : null,
          brand: sp.brand,
          blurb: blurbs.get(sp.slug) || undefined,
          circuit: sp.circuit || undefined,
          talks: [],
          continuous: [],
        },
      ],
    }));
  const undated = sessions.filter((s) => !sessionDay(s) && !s.span);
  const undatedDay: AgendaDay[] = undated.length
    ? [
        {
          iso: "undated",
          weekday: "To be confirmed",
          label: "Slot to come",
          entries: undated.map((s) => ({
            kind: "block" as const,
            key: s.slug,
            timeLabel: "TBC",
            title: s.title,
            href: s.page ? `/schedule/${s.page}` : null,
            blurb: s.blurb,
            circuit: s.circuit,
            talks: [],
            continuous: [],
          })),
        },
      ]
    : [];

  return (
    <main>
      {/* The venue as a Place. `place()` has always built this node for an
          event's `location`; these six pages are where the venue is the
          subject rather than a field, and they published nothing. The address
          and the coordinates were in lib/locations the whole time and simply
          never reached a crawler from here. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            venuePlace({
              name: room.name,
              slug: room.slug,
              desc: room.desc,
              place: room.place,
            }),
          ),
        }}
      />
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
              {/* The street, and the floor where the room has one.

                  This said "Sept 28 – Oct 2 · San Antonio" for every venue,
                  which is two facts a reader of a San Antonio schedule
                  already has. A venue's own page is the last surface before
                  someone sets off, and it was the one place on the site that
                  named a room without saying how to reach it — the organisers
                  reported people arriving at 110 E Houston and finding a
                  lobby.

                  Falls back to the city where there is no address to print.
                  Trinity is the case: it is a campus rather than a door, and
                  the activation there carries its own directions. */}
              <p className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-widest text-white/55">
                Sept 28 – Oct 2 ·{" "}
                {room.place?.address
                  ? [room.place.address, room.place.floor]
                      .filter(Boolean)
                      .join(", ")
                  : "San Antonio"}
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

          {/* Grouped by day, one running order per day. See VenueAgenda
              for why a day is a single list now rather than cards over rows. */}
          <VenueAgenda days={[...spanDays, ...agendaDays, ...undatedDay]} />
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
