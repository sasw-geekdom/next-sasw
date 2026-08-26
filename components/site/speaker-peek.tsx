"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * A name in a running order, with the face behind it on hover.
 *
 * ─── Why this is a component and not three Tailwind classes ─────────────────
 *
 * It was those classes first, and it worked: a reserved inline slot, a portrait
 * absolutely positioned inside it, `group-hover` to fade it in. Correct, and
 * completely inert — the picture simply existed, then existed more. A flourish
 * that only changes opacity is not a flourish, it is a delay.
 *
 * So the trigger moves into React, because the two things that make this feel
 * alive both need state a stylesheet cannot hold: a spring, and the cursor's
 * position inside the name.
 *
 * ─── What it borrows, and what it does not ──────────────────────────────────
 *
 * The shape is the animated-tooltip pattern — `AnimatePresence`, a bouncy
 * spring in and out, and a tilt driven by where the pointer sits across the
 * trigger. Two changes for this page.
 *
 * The rotation is ±14°, not ±45. That pattern hangs a wide tooltip above a
 * 56px avatar, where a big angle reads as playful; here a 32px circle sits
 * beside 16px type, and at 45° it stops looking tilted and starts looking
 * broken. Same for the travel: ±10px rather than ±50, because the whole
 * element is 32px wide and anything more slides it off its own name.
 *
 * And the pointer drives the portrait rather than a card, so the gesture is
 * inverted in a way that matters — move across "Dirk Elmendorf" and his face
 * leans the way your cursor is going. It reads as the name turning to look at
 * you rather than a panel being dragged around.
 *
 * ─── What survives from the CSS version ─────────────────────────────────────
 *
 * The slot still reserves its width, so nothing reflows when the portrait
 * arrives — measured, before and after: identical positions, identical page
 * height. An inline-block with width and no content is zero-tall, so the empty
 * slot costs the line nothing either.
 *
 * It is still lifted 5px above centre, so the circle's lower edge clears the
 * role line beneath rather than grazing it. The 15px of leading under the
 * headline is the only slack in the block and this is what it is for.
 *
 * And it is still hover-only by construction. `hover:hover` keeps the slot out
 * of the layout entirely on touch, where a thing you cannot dismiss is worse
 * than a thing you never see. Keyboard users get it on focus, which is why the
 * handlers below cover focus as well as pointer.
 *
 * Reduced motion keeps the reveal and drops the theatre: no spring, no tilt,
 * no travel — the portrait fades. The face is the point; the bounce is not.
 */
export function SpeakerPeek({
  name,
  slug,
  imageUrl,
}: {
  name: string;
  slug: string;
  imageUrl?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const reduce = useReducedMotion();

  // Where the pointer sits across the name, as -1 → 1 either side of centre.
  const x = useMotionValue(0);
  const spring = { stiffness: 220, damping: 14 };
  const rotate = useSpring(useTransform(x, [-1, 1], [-14, 14]), spring);
  const shift = useSpring(useTransform(x, [-1, 1], [-10, 10]), spring);

  const track = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      const box = e.currentTarget.getBoundingClientRect();
      if (!box.width) return;
      // Clamped, because the pointer can sit a pixel outside on the way out
      // and a spring chasing 1.4 overshoots visibly at this size.
      const from = (e.clientX - box.left) / box.width;
      x.set(Math.max(-1, Math.min(1, from * 2 - 1)));
    },
    [x],
  );

  const link = (
    <Link
      href={`/speakers/${slug}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        x.set(0);
      }}
      onMouseMove={track}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className="rounded-sm underline decoration-white/25 underline-offset-4 transition-colors duration-200 hover:text-magenta hover:decoration-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
    >
      {name}
    </Link>
  );

  if (!imageUrl) return link;

  return (
    <>
      {link}
      <span className="relative ml-2.5 hidden w-8 align-middle [@media(hover:hover)]:inline-block">
        <AnimatePresence>
          {open && (
            <motion.span
              aria-hidden="true"
              // Rises and settles. `y: 14` rather than a plain fade is most of
              // the character — the portrait arrives from under the line it
              // belongs to, which is where it would have come from if it had
              // been there all along.
              initial={
                reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.5 }
              }
              animate={
                reduce
                  ? { opacity: 1 }
                  : {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 12,
                      },
                    }
              }
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.5 }}
              transition={reduce ? { duration: 0.15 } : undefined}
              style={reduce ? undefined : { rotate, translateX: shift }}
              className="pointer-events-none absolute left-0 top-1/2 block -translate-y-[calc(50%+5px)]"
            >
              <Image
                src={imageUrl}
                alt=""
                width={64}
                height={64}
                className="size-8 rounded-full object-cover object-top grayscale ring-1 ring-white/20"
              />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </>
  );
}
