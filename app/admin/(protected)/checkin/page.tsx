import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations } from "@/lib/admin/queries";
import { CheckinPortal } from "@/components/admin/checkin-portal";

export const metadata: Metadata = { title: "Check-in" };

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  await requireAdmin();
  const rows = await listRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading font-bold">Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search a name. Tap to check them in. Coffee&apos;s on.
        </p>
      </div>
      <CheckinPortal rows={rows} />
    </div>
  );
}
