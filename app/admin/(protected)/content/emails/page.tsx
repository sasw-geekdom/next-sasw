import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getEmailCopyConfig } from "@/lib/email/copy-store";
import { PageHeader } from "@/components/admin/page-header";
import { EmailManager } from "@/components/admin/cms/email-manager";

export const metadata: Metadata = { title: "Emails" };
export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const user = await requireAdmin();
  const config = await getEmailCopyConfig();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Emails"
        description="The automated confirmations Resend sends on registration and Call for Speakers submissions. Edit the copy — the logo, calendar block, and footer stay locked."
      />
      <EmailManager
        initial={{ registration: config.registration, speaker: config.speaker }}
        updatedAt={config.updatedAt}
        updatedBy={config.updatedBy}
        adminEmail={user.email}
      />
    </div>
  );
}
