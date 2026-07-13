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

// Google provider, hinted to the Geekdom workspace domain. The `hd` param is a
// UX hint only — the real domain gate is enforced server-side (lib/auth).
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  hd: process.env.NEXT_PUBLIC_ALLOWED_WORKSPACE_DOMAIN ?? "geekdom.com",
  prompt: "select_account",
});
