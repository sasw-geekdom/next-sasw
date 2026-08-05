"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SpeakerCard } from "@/components/site/speaker-card";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { SpeakerRow } from "@/lib/admin/cms-types";

// "Who carries the current." — the homepage lineup band, fed by the CMS.
//
// Sits between the rooms and the sponsor wall so the page reads current →
// where it lands → who carries it → who powers it. Deliberately a single row
// of six rather than a third full grid: the two sections around it are already
// grids, and a band keeps this one from reading as more of the same.
//
// Renders nothing until the CMS has speakers, so it ships ahead of the lineup.

export function SpeakerLineup({
  speakers,
}: {
  /** The featured few, in admin drag order. */
  speakers: SpeakerRow[];
}) {
  const reduce = useReducedMotion();

  if (speakers.length === 0) return null;

  return (
    <section className="bg-black">
      <div className="mx-auto w-full max-w-7xl border-t border-white/10 px-6 py-24 lg:py-32">
        {/* Same header mechanics as room-flow: a grid whose source order is
            eyebrow → headline → blurb → button, so mobile stacks with the CTA
            after the copy, while from lg the explicit placement lifts it into
            the headline's row. The two homepage sections now open identically. */}
        <div className="grid gap-x-16 lg:grid-cols-[1fr_auto]">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta lg:col-start-1 lg:row-start-1">
            The lineup
          </p>

          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:col-start-1 lg:row-start-2">
            Who carries the current.
          </h2>

          <p className="mt-4 max-w-xl text-pretty text-white/60 lg:col-start-1 lg:row-start-3">
            The founders, builders, and operators taking the stage — five
            circuits, five downtown rooms.
          </p>

          <ButtonLink
            href="/speakers"
            size="md"
            className="group mt-8 justify-self-start font-display text-base font-bold uppercase tracking-tight duration-200 lg:col-start-2 lg:row-start-2 lg:mt-0 lg:h-13 lg:self-end lg:px-7 lg:text-lg"
          >
            Meet the full lineup
            <ArrowUpRight
              className={cn(
                ARROW_MOTION,
                "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:h-5 lg:w-5",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </ButtonLink>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:mt-16 lg:grid-cols-6">
          {speakers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={reduce ? undefined : { opacity: 0, y: 28 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: reduce ? 0 : i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <SpeakerCard
                speaker={s}
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
              />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
