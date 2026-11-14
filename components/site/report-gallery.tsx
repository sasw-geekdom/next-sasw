"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReportPhoto } from "@/lib/sponsor-report";
import { cn } from "@/lib/utils";

/**
 * The report's photo wall, and the viewer it opens into.
 *
 * Every photo is a button. The viewer is a native <dialog> opened modal,
 * which brings focus handling, the inert page behind and Escape-to-close
 * with it; on top of that it steps through all of them with the arrow keys,
 * a swipe, or the side buttons, wrapping at either end.
 */
export function ReportGallery({ photos }: { photos: ReportPhoto[] }) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const [open, setOpen] = React.useState<number | null>(null);
  const swipe = React.useRef<number | null>(null);

  const show = (i: number) => {
    setOpen(i);
    dialog.current?.showModal();
  };

  // The dialog covers the page but doesn't stop it scrolling underneath, so
  // the page is held still for as long as the viewer is open.
  const isOpen = open !== null;
  React.useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [isOpen]);
  const close = () => dialog.current?.close();
  const step = React.useCallback(
    (by: number) => setOpen((i) => (i === null ? i : (i + by + photos.length) % photos.length)),
    [photos.length],
  );

  const photo = open === null ? null : photos[open];

  return (
    <>
      {/* Justified rows: every photo in a row shares one height and the row
          runs edge to edge, with nothing cropped. Each tile grows in
          proportion to its aspect ratio from a basis of ratio × --row, which
          is what holds a row's heights equal; --row sets how tall a row
          wants to be at each width. Masonry columns read down one column
          and then the next, and ended at four ragged heights. The last row
          stretches to the edge too, so the wall ends square — with 36
          photos it only ever grows a little. */}
      <div className="mt-14 flex flex-wrap gap-2 [--row:7.5rem] sm:gap-3 sm:[--row:11rem] lg:[--row:14rem]">
        {photos.map((p, i) => {
          const ratio = p.w / p.h;
          return (
            <button
              key={p.src}
              type="button"
              onClick={() => show(i)}
              aria-label={p.alt}
              style={{ flexGrow: ratio, flexBasis: `calc(var(--row) * ${ratio})`, aspectRatio: `${p.w} / ${p.h}` }}
              className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <Image
                src={p.src}
                fill
                alt=""
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 40vw, 60vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
              />
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialog}
        aria-label={photo?.alt}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onPointerDown={(e) => {
          swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
      >
        {photo && open !== null && (
          <div className="relative flex h-full w-full touch-pan-y select-none items-center justify-center">
            <div className="relative h-[82dvh] w-[88vw]">
              <Image
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="88vw"
                priority
                className="object-contain"
                draggable={false}
              />
            </div>

            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-white/60">
              {open + 1} / {photos.length}
            </p>

            {(
              [
                ["Previous photo", -1, ChevronLeft, "left-3 sm:left-6"],
                ["Next photo", 1, ChevronRight, "right-3 sm:right-6"],
              ] as const
            ).map(([label, by, Icon, place]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => step(by)}
                className={cn(
                  "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta",
                  place,
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </button>
            ))}

            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta sm:right-6 sm:top-6"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
