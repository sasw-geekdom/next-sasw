import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getEmailCopyConfig } from "@/lib/email/copy-store";
import { knowBeforeYouGoStatus } from "@/lib/email/know-before-you-go";
import { listBroadcasts } from "@/lib/email/broadcasts";
import { PageHeader } from "@/components/admin/page-header";
import { EmailManager } from "@/components/admin/cms/email-manager";
import { BroadcastComposer } from "@/components/admin/cms/broadcast-composer";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";
// The know-before-you-go send runs as a server action on this page: seven
// batches of 100 and their Firestore stamps take seconds, but the default
// ceiling is no place to find out it took longer.
export const maxDuration = 120;

export default async function EmailsPage() {
  const user = await requireAdmin();
  const [config, kbyg, broadcasts] = await Promise.all([
    getEmailCopyConfig(),
    knowBeforeYouGoStatus(),
    listBroadcasts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Emails"
        description="Edit what attendees receive, or write an email to everyone registered. The logo and footer stay fixed."
      />
      <EmailManager
        initial={config.copies}
        saved={config.saved}
        adminEmail={user.email}
        knowBeforeYouGo={kbyg}
        composer={<BroadcastComposer list={broadcasts} adminEmail={user.email} />}
      />
    </div>
  );
}
