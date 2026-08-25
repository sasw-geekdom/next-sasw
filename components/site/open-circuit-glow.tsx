/**
 * A charge behind Open Circuit's lockup. One soft magenta bloom, and nothing
 * else.
 *
 * The mark is a bolt over a fan of circuit traces, and on flat black it was
 * the one thing in this hero that looked unplugged. This lights it from
 * behind, the way a powered board lights its own case.
 *
 * ─── What this deliberately is not ──────────────────────────────────────────
 *
 * Two richer versions were built and both were rejected, and the reasons are
 * worth keeping because both are the obvious thing to reach for again.
 *
 * A field of circuit traces with current running along them — 45° routing,
 * pads, a travelling pulse per trace. It failed on the artwork, not the code:
 * the mark already contains circuit traces, so drawing more around it left two
 * sets at slightly different weights and scales, and the eye reads that as the
 * logo being blurred rather than as a board. A mark that already says a thing
 * does not want a background that says it again, louder.
 *
 * A spotlight tracking the cursor, in the manner of Access Granted's cipher
 * field. That one works there because the ciphertext is invisible until a
 * cursor uncovers it — the spotlight *is* the content. Here there was nothing
 * underneath to uncover, so it was a bright circle chasing the pointer over
 * artwork that was already fully visible.
 *
 * ─── What is left, and why it is enough ─────────────────────────────────────
 *
 * The bloom breathes, so the mark is alive before anyone touches it, and lifts
 * when a pointer crosses it, so it answers when they do. Both are ambient:
 * nothing tracks a cursor, nothing has a hard edge, and the effect has no
 * position of its own to be distracted by. It is also the whole of the file —
 * no client component, no state, no JavaScript at all. The hover comes from a
 * `group` on the lockup's wrapper, which means it works before hydration and
 * costs nothing after it.
 *
 * The breathe is a scale animation rather than an opacity one specifically so
 * the two can coexist: an animation on `opacity` beats a transition on the
 * same property, and the earlier cut of this lost its hover response that way
 * without failing anywhere visible.
 */

/** Brand magenta as an rgb triple, so the bloom can set its own alpha. */
const RGB = "255, 50, 160";

/**
 * How far the light reaches past the lockup.
 *
 * Percentages of the mark's box rather than pixels, so it scales with the mark
 * at every breakpoint instead of swamping it on a phone. Wider than it is
 * tall: sideways there is only empty hero to spill into, while 30px below the
 * mark the blurb starts, and a bloom that reached as far down as it does
 * across sat behind every line of the copy.
 */
const BLEED = "-inset-x-[38%] -inset-y-[34%]";

/**
 * Centred a little above the middle, because the mark is not evenly weighted:
 * the bolt is the bright part and it sits in the upper half, with the wordmark
 * beneath it. Lighting the geometric centre puts the hottest part of the glow
 * behind the type, which is the half that needs the least help.
 */
const BLOOM = `radial-gradient(52% 46% at 50% 40%, rgba(${RGB},0.34), rgba(${RGB},0.12) 46%, transparent 72%)`;

export function OpenCircuitGlow() {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${BLEED} opacity-80 transition-opacity duration-700 ease-out group-hover/mark:opacity-100`}
    >
      <div className="oc-bloom h-full w-full" style={{ background: BLOOM }} />
    </div>
  );
}
