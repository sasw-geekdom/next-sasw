"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { trackReport } from "@/lib/analytics/track";
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
 * Below that, SectionBar does the same job along the top.
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
    trackReport("report_view", { sponsor });

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
            trackReport("report_section", { section: id, sponsor });
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

  const go = (id: SectionId) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <SectionBar active={active} go={go} />
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
                    go(s.id);
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
    </>
  );
}

/**
 * The rail's counterpart below 1400px, where there's no margin for one: a
 * slim bar along the top, there once the reader is past the cover. It names
 * the section being read in its eyebrow words, opens a list of every section
 * to jump to, and runs a magenta line along its foot as far as the reader
 * has got. Top rather than bottom, so it never meets the PDF button.
 */
function SectionBar({ active, go }: { active: SectionId | null; go: (id: SectionId) => void }) {
  const [open, setOpen] = React.useState(false);
  const line = React.useRef<HTMLSpanElement>(null);
  const bar = React.useRef<HTMLDivElement>(null);
  const at = active ? SECTIONS.findIndex((s) => s.id === active) : -1;
  const shown = active !== null || open;

  // Reading progress, written straight to the line's transform each frame —
  // a re-render per scroll frame would be waste for one bar.
  React.useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (line.current) line.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Escape or a tap outside closes the list.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={bar}
      className={cn(
        "fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-black/85 text-white backdrop-blur transition-transform duration-300 min-[1400px]:hidden print:hidden",
        shown ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <div className="flex h-11 items-center justify-between gap-4 px-4 sm:px-6">
        <p className="truncate font-mono text-[11px] uppercase tracking-widest text-magenta">
          {at >= 0 ? SECTIONS[at].label : ""}
        </p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="report-sections"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] uppercase tracking-widest text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
        >
          Sections
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </div>
      <span aria-hidden="true" ref={line} className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-magenta" />

      {open && (
        <nav id="report-sections" aria-label="Sponsor report sections" className="border-t border-white/10 bg-black/95">
          <ol className="max-h-[70dvh] overflow-y-auto py-2">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={s.id === active ? "location" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpen(false);
                    go(s.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-magenta sm:px-6",
                    s.id === active ? "text-magenta" : "text-white/70 hover:text-white",
                  )}
                >
                  {/* The rail's pips, at the same charges. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 shrink-0 rounded-full bg-current",
                      s.id === active ? "text-magenta" : i < at ? "text-magenta/60" : "text-magenta/30",
                    )}
                  />
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
