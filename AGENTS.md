<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

The parts that actually diverge here are routing, caching/revalidation, server
actions, config, and proxy. Read the guide before touching those; a Tailwind
class or copy change doesn't need one.

## Repo gotchas

- **`firebase-admin` is pinned to v12 — don't bump it on its own.** v14 requires
  **Node >= 22**; this repo targets Node 20 (`.nvmrc`, `engines`). It was on
  `^14.1.0` once and broke production admin login (ESM-only `jose`,
  `ERR_REQUIRE_ESM`) — see `51e5be4`. Upgrading means moving Node to 22 first:
  `.nvmrc`, `engines`, **and** the Vercel project's Node setting (it's in the
  dashboard, not `vercel.json`). v13 wants only Node >= 18 if you want a step
  that works today. A blanket "update dependencies" pass will break this.
- **`pnpm dev`, never `pnpm start`, for local work.** BotID's `checkBotId()`
  needs the Vercel runtime; under `next dev` it's bypassed so the forms work.
  Against a local production build it rejects every submission.
- **Middleware is `proxy.ts` now** (Next 16 renamed it). Creating a
  `middleware.ts` gets you a file that silently never runs. `/admin/*` guarding
  lives in [proxy.ts](proxy.ts) *and* is re-verified in every admin route —
  don't treat the proxy as the only gate.
- **OG cards must not read assets out of `node_modules` at request time.**
  pnpm makes `node_modules/<pkg>` a symlink into its store and build tracing
  records the file behind it, so the deployed function ships the real asset but
  not the link the path went through. A `readFile(join(process.cwd(),
  "node_modules/…"))` therefore works during the build — where the full pnpm
  tree exists — and throws `ENOENT` on every render-on-demand. That is invisible
  until something renders that was not prerendered: a speaker added through the
  CMS between deploys got a 500 for their share card while every built card kept
  working. Assets the OG cards need live in `public/brand/` and are read from
  there ([lib/og.tsx](lib/og.tsx)).
- **pnpm only.** There's no `package-lock.json` and `packageManager` is pinned.
