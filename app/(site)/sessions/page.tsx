import type { Metadata } from "next";
import { SessionsHero } from "@/components/site/sessions-hero";
import { PysaBand } from "@/components/site/pysa-band";
import {
  SessionBento,
  type SessionCard,
} from "@/components/site/session-bento";
import { ButtonLink } from "@/components/ui/button";
import { listPartners } from "@/lib/admin/cms-queries";
import { FEATURED_SESSIONS, resolveSessions } from "@/lib/sessions";

// Partner logos come from the CMS, so this page carries the same ISR window as
// the homepage and /speakers.
export const revalidate = 300;

const DESCRIPTION =
  "The full schedule for San Antonio Startup + Tech Week lands closer to the week. These activations are confirmed — Sept 28 – Oct 2.";

export const metadata: Metadata = {
  title: "Sessions",
  description: DESCRIPTION,
  alternates: { canonical: "/sessions" },
  openGraph: {
    title: "Sessions · SASTW 2026",
    description: DESCRIPTION,
    url: "/sessions",
  },
  twitter: { title: "Sessions · SASTW 2026", description: DESCRIPTION },
};

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

export default async function SessionsPage() {
  const partners = await safeList(listPartners());

  // Sessions that borrow a partner's lockup are matched here rather than in
  // the data file, so the logo tracks whatever the admin has uploaded. A miss
  // is silent by design — the card typesets its title instead.
  const cards: SessionCard[] = resolveSessions(FEATURED_SESSIONS).map((s) => {
    if (s.logo) {
      return { ...s, logoSrc: s.logo.src, logoAlt: s.logo.alt };
    }
    if (s.logoFromPartner) {
      const needle = s.logoFromPartner.toLowerCase();
      const match = partners.find((p) =>
        p.name.toLowerCase().includes(needle),
      );
      if (match?.imageUrl) {
        return { ...s, logoSrc: match.imageUrl, logoAlt: match.name };
      }
    }
    return s;
  });

  return (
    <main>
      <SessionsHero />

      <PysaBand detailHref="/sessions/pysanantonio" />

      {/* Full-bleed rule on the section, not the inner container — the same
          seam the homepage uses between room-flow and the logo wall. Inset to
          max-w-7xl it reads as a divider inside one long black column; edge to
          edge it reads as the wall between two sections, which is the only cue
          available when neighbouring sections share a ground. */}
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Confirmed
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              Already on the grid.
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              More lands as it&rsquo;s locked. These are running.
            </p>
          </div>

          <div className="mt-14 lg:mt-16">
            <SessionBento sessions={cards} />
          </div>

        </div>
      </section>

      {/*
        The way onto the schedule, as its own band rather than a tail on the
        bento — the same move the homepage's sponsor ask needed. Tucked inside
        that container it was centred on a page that is left-aligned
        everywhere else, and small enough to scan as footer furniture.

        One button, not two. It previously offered "Get involved" beside
        "Register", which is the section failing to decide what it wants:
        Register already appears in the navbar, the footer and the hero, so
        the second button spent the section's one decision on a link the
        reader has passed three times. It also had to hand-override the
        `outline` variant, whose text is `foreground` — black, invisible here.
      */}
      <section className="border-t border-white/10 bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-magenta">
              Hosting is open · Sept 28 – Oct 2
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-4xl">
              Want a slot on it?
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-white/60">
              Host an activation, sponsor the week, or just take a seat.
            </p>
            <div className="mt-7">
              <ButtonLink href="/get-involved" size="lg">
                Get involved
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
