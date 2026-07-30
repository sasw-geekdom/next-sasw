# SASTW Event Application — Scope of Work

Custom event application for **San Antonio Startup + Tech Week** (SASTW), built for the
Geekdom team. Public marketing/event site + gated admin portal for content management,
submission review, and event-day check-in.

- **Event:** Year 11 · Sept 28 – Oct 2, 2026 · anchored downtown at Texas Public Radio.
- **Voice, brand tokens, type scale:** see the `sastw-voice` skill
  (`.claude/skills/sastw-voice/`) — the single source, so it doesn't drift from
  `app/globals.css`.

This file is the **decision record**, not a task list. Phases 0–5 and 7 shipped;
git history is the build log. What's still open is at the bottom.

## Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Default theme | **Light** (white bg, black text, magenta/blue accents) |
| 2 | Admin roles | **Two tiers** — Geekdom staff (full admin) + superadmin (everything + user mgmt) |
| 3 | Registration | **Free RSVP** (no payment) |
| 4 | Accepted speaker → CMS | **Manual one-click promote** |
| 5 | BotID level | **Basic** (free) on both public forms; upgrade later if spam appears |
| 6 | CMS/form headshot storage | **Vercel Blob** (option B). Firebase Storage reserved for video. |
| 7 | Circuit colors | **None** — circuits differentiate by charge/intensity, palette stays magenta + space blue |

## Stack

- **pnpm** · Next 16 (App Router) · React 19 · Tailwind v4 · TypeScript
- **Firebase**: client SDK (browser auth only) + Admin SDK (server), Firestore db `(default)`
- **Storage split**: Vercel Blob = images (speaker/partner/sponsor + public headshots);
  Firebase Storage = video / the 15-years archive
- **Auth**: Google provider gated to `@geekdom.com` workspace + email/password superadmin
- **Email**: Resend (branded transactional email, `send.sasw.co`)
- **Vercel platform**: Analytics + BotID (invisible CAPTCHA on public forms) + Blob
- **GA4**: client tracking (`@next/third-parties`) + server reporting (Analytics Data API)

Access rules and the storage split are documented for day-to-day work in the
`data-access` skill; the CMS write path in `cms-mutations`.

## Data model

Firestore, db `(default)`:

- `registrations` — attendee + `checkedInAt` / `checkedInBy`
- `speakerSubmissions` — public form intake + review status
- `speakers` — CMS
- `sessions` — CMS, `participants: [{speakerId, role: 'speaker' | 'moderator'}]`
- `sponsors` — CMS
- `partners` — CMS
- `staff` — roles (staff / superadmin)

## Environment

Keys and their purpose are documented in [../README.md](../README.md#environment).

---

## Still open

**Public content surfaces (was Phase 6)** — the schedule / circuits view (by day,
room, speakers, moderators) and the speakers grid + detail pages. The CMS behind
both is built and populated; only the public routes are missing. When they land,
add `speakers` and `sessions` to the "bust `/`" column in the `cms-mutations`
revalidation map.

**Hardening (was Phase 8)** — not yet done:

- Rate-limiting on the public form routes (BotID handles bots, not volume).
- Error boundaries (`error.tsx`) — there are none anywhere in `app/`.
- Firestore composite indexes (`firestore.indexes.json` doesn't exist yet;
  currently relying on single-field indexes).
- A full accessibility + responsive pass against the brand's WCAG note.
