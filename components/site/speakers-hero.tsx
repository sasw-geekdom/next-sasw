import { HeroShell } from "@/components/site/hero-shell";
import { CIRCUIT_COLORS } from "@/lib/tracks";

// The lineup hero. Structure comes from HeroShell; only the charge and the
// copy change, so the three page heroes read as one system at different points
// on the grid.
//
// Two circuits swept across the bolt rather than blended into one, the same
// mechanism the homepage uses for all five.
//
// Blue into coral. Blue because that is what the lineup is — the confirmed
// names are almost entirely cyber, AI and dev, and this hero previously rested
// on Small Business & Solopreneur, one of the two circuits the lineup
// represents least.
//
// Coral rather than the obvious AI teal, for two reasons. Tech x AI is exactly
// /schedule's charge, so a blue-to-teal sweep would pass through the other
// page's colour halfway across. And measured across all ten circuit pairs,
// blue-to-coral has the widest spread of any — ΔE 113 end to end — so the
// sweep actually reads as a sweep.
//
// Blend is #a673ab, ΔE 52 from brand magenta, which clears the test the old
// pair was chosen to pass and that it scored worst on: purple x coral blends
// to ΔE 27, the closest to magenta of any pair on the wheel.
//
// If the lineup broadens toward founders and capital this goes stale. The
// version that cannot go stale reads the circuits the lineup actually covers
// and sweeps those — impossible until sessions exist, since a speaker's
// circuits are derived from them.
const SPEAKERS_SWEEP = [
  CIRCUIT_COLORS["Tech & Builders"],
  CIRCUIT_COLORS["Capital"],
];

// Resting on the blue, because at rest is how most people see the bolt and
// blue is the circuit the lineup actually sits in. ΔE 46 from /schedule's
// #33a2e3 — same family, comfortably distinguishable.
const SPEAKERS_REST = CIRCUIT_COLORS["Tech & Builders"];

// The flow mixes up from this floor toward whichever end the cursor is over,
// so the floor has to sit between a blue and a coral without fighting either
// — a near-black plum, warm enough for the coral end and dark enough not to
// wash the blue. Not /schedule's [0.01, 0.05, 0.08]: that floor is tuned to a
// single cyan current, and under a coral end it read as two lights fighting,
// which is the exact failure its own comment warns about.
const BASE: [number, number, number] = [0.05, 0.02, 0.06];

export function SpeakersHero({ hasLineup }: { hasLineup: boolean }) {
  return (
    <HeroShell
      eyebrow="The lineup · Sept 28 – Oct 2"
      // "Every name on the grid" until the lineup went live, when it became a
      // claim the page couldn't back: six faces under "every name" says the
      // lineup is six people, and it argued with the section directly beneath
      // it saying more were landing. "First" fixed that.
      //
      // "First" is now the thing that undersells it. Twenty-nine names are on
      // this page, across three circuits and three rooms, with a filter for
      // each — that is a lineup, and "first names" tells a reader they have
      // arrived early for something that has barely started. It is also the
      // wrong shape for what the page does now: it is a directory to be
      // searched, not an announcement to be read.
      //
      // "Who's" says that, and pairs with the homepage band's "Who carries
      // the current." rather than repeating it.
      headline={
        <>
          Who&rsquo;s{" "}
          <span className="whitespace-nowrap">
            on the <span className="text-magenta">grid.</span>
          </span>
        </>
      }
      // The blurb used to promise "five circuits and five downtown rooms".
      // True of the week, but read as a description of the people underneath
      // it — none of whom carries a circuit or a room until their sessions
      // are entered. So it became "sessions, times and rooms go up as they're
      // locked", which answered the question the page left hanging: when is
      // any of this happening?
      //
      // They are up. Sessions carry rooms and times, the wall filters by
      // circuit and by venue off the back of them, and a speaker's own page
      // links to what they are speaking on — so the line was promising a
      // thing the page had already delivered, which reads as a page that has
      // not been touched since it shipped. It names the mix and the controls
      // instead.
      //
      // Deliberately not the homepage band's sentence, which lists the same
      // people at more length. That one introduces a lineup to someone who
      // has not asked for it; this one is read by someone already on the
      // page, for whom "how do I find my person" is the live question.
      blurb={
        hasLineup
          ? "Founders and operators, engineers and security researchers. Filter by circuit or by room, and open anyone to see what they're speaking on."
          : "Five circuits, six rooms, five days. The names go up as they're confirmed."
      }
      // Follows the lineup, like the blurb does.
      //
      // This was "Plug in." unconditionally, on the reasoning that someone
      // reading the lineup is likelier weighing whether to be on it than
      // taking a seat. That held while the page had no lineup and was
      // effectively a call for speakers. With names on it, most arrivals come
      // to see who is speaking — and the pitch already has a better home at
      // the foot of the page, where "Think you belong up there?" gives it
      // framing a hero button can't.
      //
      // Announced, this matches the homepage and schedule heroes exactly, so
      // all three finally read as the one system this file claims they are.
      cta={
        hasLineup
          ? {
              href: "/register",
              label: "Get on the list.",
              note: "Free registration.",
            }
          : { href: "/plug-in", label: "Plug in." }
      }
      bolt={{ color: SPEAKERS_REST, sweep: SPEAKERS_SWEEP, base: BASE }}
    />
  );
}
