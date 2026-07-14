"use client";

import * as React from "react";

interface Point {
  iso: string;
  label: string;
  sessions: number;
}

/** Sessions-by-day line + area, space-blue, with a hover crosshair + tooltip. */
export function SessionsTrend({ data }: { data: Point[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No sessions in this range yet.
      </div>
    );
  }

  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.sessions));
  const xAt = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50);
  const yAt = (v: number) => 100 - (v / max) * 100; // % from top

  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${yAt(d.sessions).toFixed(2)}`)
    .join(" ");
  const area = `${line} L100 100 L0 100 Z`;

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setHover(Math.round(frac * (n - 1)));
  }

  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="relative h-40 w-full"
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="h-full w-full text-space-blue"
          aria-hidden="true"
        >
          <path d={area} fill="currentColor" opacity={0.08} />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {active && hover !== null && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-space-blue/30"
              style={{ left: `${xAt(hover)}%` }}
            />
            <div
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-space-blue ring-2 ring-white"
              style={{ left: `${xAt(hover)}%`, top: `${yAt(active.sessions)}%` }}
            />
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-y-full whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{
                left: `${Math.min(92, Math.max(8, xAt(hover)))}%`,
                transform: "translate(-50%, -4px)",
              }}
            >
              {active.sessions.toLocaleString()} · {active.label}
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
