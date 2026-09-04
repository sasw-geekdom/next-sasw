import Image from "next/image";
import type { CircuitSponsor } from "@/lib/circuit-sponsors";
import { cn } from "@/lib/utils";

/**
 * "Founder circuit, sponsored by —" and the mark.
 *
 * One line, in the mono register the rest of the page's credits use, so it
 * reads as a footnote to the circuit rather than as an ad placed on the
 * activation. It names the circuit rather than the event on purpose: what is
 * sponsored is the circuit, and this page is one of several carrying it.
 */
export function CircuitSponsorLine({
  sponsor,
  className,
}: {
  sponsor: CircuitSponsor;
  className?: string;
}) {
  const mark = (
    <Image
      src={sponsor.imageUrl}
      alt={sponsor.name}
      width={240}
      height={80}
      // Height-led, like every other mark on the site: these arrive at
      // whatever size the sponsor sent.
      className="h-7 w-auto object-contain sm:h-8"
    />
  );
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
        {sponsor.circuit} circuit, sponsored by
      </p>
      {sponsor.link ? (
        <a
          href={sponsor.link}
          target="_blank"
          rel="noreferrer"
          className="block opacity-85 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-magenta"
        >
          {mark}
        </a>
      ) : (
        <span className="block opacity-85">{mark}</span>
      )}
    </div>
  );
}
