// Client-safe Tailwind motion fragments.

/**
 * The arrow that rides a CTA or a "door" link out of a section.
 *
 * Two values, both deliberate. Travel stays small relative to the glyph
 * (~2px on a 20px arrow) because a large step reads as a twitch rather than a
 * drift, and the curve is symmetric because `ease-out` front-loads the
 * movement so it lands almost instantly and then coasts — which is the jump.
 *
 * Pair with a `group` on the link, a size on the icon, and the translate for
 * whichever direction the glyph points. Callers override `duration` when they
 * sit inside a button: `buttonClass` ships a bare `transition-colors` that
 * falls back to Tailwind's 150ms, and against 300ms here the background
 * finishes first while the arrow carries on — one hover reading as two events.
 */
export const ARROW_MOTION =
  "transition-[transform,color] duration-300 ease-in-out motion-reduce:transition-none";
