"use client";

import * as React from "react";
import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

// The sponsor report's motion: numbers that count up and bars that fill as
// they come into view. Motion only — the server renders every figure and bar
// at its final value, so the data is right before any script runs, and a
// reader who has asked for reduced motion is left with exactly that.

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Split a figure into what counts and what doesn't: "$110,000" is "$" +
 * 110000 + "", "~45,000" is "~" + 45000, "70.8K" is 70.8 + "K", "1,638+" is
 * 1638 + "+". Whatever the report wrote is what comes back at the end.
 */
function parse(value: string) {
  const m = value.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, digits, suffix] = m;
  return {
    prefix,
    suffix,
    target: Number(digits.replace(/,/g, "")),
    decimals: digits.split(".")[1]?.length ?? 0,
    grouped: digits.includes(","),
  };
}

/**
 * A figure that counts up from zero the first time it comes into view.
 *
 * The final figure holds the space. It is laid out invisibly, and the count
 * runs on top of it in the same grid cell, so the box is the width of
 * "~45,000" from the first frame. Without that, a count that starts as "~0"
 * and gains a digit and a comma on its way up pushed everything after it —
 * "unique touches" in the reach callout — sideways every frame, which read
 * as the line bouncing and blurring rather than counting. The invisible copy
 * is also the one a screen reader gets; the moving one is hidden from it.
 *
 * Reserved for headline figures. A table of small numbers all ticking at
 * once is noise, so those stay still.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const parts = React.useMemo(() => parse(value), [value]);
  const ref = React.useRef<HTMLSpanElement>(null);
  // Starts as soon as the figure is on screen: waiting for most of it to be
  // in view left a "0%" sitting there long enough to look broken.
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduce = useReducedMotion();
  const n = useMotionValue(parts?.target ?? 0);
  const text = useTransform(n, (v) =>
    parts
      ? parts.prefix +
        v.toLocaleString("en-US", {
          minimumFractionDigits: parts.decimals,
          maximumFractionDigits: parts.decimals,
          useGrouping: parts.grouped,
        }) +
        parts.suffix
      : value,
  );

  React.useEffect(() => {
    if (!parts) return;
    if (reduce) {
      n.set(parts.target);
      return;
    }
    if (!inView) {
      // Armed at zero below the fold, so the count is there to watch.
      n.set(0);
      return;
    }
    const run = animate(n, parts.target, { duration: 1, ease: EASE });
    return () => run.stop();
  }, [inView, reduce, parts, n]);

  if (!parts) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={cn("inline-grid justify-items-start tabular-nums", className)}>
      <span className="col-start-1 row-start-1 opacity-0">{value}</span>
      <motion.span aria-hidden="true" className="col-start-1 row-start-1">
        {text}
      </motion.span>
    </span>
  );
}

/**
 * A bar that grows from its left edge to its width the first time it is seen.
 * `width` is the bar's final length; the fill is a transform, so nothing
 * around it reflows while it runs.
 */
export function GrowBar({
  width,
  className,
  delay = 0,
  children,
}: {
  width: string;
  className?: string;
  delay?: number;
  /** Segments, for a bar made of parts — the NPS split sweeps in whole. */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn("h-full origin-left", className)}
      style={{ width }}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
