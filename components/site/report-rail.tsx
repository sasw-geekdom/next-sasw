"use client";

import * as React from "react";
import { trackEvent } from "@/lib/analytics/track";
import { SECTIONS, type SectionId } from "@/lib/sponsor-report";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The sponsor report's progress rail, and its reading measurement — both are
 * "which section is the reader in", so one observer answers both.
 *
 * The rail is the site's own device: the room-flow pips, one per section,
 * strung on a hairline down the left edge like stops on a circuit. Charge
 * says where the reader is — the current section full magenta with the pip's
 * glow, the ones already read half charged, the ones ahead faint — and a
 * hover or focus names the stop with the room-flow chip, in the section's
 * own eyebrow words. Over the two pink sections the pips go black, as the PDF
 * button does, since magenta on magenta is nothing.
 *
 * Left, so it never meets the PDF button in the bottom-right corner; off the
 * cover, like that button; and only from 1400px, the first width with a real
 * margin beside the copy — any narrower and a stop would sit on the text.
 *
 * The links are in-page anchors, so following one never takes the reader off
 * the report; each section also answers to its own URL (/sponsor-report#press)
 * for pointing a sponsor straight at it.
 *
 * Measurement goes to GA: a view, and each section the first time it is
 * reached. A link sent as /sponsor-report?for=nopalera tags both with the
 * sponsor, which is how Geekdom can tell who opened theirs and how far they
 * read. Nothing on the page changes for it.
 */
export function ReportRail() {
  const [active, setActive] = React.useState<SectionId | null>(null);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const sponsor = new URLSearchParams(window.location.search).get("for") ?? undefined;
    trackEvent("report_view", { sponsor });

    const seen = new Set<string>();
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    // A line across the middle of the viewport: whichever section it crosses
    // is the one being read.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id as SectionId;
          setActive(id);
          if (!seen.has(id)) {
            seen.add(id);
            trackEvent("report_section", { section: id, sponsor });
          }
        }
        // Back above the first section means back on the cover.
        if (els[0] && els[0].getBoundingClientRect().top > window.innerHeight / 2) setActive(null);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const at = active ? SECTIONS.findIndex((s) => s.id === active) : -1;
  // The rail sits at the middle of the screen, which is exactly the line the
  // observer reads — so the active section is the ground under the pips.
  const onPink = active === "circuits" || active === "thank-you";

  return (
    <nav
      aria-label="Sponsor report sections"
      className={cn(
        "fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-300 min-[1400px]:block print:hidden",
        active ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ol className="relative flex flex-col gap-1.5">
        {/* The circuit the stops hang on. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-2.5 left-1/2 w-px -translate-x-1/2 transition-colors duration-300",
            onPink ? "bg-black/20" : "bg-magenta/20",
          )}
        />
        {SECTIONS.map((s, i) => {
          const current = s.id === active;
          return (
            <li key={s.id} className="relative">
              <a
                href={`#${s.id}`}
                aria-current={current ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(s.id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
                  history.replaceState(null, "", `#${s.id}`);
                }}
                className={cn(
                  "group grid size-5 place-items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2",
                  onPink ? "focus-visible:ring-black" : "focus-visible:ring-magenta",
                  current
                    ? onPink
                      ? "text-black"
                      : "text-magenta"
                    : i < at
                      ? onPink
                        ? "text-black/55"
                        : "text-magenta/60"
                      : onPink
                        ? "text-black/25"
                        : "text-magenta/30",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "rounded-full bg-current transition-all duration-300",
                    current ? "size-2 shadow-[0_0_8px_currentColor]" : "size-1.5 group-hover:size-2",
                  )}
                />
                <span className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-full border border-magenta/35 bg-black px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-magenta opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
