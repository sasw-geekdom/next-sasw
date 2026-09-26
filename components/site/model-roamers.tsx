"use client";

import * as React from "react";
import { TOOL_MARKS } from "@/lib/tool-marks";
import { useReducedMotion } from "@/lib/use-reduced-motion";

// The Claude Code mascots, loose across The Model's band — the band's main
// visual, in place of the node graph it used to carry. The same walk the TV
// loops use (components/tv/tv-kit.tsx), sized to the section.
//
// ── A change to the house rule, on purpose ──────────────────────────────────
//
// model-mascots.tsx states that nothing in this hero moves until somebody
// clicks. That was right while the node graph was the visual and the mascots
// were its easter egg. Here they *are* the visual, so they walk on their own —
// and keep the rule's reasons in other ways:
//
//   · Reduced motion gets them standing still, placed where the walk starts.
//   · Off screen they stop: the loop only runs while the band is in view.
//   · They never cost the copy: a mascot passing behind a line of text or a
//     button fades out entirely (every direct child of `[data-roam-keep]` is a
//     keep-out), and the layer sits under the copy with pointer events off,
//     so nothing they cross is harder to read or to click.
//
// Each walks a closed Lissajous path — whole-number frequencies over a minute —
// faces the way it's heading, and bobs as it goes.

const LOOP_MS = 60_000;
const TAU = Math.PI * 2;

interface Walker {
  el: HTMLDivElement;
  near: number;
  pa: number;
  dir: number;
  fb: number;
  pb: number;
  fw: number;
  pw: number;
  bob: number;
  kx: number;
  ky: number;
  kw: number;
}

export function ModelRoamers({
  color,
  count = 14,
}: {
  color: string;
  count?: number;
}) {
  const layer = React.useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  React.useEffect(() => {
    const root = layer.current;
    const band = root?.parentElement;
    if (!root || !band) return;

    let seed = 11;
    const r = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const glow = root.querySelector<HTMLDivElement>("[data-glow]");
    const els = [...root.querySelectorAll<HTMLDivElement>("[data-walker]")];
    const walkers: Walker[] = els.map((el, i) => ({
      el,
      near: i / Math.max(1, els.length - 1),
      kx: 0.36 + r() * 0.08, // ± this share of the field's width
      pa: r() * TAU,
      dir: r() < 0.5 ? -1 : 1,
      ky: 0.28 + r() * 0.1,
      fb: 1 + (i % 2),
      pb: r() * TAU,
      kw: 0.016 + r() * 0.016,
      fw: 3 + (i % 3),
      pw: r() * TAU,
      bob: r() * TAU,
    }));

    let w = 0;
    let keep: number[][] = [];
    // The ground they walk. From laptop width up it is the open side of the
    // band, right of the copy column — the TV loop's hero gives them the
    // same, and that is what makes it read as full: every mascot is in view,
    // at the TV's scale for that height, instead of half of them spread
    // behind the copy. Where the copy spans the band (a phone), the whole
    // band is theirs and the keep-outs do the work.
    const field = { x0: 0, x1: 0, y0: 0, y1: 0, side: false };
    const measure = () => {
      const box = band.getBoundingClientRect();
      w = box.width;
      keep = [...band.querySelectorAll("[data-roam-keep] > *")]
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width && b.height)
        .map((b) => [b.left - box.left, b.top - box.top, b.right - box.left, b.bottom - box.top]);
      const copyRight = Math.max(0, ...keep.map((b) => b[2]));
      field.side = copyRight > 0 && copyRight < w * 0.62;
      // Below that, the open block the band leaves between its tagline and
      // its details (`data-roam-field`) — a small stage of their own on a
      // phone, rather than a whole band where most of them are behind copy.
      const open = band.querySelector("[data-roam-field]")?.getBoundingClientRect();
      const stage = !field.side && open && open.height > 0 ? open : null;
      field.x0 = field.side ? copyRight + 48 : stage ? stage.left - box.left : 0;
      field.x1 = field.side ? w - 24 : stage ? stage.right - box.left : w;
      field.y0 = field.side ? 24 : stage ? stage.top - box.top : 0;
      field.y1 = field.side ? box.height - 24 : stage ? stage.bottom - box.top : box.height;
    };

    // 0 inside a keep-out (padded by the mascot's half-size), 1 at 48px clear.
    const clear = (x: number, y: number, half: number) => {
      let d = Infinity;
      for (const [l, t, rr, b] of keep) {
        const dx = Math.max(l - half - x, 0, x - rr - half);
        const dy = Math.max(t - half - y, 0, y - b - half);
        d = Math.min(d, Math.hypot(dx, dy));
      }
      return Math.min(1, d / 48);
    };

    const draw = (ms: number) => {
      const k = ms / LOOP_MS;
      const fw = field.x1 - field.x0;
      const fh = field.y1 - field.y0;
      const cx = field.x0 + fw / 2;
      const cy = field.y0 + fh / 2;
      // The TV's 56–128px, which it draws on a 1080-tall stage: scaled by the
      // field's height beside the copy (a MacBook's band lands near 0.8, a
      // large monitor's a little over 1), by the width on a phone.
      const scale = field.side
        ? Math.min(1.15, Math.max(0.6, fh / 1080))
        : Math.min(1, Math.max(0.4, w / 1920));
      if (glow) {
        const g = Math.sin(TAU * k);
        const d = Math.max(fw, fh) * 1.1;
        glow.style.width = glow.style.height = `${d}px`;
        glow.style.transform = `translate(${cx - d / 2 + g * 40}px, ${cy - d / 2 - g * 24}px) scale(${1 + g * 0.04})`;
      }
      for (const m of walkers) {
        const size = (56 + m.near * 72) * scale;
        const A = TAU * k * m.dir + m.pa;
        const W = TAU * m.fw * k + m.pw;
        const B = TAU * m.fb * k + m.pb;
        // Amplitudes are fractions of the field, so the paths reach its
        // edges at any size: across ±0.36–0.44 of its width, ±0.28–0.38 of
        // its height, as on the TV stage.
        const x = cx + fw * m.kx * Math.sin(A) + fw * m.kw * Math.sin(W);
        const y = cy + fh * m.ky * Math.sin(B) + fw * m.kw * 0.6 * Math.cos(W);
        const dx = Math.cos(A) * m.dir + m.kw * Math.cos(W) * m.fw;
        const bob = still ? 0 : Math.sin(TAU * 90 * k + m.bob) * 3;
        const c = clear(x, y, size / 2);
        const base = 0.5 + m.near * 0.5;
        m.el.style.width = m.el.style.height = `${size}px`;
        // All the way out behind copy, not to a ghost: at a few percent,
        // lavender over black reads as a grey smudge rather than a fade.
        const e = c * c * (3 - 2 * c);
        m.el.style.opacity = String(base * e * e);
        m.el.style.transform = `translate(${x - size / 2}px, ${y - size / 2 + bob}px) scaleX(${dx < 0 ? -1 : 1})`;
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(band);
    // Copy can reflow without the band resizing (fonts landing, a logo
    // loading), so the keep-outs are re-read on a slow beat as well.
    const every = setInterval(measure, 1000);

    if (still) {
      draw(0);
      return () => {
        ro.disconnect();
        clearInterval(every);
      };
    }

    let raf = 0;
    let visible = false;
    const t0 = performance.now();
    const frame = (t: number) => {
      draw(t - t0);
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible) {
        visible = true;
        raf = requestAnimationFrame(frame);
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(band);
    draw(0);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      clearInterval(every);
    };
  }, [still]);

  const mark = TOOL_MARKS.claudecode;
  return (
    <div
      ref={layer}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {/* The TV loop's lavender light behind the field, breathing on the
          walk's own minute. */}
      <div
        data-glow
        className="absolute left-0 top-0 rounded-full blur-[40px]"
        style={{
          background: `radial-gradient(circle, ${color}38 0%, rgba(0,180,252,0.06) 38%, transparent 66%)`,
        }}
      />
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          data-walker
          className="absolute left-0 top-0 drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)]"
          // Hidden until the first placement, so nothing flashes at the
          // layer's top-left corner before the effect runs.
          style={{ color, opacity: 0 }}
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
