"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Gap between the anchor and the panel's lower edge. */
const GAP = 18;
/** Keep-out from the viewport edges when the panel is clamped back inside. */
const EDGE = 12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * True once hydrated, false on the server — `createPortal` needs a `document`.
 *
 * `useSyncExternalStore` rather than the usual `useState(false)` +
 * `useEffect(() => setState(true))`: that pattern is a setState in an effect
 * body, which is a cascading render and which this repo's lint rules reject
 * (`react-hooks/set-state-in-effect`). The store never changes, so the
 * subscribe is a no-op and the two snapshots are the whole hook.
 */
const NEVER = () => () => {};
const ON_CLIENT = () => true;
const ON_SERVER = () => false;

/**
 * A link that shows the thing it points at while the cursor is on it.
 *
 * Three of these run in the schedule hero, and they exist because the hero
 * names four things it cannot show: two of them are set in their own marks
 * inside a sentence, and the third is a row of type in a list. A mark tells
 * you a brand is involved; it doesn't tell you what the room looks like or
 * who is speaking.
 *
 * ─── Why the panel is portalled ─────────────────────────────────────────────
 *
 * Two of these sit inside the hero's blurb, which is a `<p>`, and one of them
 * shows ModelFlow — a `<div>`. The HTML parser closes an open `p` the moment
 * it meets a `div`, however many spans deep it is, so the server markup and
 * the client tree would disagree about where the paragraph ended and
 * hydration would tear. Moving the panel to `document.body` takes it out of
 * the paragraph entirely. It also escapes the hero section's
 * `overflow-hidden`, which would otherwise clip a panel that opened past the
 * section's edge.
 *
 * That makes the panel `position: fixed`, so its placement is arithmetic on
 * the wrapper's rect: centred over it, above it, and clamped to the viewport.
 *
 * ─── Desktop only, twice over ───────────────────────────────────────────────
 *
 * `lg:block` keeps it off small screens, and the open only fires for
 * `pointerType === "mouse"` — a touch "hover" on iOS is the first tap of a
 * two-tap link, so a panel that opened on it would eat that tap and make the
 * link feel broken. Checking the pointer is what makes this safe on a tablet,
 * which `lg` alone doesn't cover.
 *
 * The panel takes no pointer events and is `aria-hidden`: it is a picture of
 * what the link already says in words, so to a screen reader it is noise, and
 * to the cursor it must not be a surface that can swallow the click.
 */
export function HoverPeek({
  src,
  node,
  fit = "cover",
  children,
  className,
  panelClassName,
}: {
  /** A still to reveal. Local path or an allowlisted remote host. */
  src?: string;
  /**
   * Anything that isn't a still, mounted only while the panel is open.
   *
   * Pass exactly one of this or `src`. Two of the three peeks in the hero
   * need it, and for the same reason in both cases: a hover panel is the one
   * place where "mounted" and "seen" have to be the same moment.
   *
   * A video preloads nothing and starts on the hover, so nobody downloads a
   * megabyte for a link they never touched. And ModelFlow plays its walk from
   * an IntersectionObserver that fires once and disconnects — an always-
   * mounted copy at `opacity: 0` is intersecting from first paint, so the
   * animation would run and finish while the panel was still invisible, and
   * every hover after that would show a graph that had already arrived.
   * Mounting on open makes the observer fire on open, which is what the
   * component's own trigger was always meant to mean.
   */
  node?: React.ReactNode;
  /**
   * `contain` for a cutout, `cover` for a photograph. Stills only.
   *
   * A brand mark that arrives as an RGBA cutout loses a corner to a crop; a
   * headshot has no such problem and wants the box filled.
   */
  fit?: "cover" | "contain";
  children: React.ReactNode;
  /** Must include a display — `inline-block` or `block`. */
  className?: string;
  /** The panel's box size only. Placement is computed. */
  panelClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ready = React.useSyncExternalStore(NEVER, ON_CLIENT, ON_SERVER);
  const [at, setAt] = React.useState<{ left: number; top: number } | null>(
    null,
  );
  const wrap = React.useRef<HTMLSpanElement>(null);
  const panel = React.useRef<HTMLSpanElement>(null);

  const place = React.useCallback(() => {
    const a = wrap.current?.getBoundingClientRect();
    if (!a) return;
    const box = panel.current?.getBoundingClientRect();
    const w = box?.width ?? 0;
    const h = box?.height ?? 0;
    setAt({
      left: clamp(
        a.left + a.width / 2 - w / 2,
        EDGE,
        window.innerWidth - w - EDGE,
      ),
      top: Math.max(a.top - h - GAP, EDGE),
    });
  }, []);

  // After the open, not during it: `node` mounts on open, so the panel has no
  // size to centre on until React has committed it.
  React.useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  return (
    <span
      ref={wrap}
      className={cn("relative", className)}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        setOpen(true);
      }}
      onPointerLeave={() => setOpen(false)}
      // Capture, because the focus lands on the link *inside* this wrapper.
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {children}
      {ready &&
        createPortal(
          <span
            ref={panel}
            aria-hidden="true"
            style={{ left: at?.left ?? 0, top: at?.top ?? 0 }}
            className={cn(
              // A dark panel, because of what these assets are: the brand
              // marks arrive as RGBA cutouts with black under the
              // transparency, and on a white card their antialiased edges
              // composite to a grey fringe. It is also the ground each of
              // them is drawn for.
              "pointer-events-none fixed z-50 hidden overflow-hidden rounded-xl bg-[#09090b] p-2 shadow-[0_16px_44px_-16px_rgba(0,0,0,0.45)] ring-1 ring-white/10 transition duration-200 ease-out motion-reduce:transition-none lg:block",
              // Nothing placed yet — keep it off-screen rather than flashing
              // it at the document's top-left on the first hover.
              open && at ? "opacity-100" : "invisible opacity-0",
              open ? "translate-y-0" : "translate-y-1",
              panelClassName,
            )}
          >
            {node ? (
              open && node
            ) : (
              <Image
                src={src!}
                alt=""
                fill
                sizes="380px"
                className={cn(
                  "rounded-lg",
                  fit === "contain" ? "object-contain" : "object-cover",
                )}
              />
            )}
          </span>,
          document.body,
        )}
    </span>
  );
}
