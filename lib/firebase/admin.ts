import "server-only";

import { readFileSync } from "node:fs";
import {
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * Resolve the service-account credential. Order:
 *   1. GOOGLE_SERVICE_ACCOUNT_KEY — base64 JSON or raw JSON (single line)
 *   2. ./serviceAccountKey.json — local-dev fallback (gitignored)
 */
function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();

  if (raw) {
    // Raw JSON starts with "{"; otherwise treat as base64.
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as ServiceAccount;
  }

  try {
    return JSON.parse(
      readFileSync("./serviceAccountKey.json", "utf8"),
    ) as ServiceAccount;
  } catch {
    throw new Error(
      "No Firebase Admin credential found. Set GOOGLE_SERVICE_ACCOUNT_KEY or add ./serviceAccountKey.json.",
    );
  }
}

const serviceAccount = loadServiceAccount();

export const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

export const adminAuth = getAuth(adminApp);

// Firestore database id. The console's default database is "(default)"; set
// FIREBASE_DATABASE_ID only if this project uses a named database.
const databaseId = process.env.FIREBASE_DATABASE_ID;
export const adminDb = databaseId
  ? getFirestore(adminApp, databaseId)
  : getFirestore(adminApp);

export const adminStorage = getStorage(adminApp);
