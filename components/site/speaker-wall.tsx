"use client";

import * as React from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SpeakerCard } from "@/components/site/speaker-card";
import { TRACK_NAMES, type TrackName } from "@/lib/tracks";
import type { LineupSpeaker } from "@/lib/admin/cms-types";
import { Filters, type Option } from "@/components/site/calendar/controls";

// The full lineup, filtered two ways: by circuit and by venue.
//
// Neither is a field on a speaker. Both fall out of the
// sessions a speaker is on — a session already carries a track, an activation
// and a venue, plus a participant list — so the taxonomy can't drift from the
// schedule. Move a session to another room in the CMS and every speaker on it
// moves with it, on this page and on the schedule, without a second edit.
//
// The consequence worth knowing: **a speaker with no sessions matches no
// filter and has no chips.** Until organisers enter sessions, every row here
// is empty and the whole filter block hides itself. That is the intended
// behaviour rather than a bug — a filter whose only outcome is an empty grid
// is worse than no filter — but it does mean this UI stays invisible until the
// programme is entered.

const EASE = [0.22, 1, 0.36, 1] as const;

export function SpeakerWall({
  speakers,
  venues = [],
}: {
  speakers: LineupSpeaker[];
  /** Slug → name, for every venue. */
  venues?: Option[];
}) {
  const reduce = useReducedMotion();
  const [circuit, setCircuit] = React.useState<string | null>(null);
  const [venue, setVenue] = React.useState<string | null>(null);

  // Only what the lineup actually contains, ordered off the site's own lists.
  // An option with nothing behind it is a control whose only outcome is an
  // empty grid.
  const circuitOptions: Option[] = React.useMemo(
    () =>
      TRACK_NAMES.filter((n) =>
        speakers.some((s) => s.circuits.includes(n as TrackName)),
      ).map((n) => ({ value: n, label: n })),
    [speakers],
  );

  const venueOptions = React.useMemo(
    () =>
      venues.filter((o) => speakers.some((s) => s.venues.includes(o.value))),
    [venues, speakers],
  );

  const visible = React.useMemo(
    () =>
      speakers.filter(
        (s) =>
          // Both filters combine as AND. Someone narrowing to a circuit and
          // then a venue means "this circuit, in this room" — the reading that
          // matches how the schedule is laid out.
          (circuit === null || s.circuits.includes(circuit as TrackName)) &&
          (venue === null || s.venues.includes(venue)),
      ),
    [speakers, circuit, venue],
  );

  // Anything worth offering. A dimension with one option filters nothing —
  // everything already matches it — and with neither, the whole block goes.
  const hasFilters = circuitOptions.length > 1 || venueOptions.length > 1;

  const filtering = circuit !== null || venue !== null;

  const clear = () => {
    setCircuit(null);
    setVenue(null);
  };

  return (
    <>
      {/* Close to the copy it belongs to. This carried `mt-12 border-t pt-8`,
          which put 81px and a rule between "More land as they're locked." and
          the control that acts on it — the rule floating in the middle of that
          gap, reading as a section break rather than as a seam. The schedule
          sits its own controls 16px under its intro with no rule at all, and
          that is the pattern being matched. */}
      {hasFilters && (
        <div className="mt-8">
          {/* The schedule's own control, not a copy of it. `Filters` owns the
              switch this page was missing: selects below lg, where ten chips
              cost four lines of a phone, and chips from lg, where there is
              width to show the vocabulary. Matching the chip styling alone
              left the two pages apart at exactly the size it mattered. */}
          <Filters
            circuits={circuitOptions}
            venues={venueOptions}
            circuit={circuit}
            venue={venue}
            onCircuit={setCircuit}
            onVenue={setVenue}
          />

          {/* Only once something is on. With three rows, clearing one at a
              time is four clicks; this is one. It also states the count, which
              is the question a filtered grid raises. */}
          {filtering && (
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                {visible.length === 0
                  ? "Nobody matches both"
                  : `Showing ${visible.length} of ${speakers.length}`}
              </span>
              <button
                type="button"
                onClick={clear}
                className="font-mono text-[11px] uppercase tracking-widest text-magenta underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Clear
              </button>
            </p>
          )}
        </div>
      )}

      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:mt-14 lg:grid-cols-4">
        {visible.map((s, i) => (
          <motion.div
            key={s.id}
            initial={reduce ? undefined : { opacity: 0, y: 20 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: reduce ? 0 : Math.min(i, 12) * 0.04,
              ease: EASE,
            }}
          >
            <SpeakerCard
              speaker={s}
              circuits={s.circuits}
              priority={i < 4}
              sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
            />
          </motion.div>
        ))}
      </div>
    </>
  );
}
