"use client";

import * as React from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { ArrowUpRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { OrganizerLogo } from "@/components/site/organizer-logo";
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
      // `loop`, and nothing else. The file is exactly the loop now, so there
      // is no window to hold and no seek to make.
      //
      // What used to be here: a `timeupdate` handler seeking back to 1.3s.
      // That cost /schedule 20.3MB in fifteen seconds, because the reel's
      // moov atom sat after 7MB of mdat and every seek sent the browser
      // hunting the end for the index. Trimming and remuxing removed the
      // reason for the seek and the penalty for it at once.
      loop
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

export function PysaBand({
  detailHref,
  actions,
  masthead = false,
}: {
  detailHref?: string;
  /**
   * Rendered in the same slot `detailHref` uses, for the band's own page —
   * where there is no "full event details" to link to and the slot would
   * otherwise sit empty.
   *
   * It isn't decoration. The mascot column is taller than the copy, so an
   * empty slot left ~140px of dead black under "Activated by" and pushed the
   * register button to y=692 — off the bottom of a MacBook Air once the
   * browser's own chrome is counted. Putting the actions here fills the gap
   * and lifts them by that much.
   */
  actions?: React.ReactNode;
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
    <section
      className={cn(
        "relative overflow-hidden bg-black",
        // As a masthead this is the page's hero and owes the same
        // full-viewport measure the other heroes use (hero-shell, form-page,
        // the type-led activation hero). Without it the band was a flat 710px
        // on every display, which reads as deliberate on a laptop and left
        // 600px of footer above the fold on a 1440px-tall monitor. It also
        // gives the clip room: at 2560 the clip is 1059px tall and the fixed
        // section was cutting 349px off its bottom.
        //
        // Not applied when the band is a mid-page section on /sessions, where
        // a full-viewport block would shove everything after it off-screen.
        masthead && "flex min-h-[calc(100vh-4rem)] flex-col justify-center",
        // And as a mid-page band too, but only where there is screen for it.
        // Content-height is right on a laptop; on an external monitor it left
        // this band sharing the screen with the one above and the one below,
        // so whichever activation you came to read arrived framed by its
        // competitors. `roomy` is defined in globals.css and gated on viewport
        // height, which is the real constraint — see the note there.
        !masthead &&
          "roomy:flex roomy:min-h-[calc(100vh-4rem)] roomy:flex-col roomy:justify-center",
      )}
    >
      {/* Blue bloom behind the clip. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-1/4 hidden h-140 w-140 rounded-full opacity-30 blur-[120px] sm:block"
        style={{
          background: `radial-gradient(circle, ${PYSA_BLUE} 0%, transparent 65%)`,
        }}
      />

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

      {/* The clip hangs from the top of this wrapper rather than being centred
          on the section.

          Two bugs, one cause. Centred on the section it moved whenever
          anything below changed height — folding the register button into the
          band grew the copy by ~140px and dragged the clip down 70px.
          Re-centring it on this wrapper then overcorrected: the wrapper is
          shorter than the clip, so half the overflow went off the top of the
          section, and `overflow-hidden` took the mascot's hat with it.

          Anchored at the top, the clip is never clipped from above and never
          moves for anything below. It lands within ~14px of where it sat
          before any of this, and it can only overflow downward, where the
          section has room.
          Centred on the section, it moved whenever anything below it changed
          height — folding the register button and calendar menu into the band
          grew the copy column by ~140px and dragged the clip down 70px with
          it. Anchored here, it stays level with the wordmark and the
          organisers it belongs to, and whatever follows can grow freely.

          Full-bleed on purpose: `right-0` has to mean the section's edge, so
          this cannot live inside the `max-w-7xl` container. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden aspect-1114/720 w-[78%] select-none sm:block lg:w-[64%]"
        >
          <MascotClip
            reduce={reduce}
            className="h-full w-full object-cover"
            style={{ maskImage: VIDEO_MASK, WebkitMaskImage: VIDEO_MASK }}
          />
        </div>

        <div
          className={cn(
            "relative z-20 mx-auto w-full max-w-7xl px-6",
            masthead ? "pt-8 lg:pt-10" : "pt-16 lg:pt-28",
            // No bottom padding when actions follow — they bring their own,
            // and the band would otherwise carry two floors.
            actions ? "pb-0" : "pb-16 lg:pb-28",
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
            </h2>

            {/* The clip on mobile, where there's no room for it beside the copy. */}
            <MascotClip
              reduce={reduce}
              className="-mx-6 mt-6 aspect-1114/720 w-auto object-cover sm:hidden"
              style={{ maskImage: MOBILE_MASK, WebkitMaskImage: MOBILE_MASK }}
            />

            <p className="mt-6 max-w-xl text-pretty text-lg text-white/70">
              San Antonio&rsquo;s Python conference is back for a second year —
              an afternoon of learning, networking, and community building with
              the people already doing the work here.
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

            {/* Powered by — the orgs actually running it, credited in the band
              rather than folded into SASTW's own partner wall, because they're
              hosting this one event, not the week.

              "Activated by" until now, which was nobody's word but this band's:
              Access Granted and The Model both say "Powered by", and so does
              the homepage's own wall. Three labels for one idea on one page is
              three things a reader has to reconcile. */}
            <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-10">
              <p className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-white/55">
                Powered by
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
              // mt-14, not mt-10: the organisers above are a row of logos with
              // their own optical weight, and 40px read as the button
              // belonging to that row rather than being the way out of the
              // band.
              // Full width below sm, matching Access Granted and The Model. On a
              // phone this was a ~190px pill sitting alone under a full-width
              // column while the other two bands' buttons spanned it — the
              // odd one out in a stack of three that are otherwise identical.
              <div className="mt-14">
                <ButtonLink
                  href={detailHref}
                  size="md"
                  className="group w-full justify-center bg-white/10 text-white duration-200 hover:bg-white/20 sm:w-auto"
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
      </div>

      {actions && (
        <div className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-20 pt-10 lg:pb-28">
          <div className="max-w-xl xl:max-w-2xl">{actions}</div>
        </div>
      )}
    </section>
  );
}
