"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ARROW_MOTION } from "@/lib/motion";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { whenShort, type ResolvedSession } from "@/lib/schedule";

// The confirmed activations, minus PySanAntonio — that one has its own band
// above. Three across, then two, so the five don't leave a widowed cell.
//
// There's no artwork for most of these, so the cards are type-led on a lifted
// ground rather than borderless like room-flow's venue tiles: those are held
// together by a portrait butting against the copy, and a text-only card with
// no ground and no border just floats.

/** A card's lockup, once the page has resolved any CMS partner logo. */
export interface SessionCard extends ResolvedSession {
  logoSrc?: string;
  logoAlt?: string;
}

function Lockup({ session }: { session: SessionCard }) {
  if (session.logoSrc) {
    return (
      // The mark is the card's headline, so the slot is sized to lead rather
      // than to label — where a typeset title gets `text-2xl` across the full
      // width, this gets the same room. `max-w-56` used to cap it at 224px,
      // which left a 3:1 mark 144px wide in a ~340px card: legible, but not
      // the thing you saw first.
      //
      // Height-led with the width free, because lockups arrive at wildly
      // different ratios — a letterbox with the mark set left keeps a wide
      // wordmark and a squarer badge on the same baseline.
      <div className="relative h-16 w-full sm:h-20 lg:h-24">
        <Image
          src={session.logoSrc}
          alt={session.logoAlt ?? session.title}
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
          className="object-contain object-left"
        />
      </div>
    );
  }

  const [first, credit] = titleLines(session);
  return (
    <h3 className="font-display text-2xl font-bold uppercase leading-tight text-white">
      {first}
      {credit && (
        <>
          {" "}
          {/*
            Desktop-only break. A narrow cell already wraps this title on its
            own, and forcing the split there just buys a stub line — so the
            `br` is display:none below lg and the space above survives to keep
            the two halves as one flowing phrase. Above lg the trailing space
            collapses against the break, so it costs nothing there either.
          */}
          <br className="hidden lg:inline" />
          {credit}
        </>
      )}
    </h3>
  );
}

/** The title, split at `titleBreakBefore` — or whole, when there's no break. */
function titleLines(session: SessionCard): [string] | [string, string] {
  const at = session.titleBreakBefore;
  if (!at) return [session.title];
  const i = session.title.indexOf(at);
  // A break at position 0 would leave an empty first line.
  if (i <= 0) return [session.title];
  return [session.title.slice(0, i).trimEnd(), session.title.slice(i)];
}

function Card({
  session,
  index,
  className,
}: {
  session: SessionCard;
  index: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      initial={reduce ? undefined : { opacity: 0, y: 20 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        duration: 0.5,
        delay: reduce ? 0 : index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative flex flex-col bg-white/5 p-6 lg:p-7",
        // Only lifts when the whole card is a target.
        session.page &&
          "transition-colors duration-300 hover:bg-white/10 focus-within:bg-white/10",
        className,
      )}
    >
      <p className="mb-4 truncate font-mono text-[11px] uppercase tracking-widest text-white/55">
        {session.venue.name}
      </p>

      {/* A logo replaces the heading, so the card still needs an accessible
          name — the visually-hidden one carries it when art is present. */}
      {session.logoSrc && <h3 className="sr-only">{session.title}</h3>}

      {/*
        The link wraps the lockup and stretches over the whole card with
        `after:inset-0`, so the card is one target rather than a small one
        inside a large clickable-looking box — and the accessible name stays
        the title, not "read more".

        Everything that has to stay clickable above it needs `relative z-10`;
        nothing here does yet, which is why the circuit chip and blurb sit
        under the overlay without issue.
      */}
      {session.page ? (
        <Link
          href={`/schedule/${session.page}`}
          className="after:absolute after:inset-0 after:z-10 focus-visible:outline-none"
        >
          <Lockup session={session} />
        </Link>
      ) : (
        <Lockup session={session} />
      )}

      <div className="mt-3.5">
        <span className="inline-block rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta">
          {session.circuit}
        </span>
      </div>

      <p className="mt-4 text-pretty text-white/60">{session.blurb}</p>

      {/* When it runs, and the way in — the card's two pieces of utility, in a
          bar of their own under a hairline.

          Above the blurb the date was two stacked mono lines before the reader
          knew what the event was. Down here the top of the card stays clean,
          and because `mt-auto` pins every footer to the bottom, the dates line
          up across a row and can be scanned in one pass.

          The row renders whether or not the activation has a page — the date
          is the card's job on this page, and gating it on the link would drop
          it for anything not yet given a page of its own. */}
      <p className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-4 font-mono text-[11px] uppercase tracking-widest text-white/55 transition-colors duration-300 group-hover:text-magenta">
        <span className="text-white/75">
          {session.when
            ? `${whenShort(session.when).day} · ${whenShort(session.when).time}`
            : "Time still landing"}
        </span>
        {session.page && (
          <span className="inline-flex items-center gap-1.5">
            Event details
            <ArrowUpRight
              className={cn(
                ARROW_MOTION,
                "h-3.5 w-3.5 duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </span>
        )}
      </p>
    </motion.article>
  );
}

export function SessionBento({ sessions }: { sessions: SessionCard[] }) {
  if (sessions.length === 0) return null;

  // Three across, then the remainder spread over the same three columns — with
  // five that lands 3 + 2, each of the last pair taking a column and a half.
  const lead = sessions.slice(0, 3);
  const rest = sessions.slice(3);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lead.map((s, i) => (
          <Card key={s.slug} session={s} index={i} />
        ))}
      </div>

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((s, i) => (
            <Card key={s.slug} session={s} index={i + lead.length} />
          ))}
        </div>
      )}
    </div>
  );
}
