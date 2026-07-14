"use client";

import * as React from "react";
import type { DayCount } from "@/lib/admin/metrics";

export function RegistrationsChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((a, b) => a + b.count, 0);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          Registrations
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {total} in {data.length} days
        </span>
      </div>

      {/* Single-series magnitude — one hue, no legend (title names it). */}
      <div className="mt-6 flex flex-1 items-end gap-1" style={{ minHeight: 140 }}>
        {data.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div
              key={d.iso}
              className="group relative flex flex-1 flex-col items-center justify-end"
              style={{ height: 140 }}
            >
              <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {d.count} · {d.label}
              </div>
              <div
                className="w-full rounded-t bg-magenta/85 transition-colors group-hover:bg-magenta"
                style={{ height: `${Math.max(pct, d.count ? 3 : 1.5)}%` }}
                title={`${d.label}: ${d.count}`}
                aria-label={`${d.label}: ${d.count} registrations`}
              />
            </div>
          );
        })}
      </div>

      {/* Sparse baseline labels — first, middle, last. */}
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
