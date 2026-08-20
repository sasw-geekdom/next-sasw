import Link from "next/link";
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
      // Was "Coming online, room by room." — which described the same thing
      // the week section's own headline described, one viewport apart, under
      // eyebrows that both ended "· Sept 28 – Oct 2" and blurbs that both said
      // "confirmed". The page read as two heroes stacked.
      //
      // So there is one now, and it took the better line. "Five days, one
      // current." names the shape of the thing the page is, which matters more
      // once the page *is* the calendar; the section below it has no header at
      // all any more.
      headline={
        <>
          Five days,{" "}
          <span className="whitespace-nowrap">
            one <span className="text-magenta">current.</span>
          </span>
        </>
      }
      // Merged from the two blurbs that used to say this separately: what the
      // grid is, and that it is still filling.
      blurb="Everything confirmed so far, in the hour it runs. More lands on every day as the week locks."
      // Points at the calendar, not away from it. "Get on the list." sent the
      // reader to /register from the top of the one page whose whole job is to
      // be scrolled into — the hero's primary action was an exit. Register
      // survives in the note, plus the navbar, the footer and this page's own
      // closing band, so the funnel loses nothing.
      cta={{
        href: "#the-week",
        label: "See the week.",
        note: (
          <>
            Or{" "}
            <Link
              href="/register"
              // Dark on hover, not white. The note sits in
              // `text-muted-foreground` on the hero's *white* ground, so
              // `hover:text-white` painted the link the colour of the page
              // and the words vanished under the cursor.
              className="underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              get on the list
            </Link>{" "}
            — free registration.
          </>
        ),
      }}
      bolt={{ color: SESSIONS_CURRENT, base: BASE }}
    />
  );
}
