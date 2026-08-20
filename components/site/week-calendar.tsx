import { Suspense } from "react";
import { weekCalendar } from "@/lib/schedule";
import { TRACK_NAMES } from "@/lib/tracks";
import { WeekCalendarGrid } from "@/components/site/week-calendar-grid";
import type { Option } from "@/components/site/calendar/controls";

// The week on an hour axis — five columns, Monday to Friday.
//
// This is the server half: it reads the schedule and hands down only what the
// grid renders. Same split, and the same reason, as week-strip.tsx — the
// schedule pulls in lib/locations and with it every room's copy, coordinates
// and image URLs, none of which a calendar block has any use for. Projecting
// here keeps all of it out of the client bundle.
//
// The layout decisions — the derived axis, the two rails, lane assignment —
// are documented in week-calendar-grid.tsx, next to the code that makes them.

export function WeekCalendar() {
  const { days, items, spans, axis } = weekCalendar();

  // Only what the week actually contains. A chip for a circuit or a venue with
  // nothing behind it is a control whose only outcome is an empty grid, and
  // there are five of each — enough that a dead one costs the reader a click
  // to discover.
  const present = [...items, ...spans];
  const circuits: Option[] = dedupe(present.map((s) => s.circuit))
    .sort((a, b) => trackOrder(a) - trackOrder(b))
    .map((c) => ({ value: c, label: c }));
  const venues: Option[] = dedupe(present.map((s) => s.venueSlug)).map(
    (slug) => ({
      value: slug,
      label: present.find((s) => s.venueSlug === slug)!.venueName,
    }),
  );

  return (
    <section
      // The target for "Week" in the day rail, and for the back link on a day
      // page that has no history to return to. Without it both land on
      // /schedule at scroll 0 — above the hero, the bento and three activation
      // bands — which reads as having been thrown out of the schedule rather
      // than returned to it.
      id="the-week"
      // Named by the hidden heading below, which is what makes this a `region`
      // in the accessibility tree. A <section> without an accessible name is
      // generic — it does not appear in a screen reader's landmark list at
      // all.
      aria-labelledby="the-week-heading"
      // The navbar is `sticky top-0` at h-16, so an anchor scrolled flush to
      // the viewport top sits underneath it. 5rem clears the 4rem bar and
      // leaves the section's own eyebrow visible rather than tucked against
      // the edge.
      className="scroll-mt-20 border-t border-white/10 bg-black"
    >
      {/* Wider than the site's max-w-7xl from 2xl. Every other section holds a
            reading measure, and should — but a calendar is a data grid, not
            prose, and on a 2560px display the 1280px one stranded the whole
            week in the middle of the screen with 640px of black either side,
            every block smaller in absolute terms than the same block on a
            phone. 110rem cuts that margin to 400 and gives each day column
            about a hundred more pixels.

            A deliberate break from the page's measure rather than a free win:
            this section is now the one that runs wider than its neighbours. */}
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-20 2xl:max-w-[110rem]">
        {/* The heading the visible design does without.

            Removing the visible h2 was right — the hero carries the message
            now, and a second display headline one viewport under it was the
            page reading as two heroes. But the h2 was also doing invisible
            work: it put the calendar in the document outline and gave this
            section the name that makes it a landmark. Without it a screen
            reader user navigating by heading went straight from the hero to
            "PySanAntonio II", with the nine activations, five days, filters
            and day toggles in between announced as nothing at all.

            Dated rather than just "The week", because headings are read out of
            context in a list, where "The week" alone says very little. */}
        <h2 id="the-week-heading" className="sr-only">
          The week, Sept 28 – Oct 2
        </h2>

        {/* No visible header. This section used to open on its own eyebrow, headline
            and standfirst, one viewport under a hero doing the same thing in
            the same shape — same date range in the eyebrow, same claim about
            what was confirmed, and the reader performing the identical
            eyebrow-headline-blurb read twice before reaching a single block.

            The hero carries the message now, including the headline this
            section used to hold. What is left here is the thing itself: the
            controls, then the week. The one line worth keeping — that a day
            opens on its own — moved into the grid as a caption above the
            filters, since it describes a control rather than introducing a
            section. */}
        {/* The grid reads its filters from the URL, and `useSearchParams`
            can't resolve during prerender — Next requires the boundary. The
            fallback is the grid's own height so the page doesn't jump when it
            lands; there is nothing useful to show in the meantime, since what
            to show is exactly what the query string decides. */}
        <Suspense fallback={<div className="mt-10 h-[42rem]" />}>
          <WeekCalendarGrid
            days={days}
            items={items}
            spans={spans}
            axis={axis}
            circuits={circuits}
            venues={venues}
          />
        </Suspense>
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
