"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DriftingBolts } from "@/components/site/drifting-bolts";
import { useChicagoNow } from "@/lib/live-clock";
import { ARROW_MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

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
  headline?: string;
  blurb?: string;
  register?: { label: string; href: string };
  programme?: { time: string; title: string }[];
}

// The headline counts down with the cards, so it is never wrong about how
// many are left.
const COUNT = ["", "One to go.", "The final two.", "The final three."];

export function StillToCome({ items }: { items: UpcomingItem[] }) {
  const now = useChicagoNow();
  const ahead = now.ms ? items.filter((i) => i.endMs > now.ms) : items;
  if (ahead.length === 0) return null;

  // No top rule: it sits straight under the homepage hero, whose photo fades
  // into black, and a hairline there undid the fade.
  return (
    <section aria-labelledby="still-to-come-heading" className="bg-black">
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

        {/* One left gets the width to itself: three cards across fill a
            laptop, but one card at that size sat in a third of the row with
            two-thirds of empty black beside it. */}
        {ahead.length === 1 ? (
          <Feature item={ahead[0]} />
        ) : (
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
        )}
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

/**
 * The last one standing, across the full width: who and when on the left,
 * the day itself on the right, so a wide screen fills with the programme
 * rather than with black.
 */
function Feature({ item: i }: { item: UpcomingItem }) {
  const external = i.register?.href.startsWith("http");
  return (
    <div className="relative mt-10 grid overflow-hidden rounded-lg border border-white/10 lg:mt-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative flex flex-col p-7 sm:p-10 lg:p-12">
        <p className="font-mono text-sm uppercase tracking-widest text-magenta">{i.day}</p>
        <h3 className="mt-5 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white text-balance lg:text-5xl">
          {i.art.kind === "logo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={i.art.src}
              width={i.art.width}
              height={i.art.height}
              alt={i.title}
              className="h-auto w-full max-w-md"
            />
          ) : (
            i.title
          )}
        </h3>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-white/65">
          {i.time} &middot; {i.venue}
        </p>
        {i.headline && (
          <p className="mt-8 max-w-xl font-display text-2xl font-bold uppercase leading-tight tracking-tight text-white text-balance lg:text-3xl">
            {i.headline}
          </p>
        )}
        {i.blurb && <p className="mt-4 max-w-xl text-pretty text-white/65">{i.blurb}</p>}
        <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-10">
          {i.register && (
            <a
              href={i.register.href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={buttonClass("primary", "lg", "group")}
            >
              {i.register.label}
              <ArrowUpRight
                aria-hidden="true"
                className={cn(ARROW_MOTION, "size-5 duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5")}
              />
            </a>
          )}
          <Link
            href={i.href}
            className="inline-flex h-13 items-center gap-2 rounded-md border border-white/20 px-7 text-lg font-medium text-white transition-colors hover:border-magenta hover:text-magenta"
          >
            See the day
          </Link>
        </div>
      </div>

      {i.programme && i.programme.length > 0 && (
        <div className="border-t border-white/10 bg-white/[0.03] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
          <p className="font-mono text-xs uppercase tracking-widest text-white/45">The day</p>
          <ol className="mt-6 divide-y divide-white/10">
            {i.programme.map((p) => (
              <li key={p.time + p.title} className="grid grid-cols-[7.5rem_1fr] gap-4 py-4 first:pt-0 last:pb-0">
                <span className="pt-0.5 font-mono text-xs uppercase tracking-widest text-magenta">{p.time}</span>
                <span className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-white lg:text-xl">
                  {p.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
