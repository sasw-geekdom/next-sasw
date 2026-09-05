import { Hero } from "@/components/site/hero";
import { jsonLd, weekEvent } from "@/lib/structured-data";
import { liveSchedule } from "@/lib/live-schedule";
import { weekCalendar } from "@/lib/schedule";
import { RoomFlow } from "@/components/site/room-flow";
import { WeekBoard } from "@/components/site/week-board";
import { AccessGrantedBand } from "@/components/site/access-granted-band";
import { SpeakerLineup } from "@/components/site/speaker-lineup";
import { PowerGrid } from "@/components/site/power-grid";
import {
  listPartners,
  listSponsors,
  listSpeakers,
} from "@/lib/admin/cms-queries";
import { SPEAKERS_ANNOUNCED } from "@/lib/speakers";

// Speakers and sponsor/partner logos come from the CMS — refresh every 5
// minutes so admin changes appear without a redeploy. Saves in the admin bust
// this path outright, so the window is only the ceiling, not the norm.
export const revalidate = 300;

// The homepage features the first six in admin drag order; the rest live on
// /speakers. Reordering in the CMS is how you change who leads.
const FEATURED = 6;

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [sponsors, partners, speakers, live] = await Promise.all([
    safeList(listSponsors()),
    safeList(listPartners()),
    // Skipped entirely while the lineup is under wraps — no point paying for
    // a Firestore read on every regeneration to render nothing.
    SPEAKERS_ANNOUNCED ? safeList(listSpeakers()) : Promise.resolve([]),
    // Read here rather than inside WeekBoard, because two sections need it and
    // `listSessions` is not memoised: the board draws the week, and RoomFlow
    // counts what each room holds.
    liveSchedule(),
  ]);

  /**
   * How many the week actually puts in each room, CMS sessions included.
   *
   * RoomFlow used to count `room.sessions` — a hand-kept highlight list in
   * lib/locations that has drifted from the schedule in both directions. It
   * names three things that are not on it ("State of Innovation", two speed
   * networking sessions) and misses most of what is, so The Rand reported
   * "4 sessions confirmed" above a card naming six user groups and calling
   * itself the busiest room of the week.
   *
   * Spans count. Give-a-LOT is the whole of what Central Library runs outside
   * its Wednesday, and a room that reports one session while its card says a
   * drive runs there all five days is the same contradiction in miniature.
   */
  const week = weekCalendar(live.items, live.attached);
  const roomCounts: Record<string, number> = {};
  for (const entry of [...week.items, ...week.spans]) {
    roomCounts[entry.venueSlug] = (roomCounts[entry.venueSlug] ?? 0) + 1;
  }

  return (
    <>
      {/* Event rich results — the date, venue and "Free" shown in the search
          listing itself. Built from the same constants the page renders. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(weekEvent()) }}
      />
      {/* The only page on the site that had no <main>. Every other one wraps
          its sections in it; without it there is no main landmark to skip to. */}
      <main>
        <Hero />
        {/* When before where: the hero says what the week is, this says when
            it happens, RoomFlow says where.
            
            It draws the schedule's own week — same flat cards, same day heads,
            same all-week strip — so clicking through lands the reader on more
            of what they were looking at. (The note that used to sit here said
            the week grid was retiring in favour of the agenda; it was rebuilt
            instead, and this is now a preview of it rather than a stand-in.) */}
        <WeekBoard items={live.items} />

        {/* Hidden until announcement. `SPEAKERS_ANNOUNCED` in lib/speakers.ts
          is the single switch — flipping it restores this band and the
          /speakers wall together.

          Above the rooms, and above the single-event band.

          Order for the run-up rather than for a first visit. The lineup is
          the page's freshest section and its only one a third party shares —
          an announced speaker posts this link — and it sat at y=4,049, six
          screens down, behind 1,927px of venues and one activation. Venue is
          also the last thing a stranger decides on: they pick by event, by
          speaker or by day, and which building it is in matters once they are
          already coming. Speakers now land on the second screen.

          RoomFlow keeps its place *before* AccessGrantedBand, which is a real
          dependency rather than a habit — see the note there. */}
        {SPEAKERS_ANNOUNCED && (
          <SpeakerLineup speakers={speakers.slice(0, FEATURED)} />
        )}
        <RoomFlow counts={roomCounts} />

        {/* One event, after the rooms — by which point "Geekdom, 3rd floor"
          means something.

          The band itself, not a homepage-only variant. A bespoke spotlight was
          built first and it drifted immediately: different grid, different
          mobile order, the art landing after the copy instead of between the
          one-liner and the event details. Two components rendering one event
          is two places for that to happen again, so the teaser is the same
          teaser /schedule uses. */}
        <AccessGrantedBand
          detailHref="/schedule/access-granted"
          scheduleHref="/schedule"
        />
        <PowerGrid sponsors={sponsors} partners={partners} />
      </main>
    </>
  );
}
