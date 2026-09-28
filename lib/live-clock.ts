"use client";

import * as React from "react";

// The schedule's sense of "now", for the week itself.
//
// Worked out in the visitor's browser, never on the server: every public
// schedule page is cached for five minutes, and a "Now" baked into a cached
// page would still be saying it five minutes after the session ended.
//
// Small and dependency-free on purpose. The calendar components import only
// types from lib/schedule.ts so that its 4,000 lines of room copy stay out of
// the client bundle; a helper imported from there by value would undo that.
//
// `?at=2026-09-29T13:20` (Central time) starts the clock there and lets it run
// — the same switch the TV loops take, for checking a day before it happens.

const TZ = "America/Chicago";
const TICK_MS = 20_000;

export interface ChicagoNow {
  /** Epoch ms. 0 during the server render and the first paint. */
  ms: number;
  /** The Central-time date, YYYY-MM-DD. */
  iso: string;
  /** Minutes past midnight, Central time. */
  min: number;
}

const ZERO: ChicagoNow = { ms: 0, iso: "", min: 0 };
const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function chicagoParts(ms: number): ChicagoNow {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { ms, iso: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

let current: ChicagoNow = ZERO;
let skew = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  current = chicagoParts(Date.now() + skew);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!timer) {
    const at = new URLSearchParams(window.location.search).get("at");
    const want = at ? Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(at) ? at : `${at}:00-05:00`) : NaN;
    skew = Number.isFinite(want) ? want - Date.now() : 0;
    tick();
    timer = setInterval(tick, TICK_MS);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Central time, refreshed every 20 seconds. */
export function useChicagoNow(): ChicagoNow {
  return React.useSyncExternalStore(subscribe, () => current, () => ZERO);
}

/** How far ahead a session counts as "soon". */
export const SOON_MIN = 45;

export type LiveState = "past" | "now" | "soon" | "later" | "elsewhen";

/**
 * Where a scheduled item stands against the clock. Anything not on today's
 * date is "elsewhen" — the schedule draws it exactly as it always has.
 */
export function liveState(
  item: { dayIso: string; startMin: number; endMin: number },
  now: ChicagoNow,
): LiveState {
  if (!now.ms || item.dayIso !== now.iso) return "elsewhen";
  if (now.min >= item.endMin) return "past";
  if (now.min >= item.startMin) return "now";
  if (item.startMin - now.min <= SOON_MIN) return "soon";
  return "later";
}

/** 14:05 → "2:05 PM". */
export function clockText(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "AM" : "PM"}`;
}
