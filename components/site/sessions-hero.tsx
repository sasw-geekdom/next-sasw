import { HeroShell } from "@/components/site/hero-shell";
import { mixCircuits } from "@/lib/tracks";

// The schedule hero. Structure comes from HeroShell — only the charge and the
// copy differ, so the three page heroes read as one system at different points
// on the grid.
//
// Halfway between Tech & Builders and AI & Applied Innovation: #33a2e4.
const SESSIONS_CURRENT = mixCircuits(
  "Tech & Builders",
  "AI & Applied Innovation",
);

// The flow mixes up from this floor toward the colour above, so the floor sits
// in the same family — a near-black magenta floor under a cyan current reads
// as two lights fighting.
const BASE: [number, number, number] = [0.01, 0.05, 0.08];

export function SessionsHero() {
  return (
    <HeroShell
      eyebrow="The schedule · Sept 28 – Oct 2"
      headline={
        <>
          Coming online,{" "}
          <span className="whitespace-nowrap">
            room by <span className="text-magenta">room.</span>
          </span>
        </>
      }
      blurb="The full schedule lands closer to the week. These activations are confirmed."
      // Same button as the homepage, so it makes the same promise. Before the
      // heroes shared a shell this one shipped bare, and "Get on the list."
      // meant something different depending on which page you clicked it from.
      cta={{
        href: "/register",
        label: "Get on the list.",
        note: "Free registration.",
      }}
      bolt={{ color: SESSIONS_CURRENT, base: BASE }}
    />
  );
}
