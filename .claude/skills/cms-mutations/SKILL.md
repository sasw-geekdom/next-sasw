---
name: cms-mutations
description: |
  The write path for SASTW admin/CMS data — server actions in `lib/admin/*-actions.ts`
  that touch Firestore or Vercel Blob. Covers the revalidation contract (which
  public surface each entity feeds), auth placement, the FormData→zod→Firestore
  shape, and Blob cleanup on replace/delete.
  Use when: adding or editing a server action, adding a CMS entity, changing what
  the homepage wall or a public page reads, or debugging "I saved it in the admin
  but the public page still shows the old thing."
---

# CMS mutations

Every mutation lives in a `"use server"` file under `lib/admin/` and follows the
same five beats, in order:

```
requireAdmin()  →  parse with zod  →  Blob work  →  Firestore write  →  revalidate
```

## 1. Auth first, always

`await requireAdmin()` is the first line of every exported action. The `proxy.ts`
guard is a redirect for humans, not a security boundary — an action is directly
callable. Never rely on the caller having come through a guarded page.

## 2. The revalidation contract — the part that actually bites

**The homepage is the only ISR'd public page** (`revalidate = 300` in
[app/(site)/page.tsx](app/(site)/page.tsx)). Every admin page is
`force-dynamic`. That asymmetry is the whole game:

- Miss a `revalidatePath("/")` and the edit is invisible to the public for **up
  to five minutes**. This is a real bug that has shipped here before — partner
  and sponsor *save/delete* busted only on reorder until commit `0d5c207`.
- Miss an admin-path revalidate and you get a stale client router cache on
  back-navigation. Annoying, self-correcting, not user-facing.

So: **when a write touches anything the homepage reads, bust `/`.** The homepage
currently reads partners and sponsors (`listPartners`, `listSponsors`).

Current entity → public surface map:

| entity | public surface | bust |
|---|---|---|
| partners, sponsors | homepage wall | `/admin/content/<entity>` **+ `/`** |
| speakers, sessions | *(no public page yet)* | admin path only |
| gallery | `/15-years` (force-dynamic) | `/admin/content/gallery` + `/15-years` |
| emails, get-involved, registrations, check-in | admin only | admin path(s) |

The shared `revalidate(entity)` helper in
[lib/admin/cms-actions.ts](lib/admin/cms-actions.ts) already encodes the
partners/sponsors → `/` rule. Use it rather than hand-rolling `revalidatePath`.

**When the public schedule or speakers pages land, update that helper first** —
speakers and sessions move into the "bust `/` too" column and every existing
action inherits it for free.

Deletes revalidate exactly like saves. That's the rule the old bug broke.

Cross-entity effects count: deleting a speaker also revalidates `sessions`,
because sessions reference speaker ids.

## 3. Validation

Parse `FormData` through a zod schema from
[lib/validation/schemas.ts](lib/validation/schemas.ts) and return the flattened
field errors — never write unparsed form input to Firestore:

```ts
if (!parsed.success) {
  return { ok: false, error: "Check the form.", issues: parsed.error.flatten().fieldErrors };
}
```

Every action returns `SaveResult` (`{ok:true,id}` | `{ok:false,error,issues?}`).
Actions don't throw for user error and don't redirect — the client component owns
the toast and the navigation.

## 4. Blob cleanup

Vercel Blob objects are not garbage-collected. An orphan costs money forever.

- **Replacing** an image: `deleteImage(snap.get("imageUrl"))` *before* writing the
  new url.
- **Deleting** a doc: `deleteImage` first, then `ref.delete()`.
- Image upload failure is a returned error, not a throw — wrap `uploadImage` and
  map `ImageError` to `{ok:false}`.

## 5. New-entry ordering

New docs get `order: Date.now()` so they sort after anything a human has
drag-ordered, plus `createdAt: FieldValue.serverTimestamp()`. Reorder writes go
through a single `batch()`.
