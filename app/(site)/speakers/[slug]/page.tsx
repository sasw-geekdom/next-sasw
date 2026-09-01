import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BackLink } from "@/components/site/back-link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { LinkedInMark } from "@/components/site/linkedin-mark";
import { SpeakerCard } from "@/components/site/speaker-card";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { ARROW_MOTION } from "@/lib/motion";
import { loadLineup, resolveSlug } from "@/lib/speakers";
import { cn } from "@/lib/utils";
import { venueLabel } from "@/lib/locations";
import { activationTitle } from "@/lib/schedule";

export const revalidate = 300;

// How many other speakers to show at the foot of the page.
const MORE = 4;

// Roughly where a bio stops fitting the capped column and starts scrolling.
// Only bios past this get the fade that signals there is more to read — a
// shorter one never overflows, so hinting at a scroll would be a lie and the
// padding the hint needs would be dead space. Counted in characters because
// that is all the server has; it only has to be about right.
const LONG_BIO = 800;

// The shared door-link motion at this page's size — 14px to sit with the
// 11px mono labels, where the homepage's door links run 20–24px.
const ARROW = cn(ARROW_MOTION, "h-3.5 w-3.5");

// Every arrow that leads somewhere else is the site's diagonal ArrowUpRight,
// and jumps the way it points. A step on each axis rather than two keeps the
// diagonal's total travel level with the back arrow's horizontal one.
const ARROW_OUT = cn(
  ARROW,
  "group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-magenta",
  "group-focus-visible:-translate-y-px group-focus-visible:translate-x-px group-focus-visible:text-magenta",
);

// Prerendered at build time. `dynamicParams` stays at its default, so a
// speaker added between deploys renders on demand the first time their page
// is hit and is cached from there — no rebuild needed to publish someone.
export async function generateStaticParams() {
  const lineup = await loadLineup();
  return lineup.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hit = resolveSlug(await loadLineup(), slug);
  if (!hit) return { title: "Speaker not found" };

  const { speaker } = hit;
  const role = [speaker.title, speaker.company].filter(Boolean).join(" · ");
  const description = role
    ? `${role} — speaking at San Antonio Startup + Tech Week, Sept 28 – Oct 2.`
    : `Speaking at San Antonio Startup + Tech Week, Sept 28 – Oct 2.`;

  return {
    title: speaker.name,
    description,
    // Always the canonical slug, so a redirected old URL doesn't get indexed.
    alternates: { canonical: `/speakers/${speaker.slug}` },
    openGraph: {
      title: `${speaker.name} · SASTW 2026`,
      description,
      url: `/speakers/${speaker.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${speaker.name} · SASTW 2026`,
      description,
    },
  };
}

export default async function SpeakerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lineup = await loadLineup();
  const hit = resolveSlug(lineup, slug);

  if (!hit) notFound();
  // Matched a retired slug — send the shared link to the current URL rather
  // than serving the same person at two addresses.
  if (!hit.canonical) permanentRedirect(`/speakers/${hit.speaker.slug}`);

  const { speaker } = hit;
  const role = [speaker.title, speaker.company].filter(Boolean).join(" · ");
  const more = lineup.filter((s) => s.id !== speaker.id).slice(0, MORE);

  return (
    <main className="bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:py-20">
        {/* The label lifts a step in brightness; the arrow is the only thing
            that takes colour. Charge lands on the moving part, not the whole
            control — the page has one loud element and it's the portrait. */}
        {/* BackLink, not a plain Link to /speakers. A forward navigation
            pushes a new history entry, so the wall reopens at the top — which
            for anyone who clicked a face from halfway down the grid means
            losing their place and scrolling back through everyone. Going back
            through the router lets the browser restore the scroll position it
            already holds against that entry. Falls back to the href for
            someone who arrived from a shared link with no in-app history
            behind them. The schedule slug pages have used this since they
            were built; this one was missed. */}
        <BackLink
          href="/speakers"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:outline-none focus-visible:text-white/70"
        >
          <ArrowLeft
            className={cn(
              ARROW,
              "group-hover:-translate-x-0.5 group-hover:text-magenta group-focus-visible:-translate-x-0.5 group-focus-visible:text-magenta",
            )}
            strokeWidth={2}
            aria-hidden="true"
          />
          {/* Generic. See `BackLink` — naming a destination on a control that
              goes back is only true when the two coincide, and a speaker is
              now reachable from a talk page as well as from the wall. */}
          Back
        </BackLink>

        <article className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          {/* Grayscale here too, not just on the wall — a portrait that stays
              neutral everywhere means headshots shot under wildly different
              light never announce the difference. No magenta bloom behind it
              either: the portrait sits straight on the page, so the only
              colour on this screen is the eyebrow and the LinkedIn hover. */}
          <div className="relative mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none">
            <div className="relative aspect-4/5 overflow-hidden rounded-lg ring-1 ring-white/10">
              {speaker.imageUrl ? (
                <Image
                  src={speaker.imageUrl}
                  alt=""
                  fill
                  priority
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
          </div>

          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              The lineup
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              {speaker.name}
            </h1>

            {role && (
              <p className="mt-3.5 font-mono text-xs uppercase tracking-widest text-white/50">
                {role}
              </p>
            )}

            {speaker.circuits.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {speaker.circuits.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-magenta/35 bg-magenta/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* A bio is whatever the CMS holds, and they run from two lines to
                a dozen paragraphs. Past a certain length the text column ran
                far below the portrait and pushed the LinkedIn link off screen,
                so the column is capped and scrolls inside itself.

                `lg:` only. The cap earns its keep in the two-column layout,
                where the imbalance shows; on a phone the page is already one
                column that scrolls as a whole, and a nested scroll box there is
                something readers have to fight past rather than a convenience.

                A capped bio that simply stops mid-sentence reads as a bug, so
                a long one also gets a fade at the cut. It is gated on length
                rather than applied to every bio: the fade needs bottom padding
                to sit over (otherwise it dims the closing line once you scroll
                to the end), and spending that padding on a bio that already
                fits would be 40px of dead space hinting at a scroll that is not
                there. */}
            {speaker.bio && (
              <div
                // A scrollable region needs a focus stop, or a keyboard user
                // can tab to the LinkedIn link below but never scroll the bio
                // to read it. The label gives that stop a name in the a11y tree.
                tabIndex={0}
                role="region"
                aria-label={`About ${speaker.name}`}
                className={cn(
                  "mt-7 max-w-2xl lg:max-h-[min(24rem,50vh)] lg:overflow-y-auto lg:pr-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta",
                  speaker.bio.length > LONG_BIO &&
                    "lg:pb-10 lg:[mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]",
                )}
              >
                <p className="whitespace-pre-line text-pretty text-lg leading-relaxed text-white/70">
                  {speaker.bio}
                </p>
              </div>
            )}

            {speaker.linkedin && (
              <a
                href={speaker.linkedin}
                target="_blank"
                rel="noreferrer"
                className="group mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-white/70 transition-colors duration-300 hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
              >
                <LinkedInMark className="h-3.5 w-3.5" />
                LinkedIn
                <ArrowUpRight
                  className={ARROW_OUT}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </a>
            )}

            {speaker.sessions.length > 0 && (
              <div className="mt-12 border-t border-white/10 pt-8">
                <h2 className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                  On the schedule
                </h2>
                <ul className="mt-4 flex flex-col gap-4">
                  {speaker.sessions.map((s) => (
                    <li key={s.id} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-xs bg-magenta/70"
                      />
                      <div className="min-w-0">
                        {/* A talk that stands on its own has a page now, and
                            this list was the last place still printing its
                            title as dead text. One inside an activation keeps
                            its title plain and takes the "Part of" link below
                            — that page is its home, and linking the title
                            there would name the activation as the talk. */}
                        {s.activation === null ? (
                          <Link
                            href={`/schedule/talk/${s.slug}`}
                            className="group font-display text-lg font-bold uppercase leading-tight text-white transition-colors duration-200 hover:text-magenta focus-visible:text-magenta focus-visible:outline-none"
                          >
                            {s.title}
                            <ArrowUpRight
                              className={cn(ARROW_OUT, "ml-1 inline-block")}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </Link>
                        ) : (
                          <p className="font-display text-lg font-bold uppercase leading-tight text-white">
                            {s.title}
                          </p>
                        )}
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-white/55">
                          {formatDateTime(s.startsAt)}
                          {venueLabel(s.location)
                            ? ` \u00b7 ${venueLabel(s.location)}`
                            : ""}
                        </p>
                        {/* Where the talk sits in the week. Only rendered when
                            the activation still resolves — a slug left behind
                            by a renamed page should go quiet, not print a
                            dead link. */}
                        {activationTitle(s.activation) && (
                          <Link
                            href={`/schedule/${s.activation}`}
                            className="mt-2 inline-block font-mono text-[11px] uppercase tracking-widest text-magenta transition-colors duration-200 hover:text-white"
                          >
                            Part of {activationTitle(s.activation)}
                            <span aria-hidden="true"> &rarr;</span>
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>

        {more.length > 0 && (
          <div className="mt-24 border-t border-white/10 pt-14 lg:mt-32 lg:pt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-bold uppercase leading-none tracking-tight text-white sm:text-3xl">
                Also on the grid.
              </h2>
              <Link
                href="/speakers"
                className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 hover:text-white/70 focus-visible:outline-none focus-visible:text-white/70"
              >
                See everyone
                <ArrowUpRight
                  className={ARROW_OUT}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
              {more.map((s) => (
                <SpeakerCard
                  key={s.id}
                  speaker={s}
                  circuits={s.circuits}
                  sizes="(min-width: 640px) 22vw, 45vw"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-20 border-t border-white/10 pt-14 text-center lg:mt-28 lg:pt-16">
          <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
            Think you belong up there?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
            Pitch a session — five circuits, one current.
          </p>
          <div className="mt-7 flex justify-center">
            <ButtonLink href="/plug-in" size="lg">
              Plug in
            </ButtonLink>
          </div>
        </div>
      </div>
    </main>
  );
}
