import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Legacy paths that differ from their destination only by case.
 *
 * These can't live in next.config's `redirects()`: that matcher runs
 * case-insensitively, so `/Speakers` also matches `/speakers` and the rule
 * redirects the live page to itself — verified, it 308s in a loop until the
 * browser gives up. Here the comparison is an exact string match, so only the
 * capitalised spelling is caught.
 *
 * Everything else from the old site is in next.config, where it belongs.
 */
const LEGACY_EXACT: Record<string, string> = {
  "/Speakers": "/speakers",
};

/**
 * Lightweight gate for /admin/*. Redirects to the login page when no session
 * cookie is present — a UX fast-path only. Real verification (cookie validity,
 * revocation, role) happens in app/admin/layout.tsx and every route handler;
 * proxy is never the sole auth check.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacy = LEGACY_EXACT[pathname];
  if (legacy) {
    return NextResponse.redirect(new URL(legacy, request.url), 308);
  }

  // The matcher below is case-insensitive too, so `/speakers` reaches this
  // function. Anything that isn't an admin path leaves untouched — without
  // this guard a signed-out visitor to `/speakers` would be bounced to the
  // admin login.
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isLogin = pathname === "/admin/login";
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession && !isLogin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in and hitting the login page — send them inside.
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/Speakers"],
};
