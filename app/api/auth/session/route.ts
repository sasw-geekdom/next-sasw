import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";

// Exchange a Firebase ID token for an httpOnly session cookie.
export async function POST(request: Request) {
  let idToken: string | undefined;
  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  let result;
  try {
    result = await createSession(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  // Verified, but not a Geekdom workspace account or superadmin.
  if (!result) {
    return NextResponse.json(
      { error: "This account isn't allowed. Use your Geekdom email." },
      { status: 403 },
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, result.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: result.maxAge,
  });

  return NextResponse.json({ user: result.user });
}

// Sign out — clear the session cookie.
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
