import type { Metadata } from "next";
import { SessionsHero } from "@/components/site/schedule-hero";
import { WeekCalendar } from "@/components/site/week-calendar";
import { AccessGrantedBand } from "@/components/site/access-granted-band";
import { ModelBand } from "@/components/site/model-band";
import { PysaBand } from "@/components/site/pysa-band";
import { ButtonLink } from "@/components/ui/button";
import { allSessions, resolveSessions } from "@/lib/schedule";
import { ASSUMED_MINUTES, eventIso } from "@/lib/schedule";
import { jsonLd, scheduleGraph } from "@/lib/structured-data";
import { listTalks } from "@/lib/talks";

// ISR, and still needed after the bento went: `ModelBand` reads the partner
// wall from Firestore for its own organiser logos, so this page has a CMS
// dependency even though nothing in it fetches directly any more.
//
// The bento was why this comment used to say "partner logos" — it resolved
// `logoFromPartner` here so a card's borrowed lockup tracked whatever the
// admin uploaded. That resolution still exists on the venue pages, which are
// where SessionBento now lives.
export const revalidate = 300;

const DESCRIPTION =
  "The full schedule for San Antonio Startup + Tech Week lands closer to the week. These activations are confirmed — Sept 28 – Oct 2.";

export const metadata: Metadata = {
  title: "Schedule",
  description: DESCRIPTION,
  alternates: { canonical: "/schedule" },
  openGraph: {
    title: "Schedule · SASTW 2026",
    description: DESCRIPTION,
    url: "/schedule",
  },
  twitter: {
    card: "summary_large_image",
    title: "Schedule · SASTW 2026",
    description: DESCRIPTION,
  },
};

export default async function SessionsPage() {
  // The talks the grid draws alongside the activations. Same fallback for a
  // row with no end that the grid and the .ics use, so the three cannot
  // disagree about how long the same session runs.
  const talks = (await listTalks()).map((t) => ({
    slug: t.row.slug,
    title: t.row.title,
    description: t.row.description,
    startIso: eventIso(t.row.startsAt),
    endIso: eventIso(t.row.endsAt ?? t.row.startsAt + ASSUMED_MINUTES * 60_000),
    room: t.room,
    people: t.row.participants.map((p) => ({ name: p.name, slug: p.slug })),
  }));

  return (
    <>
      {/* The week, every confirmed activation and every standalone talk, as one
          ItemList. This page had no structured data of any kind — the homepage
          described the week and each activation described itself, and the one
          page that *is* the schedule described none of it. Talks were the last
          thing it drew and did not describe. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(scheduleGraph(resolveSessions(allSessions()), talks)),
        }}
      />
      <main>
        <SessionsHero />

        {/* The week on an hour axis, above the deep dives — the page's answer to
          "what's on Tuesday, and what am I giving up to be there?"

          It replaces week-strip.tsx, which answered the first half of that and
          not the second: five lists cannot show that four venues run a
          takeover across the same afternoon, which is the shape of this week.
          The strip is still in the tree and still works; it is the smaller
          idea and nothing renders it now. */}
        <WeekCalendar />

        <PysaBand detailHref="/schedule/pysanantonio" />

        {/* The second and third banded activations. They used to sit below a
          bento of the other six, and the reason they were never *in* it still
          holds for the calendar above: a full-day takeover with its own brand
          reduced to one cell reads as smaller than it is. The difference is
          that the calendar has to carry them anyway — a week with a hole where
          PySanAntonio runs is not a week — so they now appear twice on this
          page by design, once as a block on Friday afternoon and once at
          length down here.

          PySanAntonio keeps the top of the stack — it's HEADLINE_SESSION, the
          one the week leads with — and the other two run by date beneath it:
          The Model on the 28th, Access Granted on the 30th.

          Headline first, then chronological. Worth stating as a rule because
          the previous arrangement had no rule at all — it was "the order they
          landed", which happened to come out reverse-chronological, and which
          therefore ran these same three activations in the opposite direction
          from /schedule/the-rand, where all three are hosted and where they are
          sorted by start time. Two pages, one click apart, disagreeing about
          the order of the same week. Adding a fourth band? Date, unless it
          becomes the headline. */}
        <ModelBand detailHref="/schedule/the-model" />

        <AccessGrantedBand detailHref="/schedule/access-granted" />

        {/*
        The way onto the schedule, as its own band rather than a tail on the
        section above — the same move the homepage's sponsor ask needed. Tucked inside
        that container it was centred on a page that is left-aligned
        everywhere else, and small enough to scan as footer furniture.

        One button, not two. It previously offered "Get involved" beside
        "Register", which is the section failing to decide what it wants:
        Register already appears in the navbar, the footer and the hero, so
        the second button spent the section's one decision on a link the
        reader has passed three times. It also had to hand-override the
        `outline` variant, whose text is `foreground` — black, invisible here.
      */}
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                Hosting is open · Sept 28 – Oct 2
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
                Want a slot on it?
              </h2>
              <p className="mt-4 max-w-xl text-pretty text-white/60">
                Host an activation, sponsor the week, or just take a seat.
              </p>
              <div className="mt-7">
                <ButtonLink href="/get-involved" size="lg">
                  Get involved
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
