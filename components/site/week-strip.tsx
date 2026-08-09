import { scheduleByDay, whenShort } from "@/lib/schedule";
import { TRACK_NAMES } from "@/lib/tracks";
import {
  WeekStripGrid,
  type StripDay,
} from "@/components/site/week-strip-grid";

// The week at a glance, above the deep dives.
//
// The page had no answer to "what's on Tuesday?" — seven activations arrived
// in neither chronological nor venue order, and the reader had to assemble the
// shape themselves. This is that shape, stated once before anything else asks
// for attention.
//
// Every day in the week appears, including the ones with nothing confirmed.
// A day the reader can see is still filling is information; a day silently
// missing from the list is a hole they have to notice on their own. The hero
// already promises "the full schedule lands closer to the week", so a column
// that says so is keeping that promise rather than admitting a gap.
//
// This half is the server half: it reads the schedule and projects it down to
// what the grid needs. The filtering lives in week-strip-grid.tsx — see the
// note there for why the split is worth a second file.

export function WeekStrip() {
  const days: StripDay[] = scheduleByDay().map((day) => ({
    iso: day.iso,
    weekday: day.weekday,
    label: day.label,
    sessions: day.sessions.map((s) => ({
      slug: s.slug,
      title: s.title,
      page: s.page ?? null,
      time: s.when ? whenShort(s.when).time : null,
      venueSlug: s.venue.slug,
      venueName: s.venue.name,
      circuit: s.circuit,
    })),
  }));

  // Only what the week actually contains. A chip for a circuit or a venue with
  // nothing behind it is a control whose only outcome is an empty grid, and
  // there are five of each — enough that a dead one costs the reader a click
  // to discover.
  const present = days.flatMap((d) => d.sessions);
  const circuits = dedupe(present.map((s) => s.circuit)).sort(
    (a, b) => trackOrder(a) - trackOrder(b),
  );
  const venues = dedupe(present.map((s) => s.venueSlug)).map((slug) => ({
    value: slug,
    label: present.find((s) => s.venueSlug === slug)!.venueName,
  }));

  return (
    <section className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            The week · Sept 28 – Oct 2
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
            Five days, one current.
          </h2>
        </div>

        <WeekStripGrid
          days={days}
          circuits={circuits.map((c) => ({ value: c, label: c }))}
          venues={venues}
        />
      </div>
    </section>
  );
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

/** Canonical circuit order, with "Social" — which isn't one — last. */
function trackOrder(name: string): number {
  const i = (TRACK_NAMES as readonly string[]).indexOf(name);
  return i === -1 ? TRACK_NAMES.length : i;
}
