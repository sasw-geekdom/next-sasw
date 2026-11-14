"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { trackReport } from "@/lib/analytics/track";
import { REPORT_PDF } from "@/lib/sponsor-report";
import { cn } from "@/lib/utils";

/** How far past the cover counts as past it: its bottom above this share of the viewport. */
const PAST_COVER = 0.25;
/** A stop this long in the scroll brings the button back. */
const IDLE_MS = 600;
/** Scroll movement smaller than this is jitter (trackpad settle), not a direction. */
const JITTER = 4;

/**
 * The report's "Save as PDF": a download of the designed PDF, not the
 * browser's print dialog. That file is laid out as real pages from
 * /sponsor-report/print and saved by `pnpm report:pdf`, so every sponsor
 * gets the same on-brand document — where printing the page gave each
 * browser's own breaks and margins. A download, so it works on a phone too,
 * and the reader never leaves the report. Each one is logged to GA.
 *
 * It floats, but only when it is likely wanted. Off the cover, which already
 * carries the title, date and bolt. Out of the way while the reader scrolls
 * down through the copy. Back the moment they stop or scroll up — a pause or
 * a turn back is when someone goes looking for a control, and returning on a
 * pause, not only on scroll-up, keeps it findable for a reader who only ever
 * goes down. Keyboard focus holds it in view, so tabbing to it never lands on
 * an invisible button.
 *
 * Over the report's two pink sections it turns black: a magenta button on the
 * magenta ground is a floating label with nothing around it.
 */
export function ReportPdfButton() {
  const [shown, setShown] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [onPink, setOnPink] = React.useState(false);
  const ref = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    const cover = document.querySelector<HTMLElement>("[data-report-cover]");
    const pinks = [...document.querySelectorAll<HTMLElement>("[data-report-pink]")];
    let lastY = window.scrollY;
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const pastCover = () =>
      !cover || cover.getBoundingClientRect().bottom < window.innerHeight * PAST_COVER;

    // Whether the button's middle sits over a pink section — measured from
    // where the button is drawn, so it holds at every breakpoint's offset.
    const overPink = () => {
      const btn = ref.current?.getBoundingClientRect();
      if (!btn || btn.height === 0) return false;
      const mid = btn.top + btn.height / 2;
      return pinks.some((el) => {
        const r = el.getBoundingClientRect();
        return mid >= r.top && mid <= r.bottom;
      });
    };

    const update = () => {
      frame = 0;
      setOnPink(overPink());
      const y = window.scrollY;
      const dy = y - lastY;
      if (Math.abs(dy) >= JITTER) lastY = y;

      if (!pastCover()) {
        setShown(false);
      } else if (dy >= JITTER) {
        setShown(false);
      } else if (dy <= -JITTER) {
        setShown(true);
      }

      clearTimeout(idle);
      idle = setTimeout(() => setShown(pastCover()), IDLE_MS);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // A reload partway down the page starts past the cover. Checked on the
    // next frame, once the browser has restored the scroll position.
    frame = requestAnimationFrame(() => {
      frame = 0;
      setShown(pastCover());
      setOnPink(overPink());
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, []);

  const visible = shown || focused;

  return (
    <a
      href={REPORT_PDF}
      download
      ref={ref}
      onClick={() => {
        const sponsor = new URLSearchParams(window.location.search).get("for") ?? undefined;
        trackReport("report_download", { sponsor });
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        // The site's primary button, as every other CTA draws it — the same
        // radius, type and size scale — only fixed in the corner. The shadow
        // is neutral: it is there to lift the button off the page, not glow.
        buttonClass("primary", "md"),
        "fixed bottom-5 right-5 z-40 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[opacity,transform,background-color] duration-300 ease-out motion-reduce:transition-opacity print:hidden sm:bottom-6 sm:right-6",
        // Black on the pink sections, the way their own button is drawn.
        onPink && "bg-black hover:bg-black/85 focus-visible:ring-black focus-visible:ring-offset-magenta",
        // Reduced motion keeps the fade and drops the slide.
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0 motion-reduce:translate-y-0",
      )}
    >
      <Download className="size-4" aria-hidden="true" />
      Save as PDF
    </a>
  );
}
