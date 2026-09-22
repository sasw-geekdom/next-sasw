import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Browser-side Firebase config. NEXT_PUBLIC_* values ship to the client by
// design — this is public web config, not a secret.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Reuse the app across HMR reloads.
export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

/**
 * Google provider, no longer pinned to one domain.
 *
 * It used to pass `hd` — the workspace hint — which the comment here called a
 * UX hint. That undersold it: Google hides every account outside `hd` in the
 * chooser, so an account on any other domain cannot get through the picker at
 * all. That was fine while the portal was Geekdom-only and is not now, because
 * the badge desks are being run with Launch SA, whose accounts are on
 * launchsa.org — the hint would have locked them out before the server ever
 * saw them.
 *
 * Dropping it costs nothing in access control: `resolveRole` in lib/auth is
 * the gate and always was, and it runs server-side on a verified token. What
 * it costs is a worse wrong turn — somebody signing in with a personal account
 * now reaches a "not permitted" instead of not seeing the account. The login
 * page says which accounts work.
 */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
