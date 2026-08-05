"use client";

import * as React from "react";

// The probe readout — a small mono chip that trails the cursor across a logo,
// naming what's under it. Shared by the homepage sponsor/partner wall and the
// PySanAntonio co-brand row so the two can't drift apart.
//
// The chip is positioned by writing straight to the DOM rather than through
// state: a mousemove handler that re-renders on every frame makes the trailing
// motion stutter.

/** Resting spot — keyboard focus and first paint. Centred under the logo. */
const CHIP_HOME = {
  left: "50%",
  top: "calc(100% + 6px)",
  transform: "translateX(-50%)",
} as const;

export function useProbeChip() {
  const chipRef = React.useRef<HTMLSpanElement>(null);

  function onMouseMove(e: React.MouseEvent) {
    const chip = chipRef.current;
    if (!chip) return;
    const r = e.currentTarget.getBoundingClientRect();
    chip.style.left = `${e.clientX - r.left + 14}px`;
    chip.style.top = `${e.clientY - r.top + 18}px`;
    chip.style.transform = "none";
  }

  function onMouseLeave() {
    const chip = chipRef.current;
    if (!chip) return;
    chip.style.left = CHIP_HOME.left;
    chip.style.top = CHIP_HOME.top;
    chip.style.transform = CHIP_HOME.transform;
  }

  /** Spread onto the element the cursor moves over; it needs `group relative`. */
  return { chipRef, probeProps: { onMouseMove, onMouseLeave } };
}

/**
 * The chip itself. Decorative — the name it shows is already the link's
 * accessible name, so announcing it twice would only add noise.
 *
 * `whitespace-nowrap` means a long name can reach past a narrow cell even at
 * `opacity-0`, so the containing section wants `overflow-x-clip` or its own
 * `overflow-hidden`; without one, a wide chip can push a horizontal scrollbar
 * onto the page at small widths.
 */
export function ProbeChip({
  chipRef,
  children,
}: {
  chipRef: React.RefObject<HTMLSpanElement | null>;
  children: React.ReactNode;
}) {
  return (
    <span
      ref={chipRef}
      aria-hidden="true"
      style={CHIP_HOME}
      className="pointer-events-none absolute z-20 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      <span className="flex items-center gap-2 rounded-sm border border-white/15 bg-black/90 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/80 shadow-lg shadow-black/50">
        <span aria-hidden="true" className="h-1.5 w-1.5 bg-magenta" />
        {children}
      </span>
    </span>
  );
}
