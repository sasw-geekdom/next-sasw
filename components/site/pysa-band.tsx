"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { ProbeChip, useProbeChip } from "@/components/site/probe-chip";
import { ButtonLink } from "@/components/ui/button";
import { ARROW_MOTION } from "@/lib/motion";
import { PYSA, PYSA_BLUE, PYSA_ORGANIZERS } from "@/lib/pysa";
import { cn } from "@/lib/utils";

// PySanAntonio II — adapted from the DEVSA site's own hero
// (devsanantonio/next-devsa, components/pysa/2026/hero.tsx) so the event looks
// like itself here rather than like a SASTW card wearing its name.
//
// What carried over: the ink ground, the blue accent, the mascot clip masked
// out to the left so the copy sits on solid colour, and the date/time/place
// row. What didn't: their button styles, `page-shell`, and the CFS phase
// logic, none of which exist here — the CTA is SASTW's and the band sits in
// this page's container.

// Reveal the clip from the right so it dissolves under the copy instead of
// ending on a hard edge.
const VIDEO_MASK =
  "linear-gradient(to right, transparent 0%, black 22%, black 100%)";
const MOBILE_MASK =
  "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)";

function MascotClip({
  className,
  style,
  reduce,
}: {
  className?: string;
  style?: React.CSSProperties;
  reduce: boolean | null;
}) {
  return (
    <video
      src={PYSA.video}
      poster={PYSA.mascotStill}
      autoPlay={!reduce}
      muted
      playsInline
      preload="metadata"
      aria-hidden="true"
      // `object-top`, because the poster and the clip are different shapes.
      //
      // The mp4 is 1114×720 and every box it sits in is `aspect-1114/720`, so
      // `object-cover` crops the video by nothing at all and this has no
      // effect on it. The poster is 1842×2304 — portrait — and covering it
      // into a landscape box throws away 558px of height. Centred, that took
      // the top and bottom evenly and cut the mascot's head off, which is
      // what showed before the video arrived and on reduced-motion, where
      // the poster is all there is.
      //
      // Anchoring to the top keeps the head and drops the empty floor
      // instead. If the clip is ever re-encoded at a different ratio this
      // becomes load-bearing for the video too — check both then.
      className={`${className ?? ""} object-top`.trim()}
      // The source is a longer reel; hold the window the DEVSA site uses.
      onLoadedMetadata={(e) => {
        e.currentTarget.currentTime = PYSA.clip.start;
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (v.currentTime >= PYSA.clip.end) v.currentTime = PYSA.clip.start;
      }}
      style={style}
    />
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: PYSA_BLUE }}
        aria-hidden="true"
      />
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Same probe readout the sponsor wall uses — the cursor names what it's over.
// Safe to use here because the band already clips its own overflow; the chip
// is `whitespace-nowrap` and would otherwise reach past a narrow cell.
function OrganizerLogo({
  org,
}: {
  org: (typeof PYSA_ORGANIZERS)[number];
}) {
  const { chipRef, probeProps } = useProbeChip();

  return (
    <a
      href={org.href}
      target="_blank"
      rel="noreferrer"
      {...probeProps}
      className="group relative block opacity-85 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={org.logo}
        alt={org.name}
        className={cn("w-auto object-contain", org.heightClass)}
      />
      <ProbeChip chipRef={chipRef}>{org.name}</ProbeChip>
    </a>
  );
}

export function PysaBand({
  detailHref,
  masthead = false,
}: {
  detailHref?: string;
  /**
   * Opens a page rather than sitting between sections. Trims the top padding:
   * as a band it needs air above to separate it from what precedes it, but as
   * a masthead the only thing above is a back link, and the full `lg:pt-28`
   * pushed the credits off the bottom of a 13" laptop.
   */
  masthead?: boolean;
} = {}) {
  const reduce = useReducedMotion();

  return (
    // Site black, not PySA's own ink. The band used to ground itself on
    // #0a0a0a, which put a second near-black on a site whose sections are
    // otherwise pure black — close enough to read as an inconsistency rather
    // than a choice. PySA's palette still carries the band through PYSA_BLUE
    // (the bloom, the wordmark accents); only the floor is shared now.
    <section className="relative overflow-hidden bg-black">
      {/* Blue bloom behind the clip. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/4 hidden h-140 w-140 rounded-full opacity-30 blur-[120px] sm:block"
        style={{
          background: `radial-gradient(circle, ${PYSA_BLUE} 0%, transparent 65%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 hidden aspect-1114/720 w-[78%] -translate-y-1/2 select-none sm:block lg:w-[64%]"
      >
        <MascotClip
          reduce={reduce}
          className="h-full w-full object-cover"
          style={{ maskImage: VIDEO_MASK, WebkitMaskImage: VIDEO_MASK }}
        />
      </div>

      {/* Two scrims: one laying the copy side down over the clip, one settling
          the band into the black sections above and below it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.9) 32%, rgba(10,10,10,0.35) 58%, rgba(10,10,10,0) 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-black/70 via-transparent to-black/70"
      />

      <div
        className={cn(
          "relative z-20 mx-auto w-full max-w-7xl px-6 pb-20 lg:pb-28",
          masthead ? "pt-8 lg:pt-10" : "pt-20 lg:pt-28",
        )}
      >
        <div className="max-w-xl xl:max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/55">
            The Rand · Tech &amp; Builders
          </p>

          <h2 className="mt-4 flex flex-col items-start gap-2">
            {/* The wordmark is the title — the alt carries the name for
                anything that can't render it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PYSA.wordmark}
              alt="PySanAntonio II"
              width={PYSA.wordmarkWidth}
              height={PYSA.wordmarkHeight}
              className="h-auto w-full max-w-104 lg:max-w-lg"
            />
            <span
              className="font-display text-2xl font-bold uppercase tracking-tight sm:text-3xl"
              style={{ color: PYSA_BLUE }}
            >
              Returns October 2026
            </span>
          </h2>

          {/* The clip on mobile, where there's no room for it beside the copy. */}
          <MascotClip
            reduce={reduce}
            className="-mx-6 mt-6 aspect-1114/720 w-auto object-cover sm:hidden"
            style={{ maskImage: MOBILE_MASK, WebkitMaskImage: MOBILE_MASK }}
          />

          <p className="mt-6 max-w-xl text-pretty text-lg text-white/70">
            San Antonio&rsquo;s Python conference is back for a second year — an
            afternoon of learning, networking, and community building with the
            people already doing the work here.
          </p>

          <dl className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-white/55">
            <Detail icon={CalendarDays} label="Date">
              {PYSA.dateLabel}
            </Detail>
            <Detail icon={Clock} label="Time">
              {PYSA.timeLabel}
            </Detail>
            <Detail icon={MapPin} label="Location">
              {PYSA.venue}, {PYSA.venueDetail}
            </Detail>
          </dl>

          {/* Activated by — the orgs actually running it, credited in the band
              rather than folded into SASTW's own partner wall, because they're
              hosting this one event, not the week. */}
          <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
            <p className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/55">
              Activated by
            </p>
            <ul className="flex flex-wrap items-center gap-x-8 gap-y-5">
              {PYSA_ORGANIZERS.map((org) => (
                <li key={org.name}>
                  <OrganizerLogo org={org} />
                </li>
              ))}
            </ul>
          </div>

          {/* After the credits, not before: the band reads name -> what ->
              when -> who runs it, and the way in belongs at the end of that,
              not interrupting it. Only when the band is a teaser — omitted on
              PySanAntonio's own page, where it would link to the page you are
              already on. */}
          {detailHref && (
            <div className="mt-10">
              <ButtonLink
                href={detailHref}
                size="md"
                className="group bg-white/10 text-white duration-200 hover:bg-white/20"
              >
                Full event details
                <ArrowUpRight
                  className={cn(
                    ARROW_MOTION,
                    "h-4 w-4 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  )}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
