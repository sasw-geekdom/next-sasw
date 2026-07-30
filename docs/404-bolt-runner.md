# SASTW 404 — "Bolt Runner"

An 8-bit endless runner on the 404 page, built around the SASTW bolt. Inspired
by the Chrome dino game; all art and code original. **Status: shipped.**

The implementation is the spec — this file only records what the code can't say
about itself. Read [components/site/not-found-game.tsx](../components/site/not-found-game.tsx)
(one client component: canvas, fixed-timestep loop, input) and
[app/not-found.tsx](../app/not-found.tsx) (server shell) for anything mechanical.
Tuning constants live at the top of the game component.

## Decisions worth keeping

- **Pickups charge, they don't colorize.** Five circuit pickups keyed to
  `lib/tracks.ts`; collecting all five triggers a surge (2× volts, `SURGE_DUR`).
  The palette stays magenta + steel — circuits deliberately get no per-track
  colors, matching the rest of the brand. This was a real fork in the road; the
  alternative was per-circuit accent hues feeding the game-over bloom.
- **The 404 is never gated by the game.** The heading, explanation, and
  navigation links are real DOM in `not-found.tsx`, always rendered. The canvas
  is decorative. Links work with JS off, and the route still returns HTTP 404.
- **`prefers-reduced-motion` gets a `reduced` phase, not an autoplay.** Static
  404 plus an opt-in play button. Don't "fix" this by autostarting.
- **Difficulty is capped narrower on phones** (`SPEED_MAX_NARROW`) because a
  small viewport shows less lookahead, and gaps are floored by `MIN_REACTION`
  seconds rather than raw pixels — so the ramp stays fair at every speed.
- **Sound is opt-out, persisted** (`sastw:404:muted`); best score persists to
  `sastw:404:best`.

## If you touch the tuning

The invariant: a jump must clear the tallest obstacle at max speed with margin,
and every spawned gap must be clearable at the speed it appears. Change
`JUMP_V`, `GRAVITY`, `SPEED_MAX`, or the obstacle geometry and you have to
re-check both, on a phone-width viewport as well as desktop.
