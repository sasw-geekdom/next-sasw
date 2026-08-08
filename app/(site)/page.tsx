import { Hero } from "@/components/site/hero";
import { jsonLd, weekEvent } from "@/lib/structured-data";
import { RoomFlow } from "@/components/site/room-flow";
import { SpeakerLineup } from "@/components/site/speaker-lineup";
import { PowerGrid } from "@/components/site/power-grid";
import {
  listPartners,
  listSponsors,
  listSpeakers,
} from "@/lib/admin/cms-queries";
import { SPEAKERS_ANNOUNCED } from "@/lib/speakers";

// Speakers and sponsor/partner logos come from the CMS — refresh every 5
// minutes so admin changes appear without a redeploy. Saves in the admin bust
// this path outright, so the window is only the ceiling, not the norm.
export const revalidate = 300;

// The homepage features the first six in admin drag order; the rest live on
// /speakers. Reordering in the CMS is how you change who leads.
const FEATURED = 6;

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [sponsors, partners, speakers] = await Promise.all([
    safeList(listSponsors()),
    safeList(listPartners()),
    // Skipped entirely while the lineup is under wraps — no point paying for
    // a Firestore read on every regeneration to render nothing.
    SPEAKERS_ANNOUNCED ? safeList(listSpeakers()) : Promise.resolve([]),
  ]);

  return (
    <>
      {/* Event rich results — the date, venue and "Free" shown in the search
          listing itself. Built from the same constants the page renders. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(weekEvent()) }}
      />
      <>
        <Hero />
        <RoomFlow />
        {/* Hidden until announcement. `SPEAKERS_ANNOUNCED` in lib/speakers.ts is
          the single switch — flipping it restores this band and the /speakers
          wall together. */}
        {SPEAKERS_ANNOUNCED && (
          <SpeakerLineup speakers={speakers.slice(0, FEATURED)} />
        )}
        <PowerGrid sponsors={sponsors} partners={partners} />
      </>
    </>
  );
}
