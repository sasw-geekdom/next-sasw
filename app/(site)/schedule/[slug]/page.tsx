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
import { ARROW_MOTION } from "@/lib/motion";
import { listPartners } from "@/lib/admin/cms-queries";
import {
  resolveSchedule,
  scheduleSlugs,
  venueRedirect,
  whenLabels,
  type ResolvedSession,
} from "@/lib/schedule";
import { PYSA } from "@/lib/pysa";
import { BackLink } from "@/components/site/back-link";
import { activationEvent, jsonLd } from "@/lib/structured-data";
import { AccessGrantedBand } from "@/components/site/access-granted-band";
import { PysaBand } from "@/components/site/pysa-band";
import { AddToCalendar } from "@/components/site/add-to-calendar";
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
            if (!w) {
              return `${schedule.session.blurb} At ${schedule.session.venue.name} during San Antonio Startup + Tech Week, Sept 28 – Oct 2, 2026.`;
            }
            const { date, time } = whenLabels(w);
            return `${schedule.session.blurb} ${date}, ${time} at ${schedule.session.venue.name} — part of San Antonio Startup + Tech Week.`;
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
 * An activation's own page.
 *
 * PySanAntonio gets the band as its masthead — it already carries the
 * wordmark, the mascot and PySA's blue, so arriving confirms you clicked the
 * right thing, and it renders without its CTA here since that button is what
 * brought you. Every other activation borrows its venue's portrait instead:
 * the same portrait-and-panel grammar as room-flow and the venue pages, using
 * art that already exists rather than leaving these pages type-only.
 *
 * These pages are honest about being thin. Only PySA has a date and a running
 * order; the rest carry a title, a circuit and a blurb. What saves them is
 * that they're partner-run events with their own sites — this page says where
 * the thing sits in the week and sends you to the organiser for the depth.
 */
function ActivationPage({ session }: { session: ResolvedSession }) {
  const isPysa = session.page === "pysanantonio";
  const isAccessGranted = session.page === "access-granted";
  /** Both banded activations render the same actions in their band's slot. */
  const banded = isPysa || isAccessGranted;
  /**
   * "Everything else at X" has to actually be true.
   *
   * Legacy Park and 300 Main host exactly one activation each, so on those
   * pages the link promises a room's week and delivers the page you are
   * already standing on. Read off the room rather than hardcoded, so it
   * returns by itself the moment a second session lands there.
   */
  const hasMoreAtVenue = session.venue.sessions.length > 1;
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
        <div className="mx-auto w-full max-w-7xl px-6 pt-8 lg:pt-10">
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
          const actions = session.when && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/register" size="lg">
                  Get on the list.
                </ButtonLink>
                <AddToCalendar
                  icsHref={`/schedule/${session.page}/calendar`}
                  event={{
                    title: session.title,
                    details: `${session.blurb} Part of San Antonio Startup + Tech Week.`,
                    location: `${session.venue.name}, Downtown San Antonio`,
                    start: session.when.start,
                    end: session.when.end,
                  }}
                />
              </div>
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
          return isPysa ? (
            <PysaBand masthead actions={actions} />
          ) : (
            <AccessGrantedBand masthead actions={actions} />
          );
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
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-black">
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
                  // No `priority`, despite Next logging this as the LCP and
                  // asking for eager loading. `priority` emits a preload link,
                  // and a preload ignores the `hidden lg:block` wrapper — a
                  // 390px phone then downloads 217KB of a photograph it never
                  // renders. Measured both ways: without it, phones and
                  // tablets don't request the file at all. A slightly later
                  // LCP on desktop is the cheaper side of that trade.
                  // The wider the screen, the more `cover` has to crop off the
                  // vertical — 470px of a 1200px frame on a 2560px monitor.
                  // Centred, that takes half off the top, which on this
                  // photograph is where the faces are. Anchoring high spends
                  // the crop on the carpet instead.
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
                className="pointer-events-none absolute inset-0 hidden bg-linear-to-b from-black via-transparent to-black lg:block"
              />
            </>
          )}

          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-10 lg:pb-24 lg:pt-14">
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
                    className={cn(
                      "mt-6 h-auto w-full",
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
                  />
                </>
              ) : (
                <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl xl:text-7xl">
                  {session.title}
                </h1>
              )}
              <p className="mt-6 max-w-xl text-pretty text-lg text-white/60">
                {session.blurb}
              </p>
              {/* A locked slot belongs in the hero, not filed under a
                  "running order" heading further down — once the date, the
                  hour and the room are all fixed, that IS the headline detail
                  and the page can go straight to the two things a reader
                  wants to do with it. */}
              {session.when ? (
                <>
                  <dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
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
                      <dd>{session.venue.name}</dd>
                    </div>
                  </dl>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <ButtonLink href="/register" size="lg">
                      Get on the list.
                    </ButtonLink>
                    <AddToCalendar
                      icsHref={`/schedule/${session.page}/calendar`}
                      event={{
                        title: session.title,
                        details: `${session.blurb} Part of San Antonio Startup + Tech Week.`,
                        location: `${session.venue.name}, Downtown San Antonio`,
                        start: session.when.start,
                        end: session.when.end,
                      }}
                    />
                  </div>

                  {/* The organiser and the room, kept in the hero rather than
                      given a section of their own — with the slot locked
                      there's nothing else to say, and a whole band under this
                      one to hold two links was padding. */}
                  <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
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
                  Sept 28 – Oct 2 · Downtown San Antonio
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Only while the slot is open. A confirmed session is hero and nothing
          else — the date, the room, the two actions and the two links all fit
          above the fold, and a second band under it would be filler. */}
      {!session.when && (
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
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
          primary action per page, not the same one twice. */}
      {!session.when && (
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
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
  if (!schedule) notFound();

  if (schedule.kind === "activation") {
    return <ActivationPage session={schedule.session} />;
  }

  // A room with one activation sends people to that activation instead of
  // rendering a venue page restating it. 308 rather than 307, so search
  // engines move the ranking across rather than holding both.
  const to = venueRedirect(slug);
  if (to) permanentRedirect(to);

  const { room, sessions } = schedule;
  const partners = await safeList(listPartners());

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
                Sept 28 – Oct 2 · Downtown San Antonio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
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

          <div className="mt-12 lg:mt-14">
            <SessionBento sessions={cards} />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
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
