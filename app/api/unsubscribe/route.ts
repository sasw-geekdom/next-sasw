import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { UNSUBSCRIBED_FIELD, verifyUnsubscribe } from "@/lib/email/unsubscribe";

// Opting out of team emails. Two callers:
//
// - Email apps' own Unsubscribe button (RFC 8058): a POST with the body
//   `List-Unsubscribe=One-Click`, answered with a bare 200.
// - The /unsubscribe page's button: a form POST, answered with a redirect
//   back to the page saying it's done.
//
// Never on GET. Link scanners and preview bots follow every link in an email,
// and a GET that unsubscribed would opt people out without them clicking.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("r") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const body = await req.text().catch(() => "");
  const oneClick = body.includes("List-Unsubscribe=One-Click");

  if (!verifyUnsubscribe(id, token)) {
    return oneClick
      ? new NextResponse("Invalid link", { status: 400 })
      : NextResponse.redirect(new URL(`/unsubscribe?invalid=1`, url.origin), 303);
  }

  // "test" is the id test sends sign: a working link that belongs to nobody.
  if (id !== "test") {
    const ref = adminDb.collection(COLLECTIONS.registrations).doc(id);
    const snap = await ref.get();
    if (snap.exists && !snap.get(UNSUBSCRIBED_FIELD)) {
      await ref.update({ [UNSUBSCRIBED_FIELD]: FieldValue.serverTimestamp() });
    }
  }

  return oneClick
    ? new NextResponse("Unsubscribed", { status: 200 })
    : NextResponse.redirect(new URL(`/unsubscribe?done=1`, url.origin), 303);
}

export async function GET(req: Request) {
  // Anyone who lands here directly goes to the page, which asks first.
  const url = new URL(req.url);
  return NextResponse.redirect(new URL(`/unsubscribe${url.search}`, url.origin), 303);
}
