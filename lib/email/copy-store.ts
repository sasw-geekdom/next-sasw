import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, EMAIL_SETTINGS_DOC } from "@/lib/firebase/collections";
import {
  EMAIL_TEMPLATES,
  mergeCopy,
  type EmailCopy,
  type EmailTemplateKey,
} from "@/lib/email/templates";

// Single settings doc holds the admin-edited copy for every template. Missing
// or blank fields fall back to the in-code defaults, so a fresh install (empty
// doc) still sends the branded originals.
const emailSettingsDoc = () =>
  adminDb.collection(COLLECTIONS.settings).doc(EMAIL_SETTINGS_DOC);

export interface EmailCopyConfig {
  copies: Record<EmailTemplateKey, EmailCopy>;
  updatedAt: number | null;
  updatedBy: string | null;
}

export async function getEmailCopyConfig(): Promise<EmailCopyConfig> {
  const snap = await emailSettingsDoc().get();
  const d = snap.exists ? (snap.data() ?? {}) : {};
  const copies = {} as Record<EmailTemplateKey, EmailCopy>;
  for (const t of EMAIL_TEMPLATES) {
    copies[t.key] = mergeCopy(t.defaults, d[t.key]);
  }
  return {
    copies,
    updatedAt: d.updatedAt instanceof Timestamp ? d.updatedAt.toMillis() : null,
    updatedBy: typeof d.updatedBy === "string" ? d.updatedBy : null,
  };
}

/** The merged copy for one template — used by the send routes. */
export async function getEmailCopy(key: EmailTemplateKey): Promise<EmailCopy> {
  const config = await getEmailCopyConfig();
  return config.copies[key];
}
