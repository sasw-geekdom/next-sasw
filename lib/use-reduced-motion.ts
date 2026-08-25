"use client";

import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * One MediaQueryList for the page, created on first use.
 *
 * `useSyncExternalStore` calls its snapshot on every render, and a fresh
 * `matchMedia` per call allocates a new listener target each time to read a
 * boolean that cannot have changed in between.
 */
let mql: MediaQueryList | null = null;
const query = () => (mql ??= window.matchMedia(QUERY));

/**
 * `prefers-reduced-motion`, read without breaking hydration.
 *
 * ─── What this replaces, and why ────────────────────────────────────────────
 *
 * motion/react ships a hook of this name, and every component here used it. It
 * reads `matchMedia` and hands the result straight to `useState` *during* the
 * render: null on the server, and already `true` on the client's very first
 * render for anyone with the setting on. Anything branching on it therefore
 * produced different output on the two sides, and React reported it:
 *
 *   /                        Hydration failed — tree regenerated  (RoomFlow
 *                            drops a whole subtree under `!reduce &&`)
 *   /schedule                attribute mismatch  (PysaBand's <video autoPlay>)
 *   /schedule/pysanantonio   attribute mismatch  (same)
 *   /schedule/the-rand       attribute mismatch  (session-bento's cards)
 *   /speakers                attribute mismatch  (SpeakerWall's initial style)
 *
 * All of it invisible in normal use, which is why it lasted: turn the setting
 * off and every page is clean. Turn it on — a setting people who need it leave
 * on permanently — and the home page threw away its server HTML and rebuilt
 * the tree on the client, which is the one thing SSR exists to avoid.
 *
 * The branches themselves were right. Only the timing was wrong.
 *
 * ─── Why `useSyncExternalStore` ─────────────────────────────────────────────
 *
 * It is the primitive for exactly this shape: React takes the server snapshot
 * — false — for the hydration render, so the first client pass always agrees
 * with the HTML, and only then re-renders with the real value. Reduced motion
 * costs one frame of the un-reduced treatment; a mismatch costs a re-render of
 * the whole tree.
 *
 * It also subscribes, so someone changing the setting mid-visit is followed.
 * The motion hook never did — there is a TODO in its source wondering whether
 * anyone misses it.
 *
 * A `mounted` flag set from an effect does the same job and was written first.
 * It trips `react-hooks/set-state-in-effect`, and the rule is right: this is a
 * subscription, not a state machine.
 *
 * ─── Reading it ─────────────────────────────────────────────────────────────
 *
 * `false` on the server and for the first client render, then the truth. Do
 * not treat the first value as "unknown" and hold rendering for it — that
 * trades one frame of motion for a blank frame, and the whole point of the
 * server snapshot is that it is a safe default rather than a placeholder.
 *
 * Returns `boolean`, where the motion hook returned `boolean | null`. Call
 * sites that only ever asked `reduce ? a : b` are unaffected.
 */
export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const m = query();
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => query().matches,
    () => false,
  );
}
