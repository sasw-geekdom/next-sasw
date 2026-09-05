import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { BackLink } from "@/components/site/back-link";
import { ARROW_MOTION } from "@/lib/motion";
import { ASSUMED_MINUTES, dayKey, eventIso, sessionWhen } from "@/lib/schedule";
import { jsonLd, talkEvent } from "@/lib/structured-data";
import type { ResolvedParticipant } from "@/lib/admin/cms-types";
import { listTalks, resolveTalk, type Talk } from "@/lib/talks";
import { listSponsors } from "@/lib/admin/cms-queries";
import { circuitSponsor } from "@/lib/circuit-sponsors";
import { CircuitSponsorLine } from "@/components/site/circuit-sponsor-line";
import { cn } from "@/lib/utils";

export const revalidate = 300;

// `dynamicParams` stays at its default, and that is load-bearing rather than
// an omission. Every other route under /schedule sets it false, which is right
// for activations — a fixed set, known at build time. These are CMS rows: an
// organiser adding a talk on the Tuesday it happens would get a 404 on their
// own page, which is the whole failure this route exists to fix. Prerendered
// where they are known, rendered on demand and cached where they are not.

const ARROW = cn(ARROW_MOTION, "h-3.5 w-3.5");
const ARROW_OUT = cn(
  ARROW,
  "group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-magenta",
  "group-focus-visible:-translate-y-px group-focus-visible:translate-x-px group-focus-visible:text-magenta",
);

export async function generateStaticParams() {
  return (await listTalks()).map((t) => ({ slug: t.row.slug }));
}

/** "Ana Reyes", "Ana Reyes and Dee Okafor", "Ana Reyes, Dee Okafor and …". */
function nameList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function speakerNames(talk: Talk): string[] {
  return talk.row.participants.map((p) => p.name).filter(Boolean);
}

function summary(talk: Talk): string {
  const who = nameList(speakerNames(talk));
  const where = talk.room?.name;
  return [
    who && `With ${who}.`,
    where && `${where}, San Antonio Startup + Tech Week.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hit = await resolveTalk(slug);
  if (!hit) return { title: "Talk not found" };
  const talk = hit.talk;

  // The organiser's own description leads, cut to a length a result page will
  // actually print; the speaker-and-room line is the fallback rather than a
  // prefix, so the snippet isn't two sentences of boilerplate before the
  // subject.
  const description =
    talk.row.description.slice(0, 200) || summary(talk) || talk.row.title;

  return {
    title: talk.row.title,
    description,
    alternates: { canonical: `/schedule/talk/${talk.row.slug}` },
    openGraph: {
      title: `${talk.row.title} · SASTW 2026`,
      description,
      url: `/schedule/talk/${talk.row.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${talk.row.title} · SASTW 2026`,
      description,
    },
  };
}

export default async function TalkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hit = await resolveTalk(slug);
  if (!hit) notFound();
  // Matched a retired slug — send the shared link to the current URL rather
  // than serving the same talk at two addresses.
  if (!hit.canonical) permanentRedirect(`/schedule/talk/${hit.talk.row.slug}`);
  const talk = hit.talk;

  const { row, room } = talk;
  const speakers = row.participants.filter((p) => p.name);
  // A talk carries a track where an activation carries a circuit; they are the
  // same five names, so the same sponsor answers for both. This is the only
  // surface the Founder circuit appears on — no activation carries it.
  const sponsor = circuitSponsor(
    row.track,
    await listSponsors().catch(() => []),
  );
  const day = dayKey(new Date(row.startsAt).toISOString());

  // The same markup an activation page carries, which this had no equivalent
  // of — so a talk with a named speaker, a room and a confirmed half hour was
  // the one event on the site describing itself to nobody.
  //
  // `endsAt` is nullable in the CMS and the grid assumes an hour for a row
  // without one. The markup assumes the same, rather than omitting `endDate`:
  // an Event needs both to be eligible, and the two would otherwise disagree
  // about the same session.
  const endsAt = row.endsAt ?? row.startsAt + ASSUMED_MINUTES * 60_000;
  const event = talkEvent({
    slug: row.slug,
    title: row.title,
    description: row.description,
    // -05:00, matching how the curated week is authored — see `eventIso`. A
    // row stores an instant and loses the offset it was entered in, but the
    // whole week is CDT, so rendering it back is a fact rather than a guess.
    startIso: eventIso(row.startsAt),
    endIso: eventIso(endsAt),
    room,
    people: speakers.map((p) => ({ name: p.name, slug: p.slug })),
  });

  return (
    // The speakers' shell, not a prose column. A talk page is the same shape
    // of thing as a speaker page — one subject, one portrait, one block of
    // copy the CMS wrote — so it takes the same black ground, the same
    // `max-w-7xl` gutter and the same two-column split. Built as a centred
    // `max-w-3xl` first, it read as a blog post and ran 1,542px on a 1,000px
    // screen; the two columns halve that and put it back inside the system
    // every other slug page on the site already uses.
    <main className="bg-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(event) }}
      />
      {/* It was one screen: `lg:h-[calc(100vh-4rem)]`, with the description
          capped inside it, scrolling in its own box under a mask fade once it
          passed ~520 characters.
          
          The reasoning was that a description is whatever an organiser typed,
          so the copy column should absorb the slack rather than the page. But
          absorbing it meant clipping it — the BDO Alliance launch runs to
          ~580 characters and arrived with its last two sentences behind a
          fade, in a box a reader has to notice is scrollable before they can
          finish reading the one thing the page exists to show.
          
          The repo has already settled this argument elsewhere, in the
          agenda's own note: "nested scroll areas trap the wheel, double the
          scrollbars, and break the browser's own find-on-page." A page that
          scrolls is not a design failure; a paragraph that cannot be read
          without discovering a hidden scroller is. So the page scrolls, and
          the links below the copy go under the fold on a long one — which is
          the right thing to lose, since they are onward navigation and the
          description is the content. */}
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:py-12">
        <BackLink
          // Only the fallback — BackLink prefers router.back(). The anchor is
          // for someone arriving on a shared link with no week behind them:
          // /schedule opens ~990px above its own grid, and this is a talk, so
          // the grid is what they came for.
          href="/schedule#the-week"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
        >
          <ArrowLeft
            className={cn(
              ARROW,
              "group-hover:-translate-x-0.5 group-hover:text-magenta group-focus-visible:-translate-x-0.5 group-focus-visible:text-magenta",
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
          {/* Generic, which is `BackLink`'s own documented rule: it goes back,
              so any label naming a destination is only true when that is where
              you came from. This said "The schedule" and returned you to a
              speaker's page. The same bug was found and fixed once already on
              the activation pages, which say this. */}
          Back
        </BackLink>

        {/* Two columns only when there is a portrait to put in one.
            
            The template was drawn for a talk with a speaker, and the grid
            named its tracks unconditionally — so a session the admin entered
            without participants had one child in a two-track grid, and CSS
            put it in the first: the copy column became `minmax(0, 22rem)`,
            352px wide, with the whole right half of the page empty beside it.
            That is the "text is stuck" — a title, a description and a link
            list all wrapping inside a third of the measure. The BDO Alliance
            launch is the first session to arrive this way and it will not be
            the last; a CMS row is not required to have a speaker.
            
            With no portrait the copy takes the width and caps at a reading
            measure of its own, rather than running the full 1,280px. */}
        <article
          className={cn(
            "mt-8 grid gap-10 lg:gap-16",
            speakers.length > 0 && "lg:grid-cols-[minmax(0,22rem)_1fr]",
          )}
        >
          {/* Who is on, at the size the lineup draws them — grayscale for the
              same reason it is grayscale there: headshots shot under wildly
              different light stop announcing the difference.

              One speaker gets the portrait. Two or more share the column as
              squares, because a fireside with two names stacked at 4:5 would
              run past the copy beside it and put the page back into a
              scroll. */}
          {speakers.length > 0 && (
            <div className="mx-auto w-full max-w-xs self-start lg:mx-0 lg:max-w-none">
              <div
                className={cn(
                  "grid gap-3",
                  speakers.length > 1 && "grid-cols-2",
                )}
              >
                {speakers.map((p) => (
                  <SpeakerFace
                    key={`${p.speakerId}-${p.role}`}
                    speaker={p}
                    solo={speakers.length === 1}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            className={cn(
              "min-w-0",
              // Alone in the row, the copy needs a measure of its own — see
              // the note on the article.
              speakers.length === 0 && "lg:max-w-4xl",
            )}
          >
            {/* Circuit and room, in the eyebrow slot. Circuits carry no colour
                of their own, so this is the magenta the eyebrow already owns
                rather than anything track-specific. */}
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              {[row.track, room?.name].filter(Boolean).join(" \u00b7 ") ||
                "On the schedule"}
            </p>

            {/* A step down from the speakers' 6xl. A name is two words and a
                talk title is fifteen — at that size "Building Nopalera on Her
                Own Terms: A Founder Fireside Chat with Sandra Velasquez" is
                five lines and the fold is gone before the copy starts. */}
            <h1 className="mt-3 text-pretty font-display text-3xl font-bold uppercase leading-[1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {row.title}
            </h1>

            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-widest text-white/50">
              <div className="flex items-center gap-2">
                <dt className="sr-only">When</dt>
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {/* The whole slot, in the week's timezone — see
                    `sessionWhen`. This printed a bare start formatted in the
                    server's zone, so a session the grid called "3:30 – 5 PM"
                    read "Sep 29, 3:30 PM" here and, in production, five hours
                    later than that. */}
                <dd>{sessionWhen(row.startsAt, row.endsAt)}</dd>
              </div>
              {room && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Where</dt>
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  <dd>
                    <Link
                      href={`/schedule/${room.slug}`}
                      className="underline-offset-4 transition-colors duration-300 hover:text-white focus-visible:text-white focus-visible:outline-none"
                    >
                      {room.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>

            {/* Capped and scrolled inside itself on `lg`, exactly as the
                speakers' bio is, and for the same reason: a description is
                whatever an organiser typed, and a long one pushed the links
                below it off the screen. Below `lg` the page is one column
                that scrolls as a whole, where a nested scroll box is
                something to fight past rather than a convenience. */}
            {/* No scroller, no mask, no focus stop to give a scroller a
                keyboard route — all three existed to serve the viewport cap
                that is gone. It is a paragraph. */}
            {row.description && (
              <p className="mt-7 max-w-2xl whitespace-pre-line text-pretty text-lg leading-relaxed text-white/70">
                {row.description}
              </p>
            )}

            {/* At the foot, with the other credits, rather than under the
                title. Two reasons, and the second is the stronger one.

                Consistency: the activation pages put this line below their
                actions, and the same credit sitting under an H1 on one page
                and under a button on another reads as two different things.

                And the collision. The one standalone talk on a sponsored
                circuit is "Building Nopalera on Her Own Terms" — Founder
                circuit, sponsored by Nopalera — so under the title the word
                appeared twice, three lines apart, once as the subject and
                once as the sponsor. That scans as a duplication bug rather
                than as two facts, which is the same trap `.tag` on the TPR
                cards was moved to avoid. Distance doesn't make the two
                mentions untrue; it stops them reading as one mistake. */}
            {sponsor && (
              <CircuitSponsorLine sponsor={sponsor} className="mt-10" />
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={`/schedule/day/${day}`}
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors duration-300 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
              >
                The rest of the day
                <ArrowUpRight
                  className={ARROW_OUT}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
              {room && (
                <Link
                  href={`/schedule/${room.slug}`}
                  className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white focus-visible:text-white focus-visible:outline-none"
                >
                  Everything at {room.shortName ?? room.name}
                  <ArrowUpRight
                    className={ARROW_OUT}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

/**
 * One speaker in the left column: portrait, name, role, and a link to their
 * page where the id still resolves — see `slug` on ResolvedParticipant. An
 * unresolved participant still gets drawn, just not as a dead link.
 */
function SpeakerFace({
  speaker,
  solo,
}: {
  speaker: ResolvedParticipant;
  solo: boolean;
}) {
  const face = (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg ring-1 ring-white/10",
          solo ? "aspect-4/5" : "aspect-square",
          // A 22rem column at 4:5 is 27.5rem tall, which fits the viewport box
          // on a normal laptop and not on a short one. Capped against the
          // viewport as well, so a 13" screen shrinks the portrait rather
          // than pushing the name and role out of the box under it.
          solo && "lg:aspect-auto lg:h-[min(27.5rem,calc(100vh-19rem))]",
        )}
      >
        {speaker.imageUrl ? (
          <Image
            src={speaker.imageUrl}
            alt=""
            fill
            priority={solo}
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 80vw"
            className="object-cover object-top grayscale"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center font-display text-6xl font-bold uppercase text-white/25"
          >
            {speaker.name.charAt(0)}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-lg font-bold uppercase leading-tight text-white">
        {speaker.name}
      </p>
      {speaker.role && (
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-white/50">
          {speaker.role}
        </p>
      )}
    </>
  );

  if (!speaker.slug) return <div>{face}</div>;
  return (
    <Link
      href={`/speakers/${speaker.slug}`}
      className="group block focus-visible:outline-none"
    >
      {face}
    </Link>
  );
}
