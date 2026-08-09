"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// The interactive half of the week strip.
//
// Split from week-strip.tsx rather than marking the whole thing "use client":
// the strip's data comes from lib/schedule, which pulls in lib/locations and
// every room's copy, images and coordinates. Projecting to the handful of
// fields below on the server keeps all of that out of the bundle — the client
// only ever needed a title, a time, a venue name and two things to filter on.

export interface StripItem {
  slug: string;
  title: string;
  /** Set when the activation has a page of its own. */
  page: string | null;
  /** Pre-formatted — the client has no business re-deriving a timezone. */
  time: string | null;
  venueSlug: string;
  venueName: string;
  circuit: string;
}

export interface StripDay {
  iso: string;
  weekday: string;
  label: string;
  sessions: StripItem[];
}

interface Option {
  value: string;
  label: string;
}

export function WeekStripGrid({
  days,
  circuits,
  venues,
}: {
  days: StripDay[];
  circuits: Option[];
  venues: Option[];
}) {
  const [circuit, setCircuit] = useState<string | null>(null);
  const [venue, setVenue] = useState<string | null>(null);
  const filtering = circuit !== null || venue !== null;

  const filtered = useMemo(
    () =>
      days.map((d) => ({
        ...d,
        sessions: d.sessions.filter(
          (s) =>
            (circuit === null || s.circuit === circuit) &&
            (venue === null || s.venueSlug === venue),
        ),
      })),
    [days, circuit, venue],
  );

  const total = days.reduce((n, d) => n + d.sessions.length, 0);
  const shown = filtered.reduce((n, d) => n + d.sessions.length, 0);

  return (
    <>
      {/* One template string rather than an expression next to text. Split
          across lines, JSX dropped the space before "activations" and it
          rendered as "7activations"; prettier normalises a {" "} away again,
          so the counts are interpolated instead. */}
      <p className="mt-4 max-w-2xl text-pretty text-white/60">
        {filtering
          ? `Showing ${shown} of ${total} activations.`
          : `${total} activations locked so far. More lands on every day as it’s confirmed.`}
      </p>

      {/* Two rows of toggles rather than two select menus. There are five of
          each and they all fit — a menu would hide the vocabulary of the week
          behind a click, and the point of these is partly to show that the
          five circuits exist. */}
      <div className="mt-8 flex flex-col gap-3">
        <FilterRow
          legend="Circuit"
          options={circuits}
          value={circuit}
          onChange={setCircuit}
        />
        <FilterRow
          legend="Venue"
          options={venues}
          value={venue}
          onChange={setVenue}
        />
      </div>

      {/* Five columns from lg, a stack below it. Not a scroller: five days is
          few enough to show at once, and a horizontal scroll would hide the
          back half of the week behind a gesture. */}
      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5">
        {filtered.map((day) => (
          <li key={day.iso} className="flex flex-col gap-4 bg-black p-5">
            <p className="font-mono text-[11px] uppercase tracking-widest">
              <span className="text-white">{day.weekday}</span>{" "}
              <span className="text-white/45">{day.label}</span>
            </p>

            {day.sessions.length === 0 ? (
              // Two different silences. A day with nothing booked is still
              // filling; a day hidden by a filter is not, and saying "still
              // landing" there would be a lie the reader could disprove by
              // clearing the filter.
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/35">
                {filtering ? "Nothing matching" : "Still landing"}
              </p>
            ) : (
              <ul className="flex flex-col gap-3.5">
                {day.sessions.map((s) => (
                  <li key={s.slug}>
                    {/* Linked where the activation has a page of its own;
                        plain text where it doesn't, rather than a dead
                        anchor. */}
                    {s.page ? (
                      <Link
                        href={`/schedule/${s.page}`}
                        className="group block focus-visible:outline-none"
                      >
                        <Row session={s} interactive />
                      </Link>
                    ) : (
                      <Row session={s} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
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
      <legend className="sr-only">Filter by {legend.toLowerCase()}</legend>
      <span
        aria-hidden="true"
        // /55, not the /40-/45 used for captions elsewhere on this page. This
        // one names what a control does rather than annotating content, and
        // /40 measured 3.66:1 — under AA for text this size.
        className="mr-1 w-14 shrink-0 font-mono text-[10px] uppercase tracking-widest text-white/55"
      >
        {legend}
      </span>

      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            // Toggle rather than radio: clicking the active chip clears it, so
            // getting back to the whole week never needs a separate control.
            aria-pressed={active}
            onClick={() => onChange(active ? null : o.value)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
              active
                ? // Filled, not just tinted — an active filter changes what the
                  // reader is looking at and has to survive a glance.
                  "border-magenta bg-magenta text-black"
                : // /40, not the /10 used for section seams on this page:
                  // WCAG 1.4.11 wants 3:1 for a boundary that identifies a
                  // control. Measured on black — /30 gives 2.48:1 and fails,
                  // /40 gives 3.66:1. The seams elsewhere are decoration and
                  // aren't held to it; this ring is the control's only edge.
                  "border-white/40 text-white/70 hover:border-white/70 hover:text-white",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}

function Row({
  session,
  interactive = false,
}: {
  session: StripItem;
  interactive?: boolean;
}) {
  return (
    <>
      <p
        className={
          interactive
            ? "text-pretty text-sm font-medium leading-snug text-white transition-colors duration-200 group-hover:text-magenta group-focus-visible:text-magenta"
            : "text-pretty text-sm font-medium leading-snug text-white"
        }
      >
        {session.title}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/45">
        {session.time ? `${session.time} · ` : ""}
        {session.venueName}
      </p>
    </>
  );
}
