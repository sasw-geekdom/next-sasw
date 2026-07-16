import { Hero } from "@/components/site/hero";
import { RoomFlow } from "@/components/site/room-flow";
import { PowerGrid } from "@/components/site/power-grid";
import { listPartners, listSponsors } from "@/lib/admin/cms-queries";

// Sponsor/partner logos come from the CMS — refresh every 5 minutes so admin
// changes appear without a redeploy.
export const revalidate = 300;

async function safeList<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch {
    return [];
  }
}

export default async function Home() {
  const [sponsors, partners] = await Promise.all([
    safeList(listSponsors()),
    safeList(listPartners()),
  ]);

  return (
    <>
      <Hero />
      <RoomFlow />
      <PowerGrid sponsors={sponsors} partners={partners} />
    </>
  );
}
