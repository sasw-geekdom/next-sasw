"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// The frame every /tv screen draws in: a fixed 1920×1080 stage, scaled to fit
// whatever the TV's browser reports and letterboxed in black. Everything inside
// is laid out in stage pixels, so a 720p panel, a 1080p panel and a 4K one all
// show the same picture — the browser rasterises text at the final scale, so
// nothing goes soft on a 4K set.
//
// It also does the three jobs a screen left alone all day needs:
//   · keeps the data fresh — `router.refresh()` every few minutes re-renders
//     the server half (ISR'd, and busted by CMS saves) without reloading the
//     page or restarting the loop, so a session edited mid-afternoon reaches
//     the room on its own;
//   · asks the display not to sleep (the Screen Wake Lock API, where the
//     browser has it);
//   · hides the cursor once the mouse stops moving.

export const STAGE_W = 1920;
export const STAGE_H = 1080;

/** How often the server data is re-read. */
const REFRESH_MS = 5 * 60_000;

// ── The clock ────────────────────────────────────────────────────────────────
//
// One shared clock, ticking every second, that every "Now / Up next" reads.
// `?at=2026-09-29T13:20` (Central time) starts it there instead and lets it
// run on from that point — so the AV crew can rehearse a day's changeovers the
// week before, and see the loop exactly as it will look at 1:20 on Tuesday.

let now = 0;
let skew = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  now = Date.now() + skew;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!timer) {
    const at = new URLSearchParams(window.location.search).get("at");
    const want = at ? Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(at) ? at : `${at}:00-05:00`) : NaN;
    skew = Number.isFinite(want) ? want - Date.now() : 0;
    tick();
    timer = setInterval(tick, 1000);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Epoch ms, once a second. 0 during the server render and first paint. */
export function useNow(): number {
  return React.useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
}

// ── The stage ────────────────────────────────────────────────────────────────

const ScaleContext = React.createContext(1);
/** The stage's current scale — for measuring in stage pixels. */
export function useStageScale() {
  return React.useContext(ScaleContext);
}

export function TvStage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [box, setBox] = React.useState({ s: 1, x: 0, y: 0 });
  const [idle, setIdle] = React.useState(false);

  React.useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      setBox({
        s,
        x: (window.innerWidth - STAGE_W * s) / 2,
        y: (window.innerHeight - STAGE_H * s) / 2,
      });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  React.useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    const ask = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      nav.wakeLock.request("screen").then((l) => (lock = l), () => {});
    };
    ask();
    document.addEventListener("visibilitychange", ask);
    return () => {
      document.removeEventListener("visibilitychange", ask);
      lock?.release().catch(() => {});
    };
  }, []);

  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 2500);
    };
    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black"
      style={{ cursor: idle ? "none" : "default" }}
      // Double-click for fullscreen: the one control a TV browser needs.
      onDoubleClick={() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => {});
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden bg-black text-white"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(${box.x}px, ${box.y}px) scale(${box.s})`,
        }}
      >
        <ScaleContext.Provider value={box.s}>{children}</ScaleContext.Provider>
      </div>
    </div>
  );
}
