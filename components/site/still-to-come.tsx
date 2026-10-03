"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DriftingBolts } from "@/components/site/drifting-bolts";
import { useChicagoNow } from "@/lib/live-clock";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The final events of the week — the ones the weather pushed past Oct 2.
 * They have no column on the week board, so without this they are only
 * reachable from their own pages.
 *
 * The page passes every activation dated after the week; each card hides
 * itself in the browser once its end time has passed, and the section goes
 * with the last one. "Now" is worked out here and not on the server, because
 * the homepage is cached (see lib/live-clock.ts). Before the clock has a
 * reading, every card shows, which is what the cached HTML says too.
 *
 * Each card wears the art its own page does: the drifting bolts for the
 * Startup Bash, the event's photograph, or its logo set as the title.
 */
export interface UpcomingItem {
  slug: string;
  href: string;
  title: string;
  day: string;
  time: string;
  venue: string;
  endMs: number;
  art:
    | { kind: "bolts" }
    | { kind: "photo"; src: string }
    | { kind: "logo"; src: string; width: number; height: number }
    | { kind: "none" };
}

// The headline counts down with the cards, so it is never wrong about how
// many are left.
const COUNT = ["", "One to go.", "The final two.", "The final three."];

export function StillToCome({ items }: { items: UpcomingItem[] }) {
  const now = useChicagoNow();
  const ahead = now.ms ? items.filter((i) => i.endMs > now.ms) : items;
  if (ahead.length === 0) return null;

  return (
    <section aria-labelledby="still-to-come-heading" className="border-t border-white/10 bg-black">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-magenta">Still to come</p>
        <h2
          id="still-to-come-heading"
          className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl"
        >
          {COUNT[ahead.length] ?? "Still to come."}
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-white/60">
          The last of San Antonio Startup + Tech Week, moved for the weather and still on. Same
          welcome, new dates.
        </p>

        <ul
          className={cn(
            "mt-10 grid gap-5 lg:mt-12",
            ahead.length === 3 && "md:grid-cols-3",
            ahead.length === 2 && "md:grid-cols-2",
          )}
        >
          {ahead.map((i) => (
            <li key={i.slug}>
              <Card item={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ item: i }: { item: UpcomingItem }) {
  return (
    <Link
      href={i.href}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-lg border border-white/10 bg-black p-7 transition-colors duration-300 hover:border-magenta/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta md:min-h-136 lg:p-8",
        // Tall on a phone only when there is art to fill the height; a logo
        // card stacked alone would be half empty. Side by side, all three
        // share a height either way.
        i.art.kind !== "logo" && i.art.kind !== "none" && "min-h-104",
      )}
    >
      {i.art.kind === "bolts" && (
        // Faded out toward the foot, where the type sits.
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 85%)",
          }}
        >
          <DriftingBolts />
        </div>
      )}
      {i.art.kind === "photo" && (
        <>
          <Image
            src={i.art.src}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-black via-black/75 to-black/10"
          />
        </>
      )}

      <div className="relative">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">{i.day}</p>
        <h3 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white text-balance transition-colors group-hover:text-magenta lg:text-4xl">
          {i.art.kind === "logo" ? (
            // The event's own lockup as the title. The alt text is the name,
            // so the heading still reads as one.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={i.art.src}
              width={i.art.width}
              height={i.art.height}
              alt={i.title}
              className="h-auto w-full max-w-[20rem]"
            />
          ) : (
            i.title
          )}
        </h3>
        <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
          <p className="font-mono text-xs uppercase tracking-widest text-white/65">
            {i.time}
            <br />
            {i.venue}
          </p>
          <ArrowUpRight
            aria-hidden="true"
            className={cn(
              ARROW_MOTION,
              "size-6 shrink-0 text-white/40 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta",
            )}
          />
        </div>
      </div>
    </Link>
  );
}
