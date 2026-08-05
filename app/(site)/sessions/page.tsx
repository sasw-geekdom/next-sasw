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

      <PysaBand />

      <section className="bg-black">
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

          {/* The section's two doors: one for anyone who wants to add to the
              schedule, one for anyone who just wants to be in the room. */}
          <div className="mt-20 border-t border-white/10 pt-14 text-center lg:mt-28 lg:pt-16">
            <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
              Want a slot on it?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
              Host an activation, sponsor the week, or just take a seat.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/get-involved" size="lg">
                Get involved
              </ButtonLink>
              {/* `outline` is built for the light theme — its text is
                  `foreground`, which is black, and would vanish here. */}
              <ButtonLink
                href="/register"
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/10"
              >
                Register
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
