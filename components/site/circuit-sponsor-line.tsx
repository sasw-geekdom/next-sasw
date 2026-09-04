import Image from "next/image";
import type { CircuitSponsor } from "@/lib/circuit-sponsors";
import { cn } from "@/lib/utils";

/**
 * "Founder circuit, powered by —" and the mark.
 *
 * "Powered by", not "sponsored by", at the week team's request. The code
 * keeps saying sponsor — the rows come from the `sponsors` collection and a
 * circuit sponsor is what this is — so only the words on the page changed.
 * It also means this line and `PoweredByLine` now share a verb: on a page
 * carrying both, the scopes are what separate them ("Powered by Active
 * Capital" is the activation's, "Founder circuit, powered by Nopalera" is the
 * circuit's).
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
      // Height-led, like every other mark on the site — but half what it was,
      // because the box changed underneath it. `sponsorMark` now hands this a
      // trimmed cut, and the CMS original was roughly half vertical padding:
      // at h-8 the ink inside it drew about 16px and the mark rendered 143px
      // wide, where the trimmed file at the same height draws 281px. Matching
      // the size it used to *look* means halving the number.
      className="h-3.5 w-auto object-contain sm:h-4"
    />
  );
  return (
    // 10px, and now it is the gap you see.
    //
    // It used to be 16px and landed as 28.8px against Google for Startups and
    // 24.5px against Nopalera, because both marks arrived from the CMS with
    // transparent padding down their left edge — space no `gap` can close,
    // since it is not gap. The same padding is why the two never looked
    // centred against the label: `items-center` centres the box it is handed,
    // and the ink was not in the middle of it. `sponsorMark` hands this a
    // box that is the ink, so one value is now right for both marks and the
    // centring is real centring. Matched to `PoweredByLine`, which can appear on
    // the same page.
    <div
      className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-2", className)}
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-white/45">
        {sponsor.circuit} circuit, powered by
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
