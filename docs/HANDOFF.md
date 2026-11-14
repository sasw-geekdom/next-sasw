# SASTW platform — handoff guide

**Written for Geekdom staff and whoever maintains the site next.** It covers
what you are receiving, the accounts behind it, how to move or keep the
hosting, the settings it needs, and how to run it day to day.

Some handoff steps are done by the contractor, Jesse Hernandez, before the
site changes hands; the rest are Geekdom's. Each step below says which. The [README](../README.md) covers local
development; [docs/SCOPE.md](SCOPE.md) records the decisions made while
building it.

> **Before handoff, the contractor rotates every secret** (see [Secrets to rotate](#secrets-to-rotate)),
> and Geekdom takes the contractor's email out of `SUPER_ADMIN_EMAILS` once it no longer needs their help.

---

## 1. What you are receiving

| Item | Where it lives |
| --- | --- |
| Source code | GitHub: `sasw-geekdom/next-sasw` (branch `main` is production) |
| Public site | `https://www.sasw.co` |
| Staff admin | `https://www.sasw.co/admin` |
| Database | Firebase project `sasw2026-783a5`, Firestore `(default)` database |
| Images uploaded in the admin | Vercel Blob store attached to the Vercel project |
| Archive photos and video | Firebase Storage, same project |
| Email | Resend, sending from `send.sasw.co` |
| Analytics | Google Analytics 4 property, plus Vercel Analytics |
| 2026 sponsor report | `/sponsor-report` and its PDF at `/SASTW-2026-Sponsor-Report.pdf` |

## 2. Accounts

Every service is already Geekdom's: each one is tied to
**marketingteam@geekdom.com**. Nothing needs transferring. The handoff is
making sure that account holds the top role everywhere, rotating the secrets,
and then removing the contractor's access.

| Service | What it does here | Contractor, before handoff | Geekdom, after |
| --- | --- | --- | --- |
| **GitHub** (`sasw-geekdom`) | The code | Confirm marketingteam@ is an organization **Owner**. | Remove the contractor from the organization. |
| **Vercel** | Hosting, builds, Blob storage, BotID, Analytics, the weekly cron | Confirm marketingteam@ is a team **Owner**. | Remove the contractor from the team. |
| **Firebase / Google Cloud** (`sasw2026-783a5`) | Database, file storage, staff sign-in | Confirm marketingteam@ has the **Owner** role in IAM. | Remove the contractor from IAM. |
| **Resend** | All outgoing email from `send.sasw.co` | Confirm marketingteam@ is the account **admin**. | Remove the contractor from the team. |
| **Google Analytics 4** | Site analytics and the admin dashboard | Confirm marketingteam@ is the property **Administrator**. | Keep the service account (below) as **Viewer**; remove the contractor. |
| **Domain** (`sasw.co`, GoDaddy) | DNS for the site and the email domain | List the DNS records Vercel and Resend depend on, so nobody removes them. | Keep those records in place when editing DNS in GoDaddy. |

A member or editor role is not enough: with only those, nobody at Geekdom could
add a teammate or change billing once the contractor has gone. Check the role,
not just the access.

## 3. Hosting: keep Vercel or move

**Recommended: stay on Vercel.** The project is already in Geekdom's Vercel
account, and the site uses Vercel features directly — moving off them is real
work:

- **BotID** protects the public forms from bots (`checkBotId()` in the form handlers).
- **Vercel Blob** stores every image uploaded in the admin.
- **Vercel Cron** runs the weekly registration digest (`vercel.json`).
- **Vercel Analytics** counts traffic alongside GA4.

**If you move to another host**, it must run Next.js 16 on Node 20 with
server functions (not a static export), and you will need replacements for the
four features above: another bot check on `/api/register` and
`/api/get-involved`, an image store (and a migration of existing Blob URLs, which
are written into Firestore), a scheduler that calls `/api/cron/digest` with the
`CRON_SECRET` bearer token, and analytics. Budget for it as a project.

### Vercel project settings to keep

- **Node.js version: 20.x.** Set in the Vercel dashboard (not in a file). See
  [Known constraints](#7-known-constraints).
- **Build command:** the default `pnpm build`. It runs a sponsor-report PDF
  check first (warn-only), then `next build`.
- **Environment variables:** every name in the table below, for Production and Preview.

## 4. Environment variables

Set in Vercel → Project Settings → Environment Variables. Values are never in
the repo. **Required** means the site breaks without it.

| Name | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | Yes | Firebase web config (Firebase console → Project settings → Your apps). Public by design. |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Yes | Firebase Admin service-account key, as one-line JSON or base64. Server only. **Secret.** |
| `FIREBASE_DATABASE_ID` | No | Only if a named Firestore database replaces `(default)`. |
| `RESEND_API_KEY` | Yes | Resend API key. **Secret.** |
| `RESEND_FROM` | Yes | Sender, e.g. `San Antonio Startup + Tech Week <hello@send.sasw.co>`. Must be on the verified domain. |
| `RESEND_REPLY_TO` | No | Inbox replies go to. |
| `TEAM_NOTIFY_EMAILS` | No | Who is told about new form submissions. Defaults to programs@, lesliechasnoff@ and brooke@geekdom.com. |
| `DIGEST_EMAILS` | No | Who gets the Monday registration digest. Defaults to the above plus justin@geekdom.com. |
| `ALLOWED_WORKSPACE_DOMAIN` | Yes | Google Workspace domain whose accounts are staff (`geekdom.com`). |
| `SUPER_ADMIN_EMAILS` | Yes | Comma-separated; full access including user management, any domain. |
| `DOOR_EMAILS` | No | Comma-separated; check-in screen only (badge-desk volunteers). |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob token. Added automatically when a Blob store is connected. **Secret.** |
| `CRON_SECRET` | Yes | Bearer token the weekly cron must send; set any long random string. **Secret.** |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Yes | GA4 measurement ID (`G-…`). |
| `GA4_PROPERTY_ID` | For the dashboard | Numeric GA4 property ID; the admin dashboard reads it. |

`NEXT_PUBLIC_ALLOWED_WORKSPACE_DOMAIN` and `BLOB_STORE_ID` appear in older
setups but nothing in the code reads them; they can be removed.

### Secrets to rotate

The contractor does this last, once marketingteam@'s roles are confirmed. Issue new
values, update Vercel, then revoke the old ones:
`GOOGLE_SERVICE_ACCOUNT_KEY` (Google Cloud → IAM → Service accounts → Keys),
`RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`. Redeploy after.

### One-time setup that lives outside the code

- **GA4 dashboard:** give the service account's email **Viewer** on the GA4
  property and enable the Google Analytics Data API in its Cloud project.
- **Sponsor-report analytics:** in GA4 → Admin → Custom definitions, create
  event-scoped custom dimensions for `sponsor` and `section`.
- **Firebase Auth:** the production domain must be in Authentication →
  Settings → Authorized domains, or staff sign-in fails.
- **Security rules:** Firestore and Storage deny all browser access; the server
  reads through the Admin SDK. After changing them:
  `pnpm dlx firebase-tools deploy --only firestore:rules,storage`.

## 5. Running the admin

Sign in at `/admin`.

**Who can get in** (set by environment variables, no code change):

| Role | Who | Can do |
| --- | --- | --- |
| Superadmin | `SUPER_ADMIN_EMAILS` | Everything, including user management |
| Staff | Any `@geekdom.com` Google account | Everything except user management |
| Door | `DOOR_EMAILS` | The check-in screen only |

To give someone access, add their email to the right variable in Vercel and
redeploy. Staff need nothing added: a Geekdom account is enough.

**What each area does:**

- **Registrations** — search, filter and export attendees as CSV.
- **Check-in** — search a name, check them in, add a walk-up.
- **Speakers** (review) — speaker applications: accept, decline, export, and
  promote an accepted speaker into the Speakers content.
- **Get Involved** — sponsor, host and general enquiries, with export.
- **Content → Partners / Sponsors** — logos, names, links, display order. These feed the homepage wall.
- **Content → Speakers / Sessions** — the public lineup and schedule.
- **Content → FAQ** — the questions on the public Attending page (`/faq`):
  add, edit, reorder, move between sections. The three sections and their
  badge-desk list and parking map stay fixed. The first time, press **Import
  the current FAQ** to bring the built-in answers in to edit.
- **Content → Emails** — the wording of every automated email, with test
  sends; the Know Before You Go send; and one-off broadcasts to all registrants.
- **Content → Gallery** — **Sync** turns the originals in Firebase Storage
  (`15-years/`) into the `/15-years` photo wall.

Public pages refresh within seconds of a save. If a change ever seems missing,
it will appear within five minutes regardless.

## 6. Routine tasks

**Deploying a change.** Push to `main`; Vercel builds and deploys. Before
pushing, run `pnpm build` locally (stop `pnpm dev` first) — a passing typecheck
is not a passing build.

**The sponsor report PDF.** The web report and the PDF read the same data
(`lib/sponsor-report.ts`). After changing the report's words, photos or logos,
re-save the PDF with the dev server running:

```bash
pnpm add -D playwright && pnpm exec playwright install chromium   # once
pnpm dev                     # in one terminal
pnpm report:pdf              # in another; writes public/SASTW-2026-Sponsor-Report.pdf
```

`pnpm report:check` (also run by every build) warns when the PDF is out of
date. It can't see logo changes in the CMS, so re-save after those by hand.
A tagged link, `/sponsor-report?for=nopalera`, highlights that sponsor's
credits and tags their reading in analytics.

**Adding a sponsor or partner logo.** Content → Sponsors/Partners → Add. Use a
logo on a transparent background; the dark sections need a light or
full-colour mark.

## 7. Known constraints

- **Node 20 and `firebase-admin` v12 go together.** v14 of `firebase-admin`
  needs Node 22. Upgrading means moving Node first — `.nvmrc`, `engines` in
  `package.json`, and the Vercel project's Node setting — or staff sign-in
  breaks in production. A blanket "update all dependencies" will break it.
- **`pnpm` only.** The lockfile is `pnpm-lock.yaml`; don't add npm or yarn lockfiles.
- **Local testing uses `pnpm dev`**, not `pnpm start`: the bot check only works
  on Vercel and rejects every form submission against a local production build.
- **The `/admin` guard is `proxy.ts`** (Next.js 16's name for middleware), and
  every admin route checks access again on the server. A `middleware.ts` file
  would silently never run.
- **Share-card assets live in `public/brand/`.** Don't read files out of
  `node_modules` at request time; it works in the build and fails in production.

## 8. What the original agreement leaves to you

Per the SOW, ongoing hosting costs, third-party subscriptions (Vercel, Resend,
Firebase/Google Cloud), maintenance, security updates and new features are not
included after the engagement. Defects in delivered work reported within 30
days of completion are covered by the warranty.

## Handoff checklist

**Contractor, before handoff**

- [ ] marketingteam@geekdom.com confirmed as Owner/Administrator on GitHub, Vercel, Google Cloud, Resend and GA4
- [ ] DNS records that Vercel and Resend depend on listed for Geekdom
- [ ] Secrets rotated and the site redeployed

**Geekdom, after**

- [ ] Vercel's Node.js version confirmed at 20.x
- [ ] FAQ imported into the CMS (Content → FAQ)
- [ ] GA4: `sponsor` and `section` custom dimensions created; service account kept as Viewer
- [ ] Contractor removed from GitHub, Vercel, Google Cloud, Resend, GA4 and `SUPER_ADMIN_EMAILS` once their help is no longer needed
