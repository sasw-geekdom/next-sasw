import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { listFaqs } from "@/lib/admin/cms-queries";
import { deleteFaq, importFaqs, reorderFaqs, saveFaq } from "@/lib/admin/cms-actions";
import { FaqManager } from "@/components/admin/cms/faq-manager";
import { PageHeader } from "@/components/admin/page-header";
import { FAQ } from "@/lib/faq";
import type { FaqSectionId } from "@/lib/admin/cms-types";

export const metadata: Metadata = { title: "FAQ" };
export const dynamic = "force-dynamic";

export default async function FaqContentPage() {
  await requireAdmin();
  const rows = await listFaqs();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="FAQ" description="The questions on the public Attending page." />
      <FaqManager
        rows={rows}
        sections={FAQ.map((s) => ({ id: s.id as FaqSectionId, eyebrow: s.eyebrow, headline: s.headline }))}
        builtInCount={FAQ.reduce((n, s) => n + s.items.length, 0)}
        saveAction={saveFaq}
        deleteAction={deleteFaq}
        reorderAction={reorderFaqs}
        importAction={importFaqs}
      />
    </div>
  );
}
