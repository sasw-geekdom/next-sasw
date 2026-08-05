import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { SpeakerWall } from "@/components/site/speaker-wall";
import { SpeakersHero } from "@/components/site/speakers-hero";
import { loadLineup, SPEAKERS_ANNOUNCED } from "@/lib/speakers";

// Speakers and sessions both come from the CMS; admin saves bust this path
// directly, so the window is the ceiling rather than the usual wait.
export const revalidate = 300;

const DESCRIPTION =
  "The founders, builders, and operators speaking at San Antonio Startup + Tech Week — five circuits, Sept 28 – Oct 2.";

export const metadata: Metadata = {
  title: "Speakers",
  description: DESCRIPTION,
  alternates: { canonical: "/speakers" },
  openGraph: {
    title: "Speakers · SASTW 2026",
    description: DESCRIPTION,
    url: "/speakers",
  },
  twitter: { title: "Speakers · SASTW 2026", description: DESCRIPTION },
};

export default async function SpeakersPage() {
  const lineup = await loadLineup();

  // Under wraps until announcement. Gating here rather than emptying the CMS
  // means the page falls through to its own "Still charging." state — which
  // already says the right thing — while the hero keeps the page from being
  // a blank screen. Flip SPEAKERS_ANNOUNCED to bring the wall back.
  //
  // TODO(launch): this does NOT hide /speakers/[slug]. Those pages still
  // prerender from the same data and still appear in the sitemap, so an
  // unannounced speaker's page is reachable by URL and indexable. Gate the
  // route and drop the sitemap entries if the names need to stay private.
  const hasLineup = SPEAKERS_ANNOUNCED && lineup.length > 0;

  return (
    <main>
      {/* Light hero into a black wall — the same rhythm the homepage and
          /sessions run, so all three pages open the same way. */}
      <SpeakersHero hasLineup={hasLineup} />

      <section className="bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
          {hasLineup ? (
            <>
              {/* The hero's headline is the page's statement; this is the
                  label for the grid under it. Without it the black section
                  opens on bare cards with nothing naming them. Same shape as
                  the /sessions header, down to the closing half-sentence. */}
              <div className="max-w-2xl">
                <p className="font-mono text-xs uppercase tracking-widest text-magenta">
                  Confirmed
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
                  First names up.
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-white/60">
                  More go live as they&rsquo;re locked. These are speaking.
                </p>
              </div>

              {/* No wrapper margin — the wall's filter row and grid each
                  carry their own `mt-12`, and stacking another on top of it
                  would double the gap. */}
              <SpeakerWall speakers={lineup} />
            </>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
                Still charging.
              </h2>
              <p className="mt-3 max-w-md text-pretty text-white/60">
                The lineup comes online before Sept 28. If you&rsquo;ve got
                something worth saying, the stage is still open.
              </p>
              <div className="mt-7">
                <ButtonLink href="/plug-in" size="lg">
                  Plug in.
                </ButtonLink>
              </div>
            </div>
          )}

          {hasLineup && (
            <div className="mt-20 border-t border-white/10 pt-14 text-center lg:mt-28 lg:pt-16">
              <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
                Think you belong up there?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-white/60">
                Pitch a session — five circuits, one current.
              </p>
              <div className="mt-7 flex justify-center">
                <ButtonLink href="/plug-in" size="lg">
                  Plug in.
                </ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
