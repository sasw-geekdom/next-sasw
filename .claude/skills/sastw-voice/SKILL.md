---
name: sastw-voice
description: |
  SASTW brand voice and visual system — the electrical metaphor, copy patterns,
  Tailwind v4 brand tokens (magenta/space-blue, Oswald/Geist, the type scale),
  and the eyebrow→headline→blurb→CTA section rhythm.
  Use when: writing or editing any user-facing copy (page headings, form labels,
  email templates, empty states, error/404 text, OG images, metadata), or
  building a new public-site section or component.
---

# SASTW voice & visual system

Event: **San Antonio Startup + Tech Week**, Year 11, Sept 28 – Oct 2, 2026,
anchored downtown at Texas Public Radio. Client: the Geekdom team.

## Voice

**Terse. Active verbs. One metaphor per page.** The metaphor is always
electrical — *current, circuit, power, grid, plug in, online, charge, signal*.
Pick one per surface and stay inside it; don't stack three in a paragraph.

Anchor CTA, everywhere: **"Plug in."**

Shipped copy, as the reference:

| surface | copy |
|---|---|
| tagline | `The current runs through SA. Plug in.` |
| homepage section | `Powering the current.` |
| tracks | `All five circuits run here` |
| 404 eyebrow / headline | `404 · off the grid` / `Coming online.` |
| dates | `Sept 28 – Oct 2.` |
| archive link | `15 years of Geekdom — enter the archive` |

Patterns worth copying: short declarative sentences that **end in a period**,
even two-word ones. Present tense and present participles ("Powering",
"Coming online"). Em dashes for the aside. `·` as the separator in mono
eyebrows.

Avoid: exclamation marks, "Join us for…", "Don't miss…", "amazing/incredible",
hype stacking, and second-person hard sell. The event is confident and matter of
fact — it states what's happening, it doesn't beg for attendance.

## Section rhythm

Public sections follow the same four beats. Reuse it before inventing a new one:

```
eyebrow    font-mono text-xs uppercase tracking-widest text-magenta
headline   font-display uppercase font-bold, tight leading
blurb      one or two sentences, text-white/60 (or muted-foreground on light)
CTA        one primary action, the plug/power verb
```

One primary CTA per section. Two competing buttons means the section hasn't
decided what it wants.

## Tokens

Use the Tailwind v4 theme tokens from `app/globals.css` — never raw hex in
components.

| token | value | use |
|---|---|---|
| `magenta` | `#ff32a0` | primary accent, eyebrows, the bolt |
| `space-blue` | `#00266f` | secondary accent |
| `brand-black` / `brand-white` | `#000000` / `#ffffff` | |

**Light is the default theme** (white bg, black text) on the public site. The
404 and some immersive surfaces intentionally go black — that's a deliberate
exception, not the norm.

Type: `font-display` = Oswald bold, **uppercase**, for headings. `font-sans` =
Geist Sans for body. `font-mono` = Geist Mono for data, eyebrows, counts,
timestamps.

Scale (`--text-*`): `title` 60 · `subtitle` 24 · `heading` 24 · `subheading` 18
· `section` 15 · `body` 16 · `caption` 12.

## The five circuits

Tracks are called **circuits** in public copy. Names come from
[lib/tracks.ts](lib/tracks.ts) — single source of truth, don't retype them:
Founder · Tech & Builders · AI & Applied Innovation · Small Business &
Solopreneur · Capital.

Circuits deliberately **do not** get their own brand colors. Differentiate by
charge, glow intensity, or position — the palette stays magenta + space blue.
