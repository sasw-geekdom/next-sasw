"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SpeakerCard } from "@/components/site/speaker-card";
import { TRACK_NAMES, type TrackName } from "@/lib/tracks";
import { cn } from "@/lib/utils";
import type { LineupSpeaker } from "@/lib/admin/cms-types";

// The full lineup. Filtering is by circuit rather than by name or company,
// because the circuits are the site's own taxonomy — and the mapping is free:
// sessions already carry a track and a participant list, so a speaker's
// circuits fall out of the schedule instead of needing their own field.

const EASE = [0.22, 1, 0.36, 1] as const;

export function SpeakerWall({ speakers }: { speakers: LineupSpeaker[] }) {
  const reduce = useReducedMotion();
  const [circuit, setCircuit] = React.useState<TrackName | null>(null);

  // Only the circuits actually represented, in canonical track order — an
  // empty filter is worse than no filter.
  const circuits = React.useMemo(
    () =>
      TRACK_NAMES.filter((n) => speakers.some((s) => s.circuits.includes(n))),
    [speakers],
  );

  const visible = circuit
    ? speakers.filter((s) => s.circuits.includes(circuit))
    : speakers;

  return (
    <>
      {/* A filter row is pointless with a single circuit on the board. */}
      {circuits.length > 1 && (
        <div
          role="group"
          aria-label="Filter speakers by circuit"
          className="mt-12 flex flex-wrap items-center gap-2 border-t border-white/10 pt-8"
        >
          <FilterChip active={circuit === null} onClick={() => setCircuit(null)}>
            All {speakers.length}
          </FilterChip>
          {circuits.map((name) => (
            <FilterChip
              key={name}
              active={circuit === name}
              onClick={() => setCircuit(circuit === name ? null : name)}
            >
              {name}
            </FilterChip>
          ))}
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
        // Charge, not hue — the selected circuit is the one at full current.
        "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        active
          ? "border-magenta bg-magenta text-black"
          : "border-white/15 text-white/55 hover:border-magenta/50 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
