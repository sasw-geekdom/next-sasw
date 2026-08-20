import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { SpeakerWall } from "@/components/site/speaker-wall";
import { SpeakersHero } from "@/components/site/speakers-hero";
import { loadLineup, SPEAKERS_ANNOUNCED } from "@/lib/speakers";
import { activationOptions } from "@/lib/schedule";
import { VENUE_OPTIONS } from "@/lib/locations";

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
  twitter: {
    card: "summary_large_image",
    title: "Speakers · SASTW 2026",
    description: DESCRIPTION,
  },
};

export default async function SpeakersPage() {
  const lineup = await loadLineup();

  // Under wraps until announcement. Gating here rather than emptying the CMS
  // means the page falls through to its own "Still charging." state — which
  // already says the right thing — while the hero keeps the page from being
  // a blank screen. Flip SPEAKERS_ANNOUNCED to bring the wall back.
  //
  // Note: this does NOT hide /speakers/[slug]. Those pages prerender from the
  // same data and appear in the sitemap regardless — fine now that the lineup
  // is announced and this page links to every one of them, but it means
  // flipping SPEAKERS_ANNOUNCED back to false would leave six orphaned,
  // indexable pages behind. Gate the route and drop the sitemap entries if
  // that ever has to happen.
  const hasLineup = SPEAKERS_ANNOUNCED && lineup.length > 0;

  return (
    <main>
      {/* Light hero into a black wall — the same rhythm the homepage and
          /sessions run, so all three pages open the same way. */}
      <SpeakersHero hasLineup={hasLineup} />

      <section className="bg-black">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-28">
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
                {/* "Online" is the site's word for a thing that has gone
                    from planned to published, which is what this section is
                    about.

                    It used to be described here as the counterpart to
                    /schedule's "Coming online, room by room." That headline is
                    retired — /schedule's hero took the calendar's own line
                    when the page stopped having two of them — so the rhyme is
                    gone and only the reasoning below still holds.
    
                    Not "First names up.", which the hero says now, and not
                    "These are speaking.", which was accurate but stepped out
                    of the electrical vocabulary every other headline here
                    keeps: current, grid, charge, locked, online. */}
                <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
                  Already online.
                </h2>
                <p className="mt-4 max-w-xl text-pretty text-white/60">
                  More land as they&rsquo;re locked.
                </p>
              </div>

              {/* No wrapper margin — the wall's filter row and grid each
                  carry their own `mt-12`, and stacking another on top of it
                  would double the gap. */}
              {/* Options come from the schedule, not from the lineup — the
                  wall then narrows them to what its speakers actually cover,
                  so the labels stay the site's own names for these things
                  rather than whatever a CMS row happens to hold. */}
              <SpeakerWall
                speakers={lineup}
                activations={activationOptions().map((a) => ({
                  value: a.slug,
                  label: a.title,
                }))}
                venues={VENUE_OPTIONS.map((v) => ({
                  value: v.slug,
                  label: v.name,
                }))}
              />
            </>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-3xl">
                Still charging.
              </h2>
              {/* Two facts, no conditional. This read "If you've got
                  something worth saying, the stage is still open" — the only
                  second-person conditional on the site, and it put a
                  qualifying test in front of an invitation. Everything else
                  here states what's true and lets the CTA do the asking, so
                  this does too. */}
              <p className="mt-3 max-w-md text-pretty text-white/60">
                The lineup comes online before Sept 28. The stage is still open.
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
