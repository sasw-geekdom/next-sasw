---
name: data-access
description: |
  How SASTW reads and writes Firestore, Firebase Storage, and Vercel Blob — the
  deny-all client rule, Admin-SDK-only server access, the two-backend storage
  split (Blob = images, Storage = video/gallery), session cookie verification,
  and which env vars are server-only.
  Use when: adding a Firestore query or collection, wiring an upload, touching
  auth/session/roles, adding an API route that reads data, or deciding where a
  new asset should live.
---

# Data access

## The one rule

**The client SDK can't read or write anything.** `firestore.rules` and
`storage.rules` are deny-all. Every read and write goes through the Admin SDK,
server-side. The browser Firebase client exists for exactly one job: producing an
ID token at sign-in.

If you find yourself importing `lib/firebase/client.ts` outside the auth flow,
stop — you want a server component or a server action instead.

## Sign-in → session

1. Browser gets a Firebase ID token (Google provider, or email/password for
   superadmin).
2. `POST /api/auth/session` verifies it with the Admin SDK and mints an httpOnly
   session cookie.
3. Every admin route calls `requireAdmin()` and re-verifies server-side.

Access is gated on `ALLOWED_WORKSPACE_DOMAIN` (`@geekdom.com`) plus
`SUPER_ADMIN_EMAILS`. Two tiers: staff and superadmin. [proxy.ts](proxy.ts)
redirects unauthenticated humans away from `/admin/*` — it is UX, **not** the
security boundary. The boundary is `requireAdmin()` in the route or action.

## Storage split

| backend | holds | why |
|---|---|---|
| **Vercel Blob** | images — speaker headshots, partner/sponsor logos | fast, cheap, public urls, `BLOB_READ_WRITE_TOKEN` server-only |
| **Firebase Storage** | video, the `/15-years` archive gallery | heavier media, signed-url access |

Uploads never go direct from the browser. They post to an admin-gated route,
which validates size and type and then writes. See
[lib/admin/blob.ts](lib/admin/blob.ts).

Blob objects outlive their Firestore doc unless you delete them explicitly — see
the `cms-mutations` skill for the cleanup contract.

## Collections

Reference collections through `COLLECTIONS` in
[lib/firebase/collections.ts](lib/firebase/collections.ts), not string literals,
so a rename is one edit.

Public intake (`registrations`, `speakerSubmissions`, get-involved) is
write-only from the public API routes, and those routes run `checkBotId()`
**before** the Firestore write or the Resend send — not after.

## Env vars

Anything without the `NEXT_PUBLIC_` prefix is server-only and must never reach a
client component: `GOOGLE_SERVICE_ACCOUNT_KEY`, `RESEND_API_KEY`,
`BLOB_READ_WRITE_TOKEN`, `GA4_PROPERTY_ID`, `CRON_SECRET`. Files that read them
should import `server-only`.

Firestore runs on the `(default)` database. `firebase-admin` is pinned to v12 —
see [AGENTS.md](AGENTS.md) before touching that dependency.
