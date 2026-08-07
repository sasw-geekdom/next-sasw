"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ResolvedSession } from "@/lib/sessions";

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
      <div className="relative h-12 w-full max-w-56">
        <Image
          src={session.logoSrc}
          alt={session.logoAlt ?? session.title}
          fill
          sizes="224px"
          // Lockups arrive at wildly different aspects, so the slot is a
          // letterbox and the mark sits left inside it at its own ratio.
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
      className={cn("flex flex-col bg-white/5 p-6 lg:p-7", className)}
    >
      <p className="mb-4 truncate font-mono text-[11px] uppercase tracking-widest text-white/55">
        {session.venue.name}
      </p>

      {/* A logo replaces the heading, so the card still needs an accessible
          name — the visually-hidden one carries it when art is present. */}
      {session.logoSrc && <h3 className="sr-only">{session.title}</h3>}
      <Lockup session={session} />

      <div className="mt-3.5">
        <span className="inline-block rounded-full border border-magenta/35 bg-magenta/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-magenta">
          {session.circuit}
        </span>
      </div>

      <p className="mt-4 text-pretty text-white/60">{session.blurb}</p>
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
