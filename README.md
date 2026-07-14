# San Antonio Startup + Tech Week (SASTW)

The event application for **San Antonio Startup + Tech Week** — Year 11, **Sept 28 – Oct 2, 2026**. A custom public site plus a gated staff admin portal, built for the Geekdom team.

_"The current runs through SA. Plug in."_

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **pnpm** (package manager) · Node **≥ 20.19** for local dev
- **Firebase** — client SDK (browser auth) + **Admin SDK** (server); **Firestore** (`(default)` db)
- **Storage split** — **Vercel Blob** for images (speaker/partner/sponsor uploads); **Firebase Storage** for video and the archive gallery
- **Resend** — branded transactional email (`send.sasw.co`)
- **Vercel** — Analytics, BotID (invisible CAPTCHA on public forms), Blob
- **Google Analytics 4** — client tracking (`@next/third-parties`) + server reporting (Analytics Data API)
- **motion** (Framer Motion) · **lucide-react** · raw WebGL for the hero bolt shader

## Features

### Public site (`app/(site)`)
- **Hero** — a WebGL fragment-shader "current" flowing through the SASTW bolt, reacting to cursor/touch and the five **circuits** (tracks).
- **Call for Speakers** & **Register** — validated forms (zod), protected by BotID, writing to Firestore and sending branded Resend confirmations.
- **`/15-years`** — a "15 Years of Geekdom" photo gallery (served from a Storage folder via signed URLs).
- SEO: metadata, `next/og` Open Graph + Twitter image, `robots.txt`, `sitemap.xml`, `llms.txt`.

### Admin portal (`app/admin`, gated)
- **Auth** — Google sign-in restricted to the `@geekdom.com` workspace, plus an email/password superadmin. Sessions are Admin-SDK-verified httpOnly cookies; `proxy.ts` guards `/admin/*` and every route re-verifies server-side.
- **Dashboard** — GA4 web analytics (sessions/users/page views/engagement) + a registrations-by-day snapshot.
- **Speaker submissions** — review, status workflow, one-click promote to the Speakers CMS, filtered CSV export.
- **Registrations** — searchable list + CSV export.
- **Check-in** — search-first, one-tap, transactional/idempotent, with an event-day breakdown.
- **Content management** — partners, sponsors, speakers, and sessions (with speaker/moderator assignment per track).
- App shell with a collapsible sidebar, ⌘K command menu, and a mobile drawer.

## Getting started

**Prerequisites:** [pnpm](https://pnpm.io) and Node **≥ 20.19** (see `.nvmrc`; run `nvm use`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

> Use `pnpm dev`, not `pnpm start`, for local work — BotID's `checkBotId()` requires the Vercel runtime and only enforces on a deployed environment; under `next dev` it's bypassed so the forms work.

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |

## Environment

Copy the keys into `.env.local` (gitignored). On Vercel, set the same values in **Project Settings → Environment Variables** (Production + Preview).

```bash
# Firebase client (browser) — public web config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only) — base64 or raw JSON service account, one line
GOOGLE_SERVICE_ACCOUNT_KEY=
# FIREBASE_DATABASE_ID=          # only if using a named Firestore database

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM=San Antonio Startup + Tech Week <hello@send.sasw.co>
RESEND_REPLY_TO=

# Access control
ALLOWED_WORKSPACE_DOMAIN=geekdom.com
NEXT_PUBLIC_ALLOWED_WORKSPACE_DOMAIN=geekdom.com
SUPER_ADMIN_EMAILS=jesseovr@gmail.com

# Vercel Blob (images)
BLOB_READ_WRITE_TOKEN=
BLOB_STORE_ID=

# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=     # G-XXXXXXX (client tracking)
GA4_PROPERTY_ID=                   # numeric property id (server reporting)
```

**Security rules** — Firestore and Storage are deny-all to the client SDK (`firestore.rules`, `storage.rules`); all access goes through the Admin SDK server-side. Deploy them with:

```bash
pnpm dlx firebase-tools deploy --only firestore:rules,storage
```

## Deployment

- Deployed on **Vercel**. Env vars and (if used) a Blob store must be configured in the project.
- **firebase-admin is pinned to v12** — v14 pulls an ESM-only `jose`, which fails with `ERR_REQUIRE_ESM` on Node runtimes below 20.19. v12's CommonJS chain runs on any Node version.
- After deploy, verify: the Resend sending domain (`send.sasw.co`), BotID in the Firewall settings, and grant the service account **Viewer** on the GA4 property (and enable the Analytics Data API) for the dashboard.

## Project structure

```
app/
  (site)/            # public site (hero, register, call-for-speakers, 15-years)
  admin/             # gated staff portal (login + protected shell)
  api/               # route handlers (auth session, form intake, exports)
  opengraph-image.tsx, robots.ts, sitemap.ts
components/          # ui primitives, site, admin (shell, cms, dashboard), forms
lib/
  firebase/          # client + Admin SDK init, collections
  auth/              # roles, session, guards
  admin/             # queries, actions, CMS, metrics
  analytics/         # GA4 Data API
  tracks.ts, event.ts, gallery.ts
proxy.ts             # /admin/* redirect guard (Next 16 renamed middleware → proxy)
```

> **Note:** this project tracks a fast-moving Next.js — APIs and conventions may differ from older docs. When in doubt, read the bundled guides in `node_modules/next/dist/docs/` (see `AGENTS.md`).
