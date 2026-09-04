import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ARROW_MOTION } from "@/lib/motion";
import { CircuitBus } from "@/components/site/circuit-bus";
import type { BillPart, FeaturedEntry } from "@/lib/featured";
import { cn } from "@/lib/utils";

/**
 * The featured lineup, as a bill rather than cards.
 *
 * Four rules and four rows, in the column the bolt used to have. Cards were
 * the other option and lost twice: on the hero's light ground every card on
 * this site would need a second treatment invented for it, and four cards
 * stacked in half a column are tall enough to push the CTA past the fold on a
 * MacBook Air — which is the one thing this hero has to do.
 *
 * A bill also handles what the set actually is. These four are a talk, an
 * activation, another activation and something not yet built, and a row can
 * carry all four without pretending they are the same object. The one with no
 * page says so instead of linking nowhere.
 */
/**
 * Words and marks on one line.
 *
 * `items-center`, not baseline: a logo's baseline is buried inside a file the
 * layout cannot see, so two marks side by side want their centres matched —
 * the same reason the Startup Bash calendar block gives for the same pairing.
 * Heights are in `em` so a mark tracks the type it sits in rather than a fixed
 * pixel that drifts at the next breakpoint.
 */
function Parts({ parts }: { parts: BillPart[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-[0.32em] gap-y-1">
      {parts.map((p, i) =>
        "text" in p ? (
          <span key={i} className={p.className}>
            {p.text}
          </span>
        ) : (
          <Image
            key={i}
            src={p.src}
            alt={p.alt}
            width={800}
            height={200}
            className={cn(p.h, "w-auto", p.mr, p.darken && "brightness-0")}
          />
        ),
      )}
    </span>
  );
}

export function FeaturedBill({ entries }: { entries: FeaturedEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
      {/* The eyebrow, and the circuits riding it.
          "Featured" alone was a mono label in the corner of a list — the one
          line here with nothing to say. The five-charge ramp was tried in the
          left column first, as a rail crossing the gutter to the list, and it
          read as a decoration parked in whitespace: nothing anchored its left
          end, so it was a slider. Landed on the eyebrow it has a word to
          start from and a list to arrive at, which is the same job the TPR
          cards give it — there the ramp *is* the wordmark, captioned. */}
      <div className="flex items-center gap-4">
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-magenta-ink">
          Featured
        </p>
        <CircuitBus className="min-w-0 flex-1" />
      </div>
      <ul className="mt-4">
        {entries.map((e) => {
          const body = (
            <>
              {e.meta && (
                <span className="block font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {e.meta}
                </span>
              )}
              <span
                className={cn(
                  "mt-1.5 block text-pretty font-display text-xl font-bold uppercase leading-[1.05] tracking-tight text-foreground sm:text-2xl",
                  e.href &&
                    "transition-colors duration-200 group-hover:text-magenta-ink",
                )}
              >
                <Parts parts={e.title} />
              </span>
              {e.credit && (
                <span className="mt-1.5 block text-sm text-muted-foreground">
                  <Parts parts={e.credit} />
                </span>
              )}
            </>
          );
          const link = e.href ? (
            <Link
              href={e.href}
              className="group flex items-start justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
            >
              <span className="min-w-0">{body}</span>
              <ArrowUpRight
                className={cn(
                  ARROW_MOTION,
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-magenta-ink",
                )}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </Link>
          ) : (
            /* No arrow. An arrow promises somewhere to go, and this one
               has nowhere yet. */
            <div className="py-3.5">{body}</div>
          );
          return (
            <li
              key={e.key}
              className="border-t border-foreground/15 first:border-t-0"
            >
              {link}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
