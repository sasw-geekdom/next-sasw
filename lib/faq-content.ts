import "server-only";

import { listFaqs } from "@/lib/admin/cms-queries";
import { FAQ, faqFromRows, type FaqSection } from "@/lib/faq";

/**
 * The FAQ the public page shows.
 *
 * From the CMS once anyone has saved a question there; until then — and if
 * Firestore can't be reached — the answers built into lib/faq.ts, so the page
 * is never empty and the switch to CMS editing changes nothing a visitor
 * sees. The admin's FAQ page imports those built-in answers as its start.
 */
export async function getFaqSections(): Promise<FaqSection[]> {
  try {
    const rows = await listFaqs();
    return rows.length > 0 ? faqFromRows(rows) : FAQ;
  } catch {
    return FAQ;
  }
}
