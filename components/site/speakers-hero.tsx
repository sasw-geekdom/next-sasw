import { HeroShell } from "@/components/site/hero-shell";
import { CIRCUIT_COLORS } from "@/lib/tracks";

// The lineup hero. Structure comes from HeroShell; only the charge and the
// copy change, so the three page heroes read as one system at different points
// on the grid.
//
// Two circuits swept across the bolt rather than blended into one, the same
// mechanism the homepage uses for all five. Blending these two produced
// #da64ab, which sat close enough to brand magenta that the page didn't
// announce itself as somewhere new — the whole point of giving it a charge of
// its own. Kept apart, the purple and the coral both stay legible.
const SPEAKERS_SWEEP = [
  CIRCUIT_COLORS["Small Business & Solopreneur"],
  CIRCUIT_COLORS["Capital"],
];

// Resting on the purple, not the midpoint: at rest is how most people see the
// bolt, and it's the end furthest from magenta.
const SPEAKERS_REST = CIRCUIT_COLORS["Small Business & Solopreneur"];

// The flow mixes up from this floor toward whichever end the cursor is over,
// so the floor sits between them — a violet that neither end fights.
const BASE: [number, number, number] = [0.06, 0.01, 0.08];

export function SpeakersHero({ hasLineup }: { hasLineup: boolean }) {
  return (
    <HeroShell
      eyebrow="The lineup · Sept 28 – Oct 2"
      // "Every name on the grid" until the lineup went live, when it became a
      // claim the page couldn't back: six faces under "every name" says the
      // lineup is six people, and it argued with the section directly beneath
      // it saying more were landing. "First" fixes that and keeps working all
      // the way to the last name.
      headline={
        <>
          First names{" "}
          <span className="whitespace-nowrap">
            on the <span className="text-magenta">grid.</span>
          </span>
        </>
      }
      // The blurb used to promise "five circuits and five downtown rooms".
      // True of the week, but read as a description of the people underneath
      // it — none of whom carries a circuit or a room until their sessions are
      // entered. This says who they are and answers the question the page
      // otherwise leaves hanging: when is any of this happening?
      blurb={
        hasLineup
          ? "The founders, builders, and operators taking the stage. Sessions, times and rooms go up as they're locked."
          : "Five circuits, five rooms, five days. The names go up as they're confirmed."
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
