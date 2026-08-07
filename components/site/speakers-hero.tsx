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
      headline={
        <>
          Every name{" "}
          <span className="whitespace-nowrap">
            on the <span className="text-magenta">grid.</span>
          </span>
        </>
      }
      blurb={
        hasLineup
          ? "The founders, builders, and operators carrying the current across five circuits and five downtown rooms."
          : "Five circuits, five rooms, five days. The names go up as they're confirmed."
      }
      // Plug in rather than register: someone reading the lineup is more
      // likely weighing whether to be on it than taking a seat. No note — the
      // other two heroes disclose /register as free, and this button goes
      // somewhere else entirely.
      cta={{ href: "/plug-in", label: "Plug in." }}
      bolt={{ color: SPEAKERS_REST, sweep: SPEAKERS_SWEEP, base: BASE }}
    />
  );
}
