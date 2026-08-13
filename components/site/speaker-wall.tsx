"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SpeakerCard } from "@/components/site/speaker-card";
import { TRACK_NAMES, type TrackName } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { LineupSpeaker } from "@/lib/admin/cms-types";

// The full lineup, filtered three ways: by circuit, by activation, and by
// venue.
//
// None of the three is a field on a speaker. All of them fall out of the
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

interface Option {
  value: string;
  label: string;
}

export function SpeakerWall({
  speakers,
  activations = [],
  venues = [],
}: {
  speakers: LineupSpeaker[];
  /** Slug → title, for every activation on the schedule. */
  activations?: Option[];
  /** Slug → name, for every venue. */
  venues?: Option[];
}) {
  const reduce = useReducedMotion();
  const [circuit, setCircuit] = React.useState<string | null>(null);
  const [activation, setActivation] = React.useState<string | null>(null);
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

  const activationOptions = React.useMemo(
    () =>
      activations.filter((o) =>
        speakers.some((s) => s.activations.includes(o.value)),
      ),
    [activations, speakers],
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
          // Three filters combine as AND. Someone narrowing to a circuit and
          // then a venue means "this circuit, in this room" — the reading that
          // matches how the schedule is laid out.
          (circuit === null || s.circuits.includes(circuit as TrackName)) &&
          (activation === null || s.activations.includes(activation)) &&
          (venue === null || s.venues.includes(venue)),
      ),
    [speakers, circuit, activation, venue],
  );

  const rows = [
    {
      legend: "Circuit",
      options: circuitOptions,
      value: circuit,
      onChange: setCircuit,
    },
    {
      legend: "Event",
      options: activationOptions,
      value: activation,
      onChange: setActivation,
    },
    {
      legend: "Venue",
      options: venueOptions,
      value: venue,
      onChange: setVenue,
    },
    // A row with one option filters nothing — everything already matches it.
  ].filter((r) => r.options.length > 1);

  const filtering = circuit !== null || activation !== null || venue !== null;

  const clear = () => {
    setCircuit(null);
    setActivation(null);
    setVenue(null);
  };

  return (
    <>
      {rows.length > 0 && (
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-3">
            {rows.map((row) => (
              <FilterRow key={row.legend} {...row} />
            ))}
          </div>

          {/* Only once something is on. With three rows, clearing one at a
              time is four clicks; this is one. It also states the count, which
              is the question a filtered grid raises. */}
          {filtering && (
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/55">
                {visible.length === 0
                  ? "Nobody matches all three"
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

function FilterRow({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: Option[];
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">
        Filter speakers by {legend.toLowerCase()}
      </legend>
      <span
        aria-hidden="true"
        className="mr-1 w-14 shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/55"
      >
        {legend}
      </span>
      {options.map((o) => (
        <FilterChip
          key={o.value}
          active={value === o.value}
          onClick={() => onChange(value === o.value ? null : o.value)}
        >
          {o.label}
        </FilterChip>
      ))}
    </fieldset>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // Charge, not hue — the selected chip is the one at full current.
        "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        active
          ? "border-magenta bg-magenta text-black"
          : // border-white/40, not the /15 this carried before: WCAG 1.4.11
            // wants 3:1 for a boundary that identifies a control, and /15 on
            // black measures nowhere near it. Same value the week strip's
            // chips landed on for the same reason.
            "border-white/40 text-white/70 hover:border-magenta/60 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
