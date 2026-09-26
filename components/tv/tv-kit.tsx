"use client";

/* eslint-disable @next/next/no-img-element --
   Logos here come from three hosts (local /public, Vercel Blob, the DEVSA S3
   bucket) at sizes set in stage pixels, on a page that is never crawled or
   measured for LCP. next/image would need a remote pattern per host for no
   gain; a plain <img> is the honest tool. */

import * as React from "react";
import { TOOL_MARKS } from "@/lib/tool-marks";
import type { TvLogo, TvMark, TvPerson } from "@/lib/tv";
import { STAGE_H, STAGE_W, useNow, useStageScale } from "@/components/tv/tv-stage";

// ── Scenes ───────────────────────────────────────────────────────────────────
//
// A loop is a list of scenes, each with a length in seconds. They play in
// order and dip through black between them — never a cross-dissolve, which
// with two screens of text reads as a glitch from across a room. A scene is
// remounted every time it comes round, so its entrance animations (the rows
// arriving one by one) play again rather than showing a finished screen.

export interface SceneDef {
  key: string;
  /** Seconds on screen, fades included. */
  dur: number;
  node: React.ReactNode;
}

const FADE_MS = 700;
const noop = () => () => {};

export function SceneLoop({ scenes }: { scenes: SceneDef[] }) {
  const [at, setAt] = React.useState({ i: 0, round: 0 });
  const [leaving, setLeaving] = React.useState(false);
  // `?scene=agenda` pins the loop to one scene — to check a slide, or to
  // leave a single one up on purpose.
  const hold = React.useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("scene"),
    () => null,
  );
  const count = scenes.length;
  const held = hold ? scenes.findIndex((s) => s.key === hold) : -1;
  // Scenes can come and go between renders (a "Now" scene outside event
  // hours, a data refresh); clamp rather than index past the end.
  const i = held >= 0 ? held : count ? at.i % count : 0;
  const scene = scenes[i];
  const dur = scene?.dur ?? 10;

  // Published on the loop's own container as `data-scene` / `data-leaving`,
  // for layers that live outside the scene (a hero video that must not
  // restart each time round) and still need to show only with it — see
  // `.tv-hero-visual` in app/tv/tv.css.
  const ref = React.useRef<HTMLDivElement>(null);
  const key = scene?.key;
  React.useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || !key) return;
    host.dataset.scene = key;
    if (leaving) host.dataset.leaving = "";
    else delete host.dataset.leaving;
  }, [key, leaving]);

  React.useEffect(() => {
    if (!count || held >= 0) return;
    const out = setTimeout(() => setLeaving(true), dur * 1000 - FADE_MS);
    const next = setTimeout(() => {
      setLeaving(false);
      setAt((a) => ({ i: (a.i + 1) % count, round: a.round + 1 }));
    }, dur * 1000);
    return () => {
      clearTimeout(out);
      clearTimeout(next);
    };
  }, [at, count, dur, held]);

  if (!scene) return null;
  return (
    <div
      ref={ref}
      key={`${scene.key}-${at.round}`}
      className="tv-scene absolute inset-0 z-10"
      style={{ opacity: leaving ? 0 : undefined, transition: `opacity ${FADE_MS}ms ease` }}
    >
      {scene.node}
    </div>
  );
}

/** Rows that arrive one at a time, each given a moment before the next. */
export function rise(i: number, start = 0.5, step = 1.1): React.CSSProperties {
  return { animationDelay: `${start + i * step}s` };
}

// ── Chrome: the lockup, the date, the address, the clock ─────────────────────

export function Chrome({
  when,
  url,
  accent = "#ff32a0",
}: {
  when: React.ReactNode;
  url: string;
  accent?: string;
}) {
  const now = useNow();
  const clock = now
    ? new Date(now).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      })
    : "";
  return (
    <>
      <img
        data-tv-keep
        src="/brand/sastw-horizontal-white.png"
        alt="San Antonio Startup + Tech Week"
        className="absolute left-29 top-16.5 z-20 h-14 w-auto"
      />
      <div
        data-tv-keep
        className="absolute right-29 top-20 z-20 font-mono text-[23px] uppercase tracking-[0.14em] text-white/65"
        style={{ ["--acc" as string]: accent }}
      >
        {when}
      </div>
      <p
        data-tv-keep
        className="absolute bottom-14 left-29 z-20 font-mono text-[23px] tracking-[0.08em] text-white/55"
      >
        <span style={{ color: accent }}>{"//"}</span> {url}
      </p>
      <p
        data-tv-keep
        className="absolute bottom-13 right-29 z-20 font-mono text-[30px] tabular-nums tracking-[0.06em] text-white/70"
      >
        {clock}
      </p>
    </>
  );
}

// ── Now / Up next ────────────────────────────────────────────────────────────

export type SlotState = "past" | "now" | "next" | "later";

const DAY = (ms: number) =>
  new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

/**
 * Where each slot stands against the clock. A slot without an end runs to the
 * next one's start (or half an hour, for the last). "Up next" is only ever
 * marked on the day itself — a loop left on the Friday before shows the
 * running order, not a countdown to something four days off.
 */
export function slotStates(
  slots: readonly { startsAt: number; endsAt: number | null }[],
  now: number,
): SlotState[] {
  if (!now || !slots.length) return slots.map(() => "later");
  const sameDay = DAY(now) === DAY(slots[0].startsAt);
  let nextMarked = false;
  return slots.map((s, i) => {
    const end = s.endsAt ?? slots[i + 1]?.startsAt ?? s.startsAt + 30 * 60_000;
    if (now >= end) return "past";
    if (now >= s.startsAt) return "now";
    if (sameDay && !nextMarked) {
      nextMarked = true;
      return "next";
    }
    return "later";
  });
}

export function StateChip({ state, accent }: { state: SlotState; accent: string }) {
  if (state !== "now" && state !== "next") return null;
  return state === "now" ? (
    <span
      className="tv-pulse ml-5 inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1 align-middle font-mono text-subheading font-medium uppercase tracking-[0.16em] text-black"
      style={{ background: accent }}
    >
      Now
    </span>
  ) : (
    <span
      className="ml-5 inline-flex shrink-0 items-center rounded-md border-2 px-3 py-0.5 align-middle font-mono text-subheading uppercase tracking-[0.16em]"
      style={{ borderColor: accent, color: accent }}
    >
      Up next
    </span>
  );
}

export function clockOf(ms: number): string {
  return new Date(ms)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Chicago",
    })
    .replace(":00", "")
    .replace(" ", " ");
}

// ── Marks, logos, people ─────────────────────────────────────────────────────

export function Mark({ mark, h, accent }: { mark: TvMark; h: number; accent?: string }) {
  if (mark.kind === "image") {
    // Optically balanced: a squarer mark (Open Circuit's is 1.6:1) is set
    // taller than a long wordmark, or it reads as an afterthought beside
    // them. Width-capped as well, so a very wide lockup (.NET's is 8:1)
    // doesn't run off the stage.
    const aspect = mark.width / mark.height;
    const height = Math.round(h * Math.min(1.7, Math.max(1, Math.sqrt(3.2 / aspect))));
    return (
      <img
        src={mark.src}
        alt=""
        className="block w-auto object-contain object-left"
        style={{ height, maxWidth: Math.min(1100, h * 7.2) }}
      />
    );
  }
  const at = mark.accent ? mark.text.lastIndexOf(mark.accent) : -1;
  return (
    <span
      className="block whitespace-nowrap font-display font-bold uppercase leading-[0.92]"
      style={{ fontSize: h * 0.9 }}
    >
      {at >= 0 ? (
        <>
          {mark.text.slice(0, at)}
          <span style={{ color: accent }}>{mark.accent}</span>
        </>
      ) : (
        mark.text
      )}
    </span>
  );
}

export function Logo({ logo, scale = 1 }: { logo: TvLogo; scale?: number }) {
  return (
    <img
      src={logo.src}
      alt={logo.name}
      className="block w-auto max-w-105 object-contain"
      style={{
        height: logo.h * scale,
        filter: logo.white ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}

export function Person({ p, size = 180, accent }: { p: TvPerson; size?: number; accent: string }) {
  const sub = [p.title, p.company].filter(Boolean).join(", ");
  return (
    <div className="flex items-center gap-7">
      {p.imageUrl ? (
        <img
          src={p.imageUrl}
          alt=""
          className="shrink-0 rounded-[14px] object-cover"
          style={{ width: size, height: size, boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}
        />
      ) : null}
      <div className="min-w-0">
        {p.role === "moderator" ? (
          <p className="font-mono text-subheading uppercase tracking-[0.16em]" style={{ color: accent }}>
            Moderator
          </p>
        ) : null}
        <p className="text-[40px] font-semibold leading-[1.1]">{p.name}</p>
        {sub ? <p className="mt-2 text-[24px] leading-[1.3] text-white/65">{sub}</p> : null}
      </div>
    </div>
  );
}

export function Eyebrow({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <p data-tv-keep className="font-mono text-[24px] uppercase tracking-[0.18em] text-white/60">
      <span style={{ color: accent }}>{"//"}</span> {children}
    </p>
  );
}

// ── Ambient layers ───────────────────────────────────────────────────────────

/** A seeded field of bolts — the same field on every screen and every load. */
function boltField(count: number) {
  let seed = 7;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => {
    const near = Math.pow(r(), 1.6);
    // Rounded: the server and the browser print long floats differently in
    // inline styles, and the difference is a hydration mismatch.
    const q = (n: number) => Math.round(n * 100) / 100;
    return {
      x: q(r() * STAGE_W),
      s: q(14 + near * 64),
      o: q(0.1 + near * 0.5),
      dur: q(70 - near * 45),
      delay: q(-r() * 70),
      rot: q(r() * 50 - 25),
      blur: q((1 - near) * 1.4),
    };
  });
}

/**
 * The Startup Bash mini bolts, drifting up the screen — the week's own
 * texture. Pure CSS: each bolt is one element with its own speed and a
 * negative delay, so the field is already full on the first frame.
 */
export function MiniBolts({ count = 44, opacity = 1 }: { count?: number; opacity?: number }) {
  const bolts = React.useMemo(() => boltField(count), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" style={{ opacity }}>
      {bolts.map((b, i) => (
        <img
          key={i}
          src="/brand/sastw-bolt.svg"
          alt=""
          className="tv-drift absolute top-0"
          style={{
            left: b.x,
            width: b.s,
            height: b.s,
            opacity: b.o,
            filter: `blur(${b.blur}px)`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            ["--rot" as string]: `${b.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The Claude Code mascots from The Model's hero, loose across the whole
 * screen. On the site they only appear when clicked; on a TV nothing gets
 * clicked, so here they are the main visual — the same move the holding video
 * makes.
 *
 * Each walks a closed Lissajous path (whole-number frequencies over a minute),
 * faces the way it's heading and bobs as it goes. Anything marked
 * `data-tv-keep` — every line of copy and every logo — is a keep-out: a mascot
 * crossing one fades to a ghost, so nothing on screen is ever hard to read.
 */
export function Mascots({ count = 14, color }: { count?: number; color: string }) {
  const layer = React.useRef<HTMLDivElement>(null);
  const scale = useStageScale();
  const scaleRef = React.useRef(scale);
  React.useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  React.useEffect(() => {
    const root = layer.current;
    if (!root) return;
    const stage = root.parentElement!;
    const els = [...root.children] as HTMLElement[];
    let seed = 11;
    const r = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const TAU = Math.PI * 2;
    const ms = els.map((el, i) => {
      const near = i / Math.max(1, els.length - 1);
      return {
        el,
        size: 56 + near * 72,
        base: 0.5 + near * 0.5,
        ax: 700 + r() * 160,
        pa: r() * TAU,
        dir: r() < 0.5 ? -1 : 1,
        ay: 300 + r() * 110,
        fb: 1 + (i % 2),
        pb: r() * TAU,
        wx: 30 + r() * 30,
        fw: 3 + (i % 3),
        pw: r() * TAU,
        bob: r() * TAU,
      };
    });
    ms.forEach((m) => {
      m.el.style.width = m.el.style.height = `${m.size}px`;
    });

    let keep: number[][] = [];
    const measure = () => {
      const s = scaleRef.current || 1;
      const o = stage.getBoundingClientRect();
      keep = [...stage.querySelectorAll("[data-tv-keep]")]
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width && b.height)
        .map((b) => [
          (b.left - o.left) / s,
          (b.top - o.top) / s,
          (b.right - o.left) / s,
          (b.bottom - o.top) / s,
        ]);
    };
    measure();
    const every = setInterval(measure, 400);

    const clear = (x: number, y: number, h: number) => {
      let d = Infinity;
      for (const [l, t, rr, b] of keep) {
        const dx = Math.max(l - h - x, 0, x - rr - h);
        const dy = Math.max(t - h - y, 0, y - b - h);
        d = Math.min(d, Math.hypot(dx, dy));
      }
      return Math.min(1, d / 60);
    };

    let raf = 0;
    const t0 = performance.now();
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const k = (t - t0) / 60_000;
      for (const m of ms) {
        const A = TAU * k * m.dir + m.pa;
        const W = TAU * m.fw * k + m.pw;
        const B = TAU * m.fb * k + m.pb;
        const x = STAGE_W / 2 + m.ax * Math.sin(A) + m.wx * Math.sin(W);
        const y = 560 + m.ay * Math.sin(B) + m.wx * 0.6 * Math.cos(W);
        const dx = m.ax * Math.cos(A) * m.dir + m.wx * Math.cos(W) * m.fw;
        const bob = Math.sin(TAU * 90 * k + m.bob) * 3;
        const c = clear(x, y, m.size / 2);
        m.el.style.opacity = String(m.base * (0.08 + 0.92 * c * c * (3 - 2 * c)));
        m.el.style.transform = `translate(${x - m.size / 2}px, ${y - m.size / 2 + bob}px) scaleX(${dx < 0 ? -1 : 1})`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(every);
    };
  }, [count]);

  const mark = TOOL_MARKS.claudecode;
  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none absolute inset-0 z-1">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 top-0"
          style={{ color, filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.9))", opacity: 0 }}
        >
          <svg
            viewBox={mark.viewBox}
            fill="currentColor"
            className="block h-full w-full"
            dangerouslySetInnerHTML={{ __html: mark.inner }}
          />
        </div>
      ))}
    </div>
  );
}

/** A slow light behind the visual side, breathing on a minute. */
export function Glow({ color, x = 1300, y = 420 }: { color: string; x?: number; y?: number }) {
  return (
    <div
      aria-hidden="true"
      className="tv-breathe pointer-events-none absolute z-0 rounded-full"
      style={{
        left: x - 700,
        top: y - 700,
        width: 1400,
        height: 1400,
        background: `radial-gradient(circle, ${color}33 0%, ${color}0d 38%, transparent 66%)`,
        filter: "blur(40px)",
      }}
    />
  );
}

export const STAGE = { W: STAGE_W, H: STAGE_H };
