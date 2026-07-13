# SASTW Event Application — Scope of Work

Custom event application for **San Antonio Startup + Tech Week** (SASTW), built for the
Geekdom team. Public marketing/event site + gated admin portal for content management,
submission review, and event-day check-in.

- **Event:** Year 11 · Sept 28 – Oct 2, 2026 · anchored downtown at Texas Public Radio.
- **Voice:** terse, active verbs, one metaphor per page (current / circuit / power / plug in).
  Anchor CTA: **"Plug in."**

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Default theme | **Light** (white bg, black text, magenta/blue accents) |
| 2 | Admin roles | **Two tiers** — Geekdom staff (full admin) + superadmin (everything + user mgmt) |
| 3 | Registration | **Free RSVP** (no payment) |
| 4 | Accepted speaker → CMS | **Manual one-click promote** |
| 5 | BotID level | **Basic** (free) on both public forms; upgrade later if spam appears |
| 6 | CMS/form headshot storage | **Vercel Blob** (option B). Firebase Storage reserved for video. |

## Stack

- **pnpm** (package manager) · Next 16.2.10 (App Router) · React 19 · Tailwind v4 · TypeScript
- **Firebase**: client SDK (browser) + Admin SDK (server), Firestore db `default`
- **Storage split**: Vercel Blob = images (speaker/partner/sponsor + public headshots);
  Firebase Storage = video / heavier media
- **Auth**: Google provider gated to `@geekdom.com` workspace + email/password superadmin
- **Email**: Resend (branded transactional email)
- **Vercel platform**: Analytics + BotID (invisible CAPTCHA on public forms)

## Brand tokens

| Token | Value |
|-------|-------|
| Magenta | `#ff32a0` |
| Space Blue | `#00266f` |
| Black | `#000000` |
| White | `#ffffff` |

- **Display / headings:** Oswald (bold) — `next/font/google`
- **Body:** Geist Sans — `next/font/google`
- **Data / metadata:** Geist Mono
- Type scale (from brand): Title 60 · Subtitle 24 · Heading 24 · Subheading 18 ·
  Section Header 15 · Body 12 · Quote 15 · Caption 9

---

## Phases

### Phase 0 — Design system & foundations
- Switch package manager to **pnpm** (drop `package-lock.json`, generate `pnpm-lock.yaml`,
  pin `packageManager` in `package.json`).
- Wire **Oswald** (display) alongside Geist Sans (body) + Geist Mono in `app/layout.tsx`;
  real metadata / OG, remove Create-Next-App defaults.
- Brand tokens in `globals.css` `@theme` — colors + type scale. **Light** theme default.
- Install + wire **Vercel Analytics** (`<Analytics />` in root layout) and **BotID**
  (client challenge on public layout).
- Base UI primitives: Button, Input, Textarea, Select, Card, Badge, Table, Toast, Dialog,
  empty/loading states. Public layout vs. gated admin layout.

### Phase 1 — Firebase & auth (the gate)
- Firebase client init + Admin SDK init (from `GOOGLE_SERVICE_ACCOUNT_KEY`, db `default`).
- Google sign-in restricted to `@geekdom.com` (`ALLOWED_WORKSPACE_DOMAIN`) — verified
  server-side on every admin request. Email/password path for superadmin
  (`SUPER_ADMIN_EMAILS`).
- Session: Firebase ID token → server-verified session cookie (Admin SDK); route-guard on
  `/admin/*`. Two-tier role model.
- **Firestore + Storage + Blob security rules.** Admin collections locked to verified staff;
  public forms write-only to intake collections.

### Phase 2 — Public intake forms + branded email
- **Call for Speakers** form → `speakerSubmissions` (name, email, session title, abstract,
  bio, headshot → **Vercel Blob**, links, availability).
- **Registration** form → `registrations` (name, email, company/role, interest). Generates
  check-in identity.
- **BotID** guards both submit routes — `checkBotId()` server-side *before* Firestore write
  or Resend send. Basic level.
- **Resend** branded confirmation emails (SASTW voice) on both submissions.

### Phase 3 — Admin: submissions dashboards
- Speaker submissions: table + detail drawer, filter/search, status workflow
  (new → reviewing → accepted → declined), CSV export.
- Registrations: table, search, counts, CSV export.
- Read via server components / Admin SDK with auth check.

### Phase 4 — Check-in portal
- Search (name/email) over registrations, live results.
- One-tap check in → `checkedInAt` + `checkedInBy`; idempotent, no double check-in.
- Event-day counts: registered vs. checked-in, recent check-ins. Tablet-friendly.

### Phase 5 — Content management (CMS)
- **Partners** (name, logo → Blob, URL, tier).
- **Sponsors** (+ sponsorship level).
- **Speakers** (name, headshot → Blob, bio, company, links). Manual promote from accepted
  submissions.
- **Sessions** (title, description, time/room, Circuit) with **speaker/moderator selection** —
  many-to-many `participants: [{speakerId, role}]` for panels.
- Image uploads → **Vercel Blob** via admin-gated route (`BLOB_READ_WRITE_TOKEN`,
  server-only). Delete Blob object on doc/image removal.

### Phase 6 — Public content surfaces
- Schedule / Circuits by day, room, speakers, moderators.
- Speakers grid + detail. Sponsors / Partners wall by tier.
- Home/landing — Oswald headline, one CTA, the current metaphor.

### Phase 7 — Media & storage hardening
- Two backends: **Vercel Blob** (images) + **Firebase Storage** (video). Typed paths,
  size/type validation, cleanup-on-delete, signed access where needed.

### Phase 8 — Hardening & deploy
- Rate-limit public forms, input sanitation (BotID already handles bot challenge).
- Error boundaries, logging, Firestore composite indexes.
- Accessibility + responsive pass (WCAG per brand accessibility note).
- Vercel deploy: provision Blob store, Analytics reporting, BotID observability + WAF bypass
  for legit automation, Resend domain verification, env parity.

---

## Data model (first pass)

Firestore, db `default`:

- `registrations` — attendee + `checkedInAt` / `checkedInBy`
- `speakerSubmissions` — public form intake + review status
- `speakers` — CMS
- `sessions` — CMS, `participants: [{speakerId, role: 'speaker' | 'moderator'}]`
- `sponsors` — CMS
- `partners` — CMS
- `staff` — roles (staff / superadmin)

## Environment (already scaffolded in `.env.local`)

- `NEXT_PUBLIC_FIREBASE_*` — client config
- `GOOGLE_SERVICE_ACCOUNT_KEY` — Admin SDK
- `RESEND_API_KEY`
- `ALLOWED_WORKSPACE_DOMAIN`, `SUPER_ADMIN_EMAILS`
- `BLOB_READ_WRITE_TOKEN` — **to add** (Vercel Blob, server-only)
