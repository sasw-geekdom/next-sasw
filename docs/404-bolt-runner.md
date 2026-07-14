# SASTW 404 — "Bolt Runner" spec

An interactive, 8-bit / ASCII-styled endless runner for the 404 page, built
around the SASTW lightning bolt. Inspiration from the Chrome dino game — all art
and code original. Status: **spec / not yet built.**

---

## 1. Files & architecture

```
app/not-found.tsx                     ← server component: 404 shell + static fallback + links
components/site/not-found-game.tsx     ← "use client" — the game (canvas + loop + input)
lib/game/bolt-runner.ts (optional)     ← pure game logic (update/spawn/collision) for testability
public/brand/sprites/…                 ← pixel sprites if we don't draw from the bolt SVG
```

- `not-found.tsx` (server) renders the `<h1>` / links (real 404 content, always
  present) and mounts `<NotFoundGame />`. Next returns HTTP 404 for this route
  automatically.
- The game is a single client component owning one `<canvas>`, one
  `requestAnimationFrame` loop, and input handlers. No new dependencies.
- Split pure logic into `lib/game/bolt-runner.ts` **only if** we want unit tests
  on spawn/collision math; otherwise keep it in the component.

## 2. Game state machine

```
IDLE  ──space/tap──▶  RUNNING  ──collision──▶  GAME_OVER  ──space/tap──▶  RUNNING
REDUCED (prefers-reduced-motion): static 404, "Play" button opts into IDLE
```

- **IDLE**: bolt bobbing on the wire, blinking `press space to plug in`, dimmed scene.
- **RUNNING**: full loop.
- **GAME_OVER**: freeze, flash, show score + best + `Reconnect?`; the bolt blooms
  into the WebGL shader (stretch).
- One `stateRef` (not React state) drives the loop; React state only for
  HUD/overlay text so we don't re-render per frame.

## 3. The loop

- Fixed-timestep accumulator: logic steps at **60 Hz** (`DT = 1/60`), render every
  rAF frame. Clamp `frameDelta` to ≤ 0.1s to survive tab stalls.
- `document.visibilitychange` → pause (stop rAF); resume on return. Prevents a
  huge delta spike.
- Structure: `loop(now) → accumulate → while(acc>=DT){ update(DT) } → render(alpha)`.

## 4. Canvas & coordinates

- **Logical resolution: 800 × 260** (letterbox). All physics in logical px.
- Scale to container width with `ctx.setTransform(scale*dpr, …)`; cap display
  width ~960px, center it. `image-rendering: pixelated` for crisp 8-bit edges.
- Ground/wire baseline at **y = 214**. Playfield above it.

## 5. Entities

**Player (bolt)**
```
{ x: 96 (fixed), y, vy, state: 'run'|'jump'|'duck', w:28, h:40 }
hitbox: inset 4px each side (forgiving). Duck: h→24, hitbox lowered.
```

**Ground/wire** — scrolling dashed circuit trace; occasional gap segments are
cosmetic (obstacles are separate so collision stays simple).

**Obstacles** (pooled array)

| type | action | shape | notes |
|---|---|---|---|
| `spike` | jump | tall narrow (16×42) | a surge spike on the wire |
| `cable` | duck | hangs from top, low clearance | forces a duck |
| `cluster` | jump | 2 spikes, wider gap needed | appears later |

Spawn: `x = 820`, move left at `speed`. Despawn `x < -width`.

**Circuit pickups** — floating tokens at jump height (see §7).

**Particles** — spark trail behind the bolt; debris burst on death. Pooled, ~40 max.

**Parallax bg** (polished) — 2 layers: far San Antonio / TPR-tower silhouette
(slow), near wire posts (faster).

## 6. Physics / tuning constants (starting values)

```
GRAVITY            2200 px/s²
JUMP_VELOCITY      -760 px/s        (apex clears a 42px spike with margin; ~0.69s airtime)
DUCK_HOLD          while key down, min 0.2s
SPEED_START        260 px/s
SPEED_RAMP         +7 px/s per second
SPEED_MAX          560 px/s
GAP_MIN / GAP_MAX  260 / 520 px (converted to time via current speed; +jitter)
VOLTS_PER_PX       0.15             (score = distance * this)
PICKUP_BONUS       150 volts
```

Tune airtime first (jump must clear the tallest single obstacle at max speed),
then gap ranges so the game is *fair but tight*.

## 7. The circuit power-up system (the on-brand hook)

- Five pickups, one per circuit (Founder, Tech & Builders, AI & Applied
  Innovation, Small Business & Solopreneur, Capital), keyed off `lib/tracks.ts`.
- **Effect on collect:** +`PICKUP_BONUS`, a spark burst, and the bolt's glow
  **charges up**. Track collected circuits this run; collecting **all five** =
  "fully charged" flash + a volt multiplier for a few seconds.
- **Brand-safe color decision (open):** we intentionally don't lean on DEVSA /
  track colors.
  - **(A) Charge, not color** — pickups read as "current nodes"; effect is glow
    *intensity* / multiplier, palette stays magenta + blue. Most brand-disciplined.
    **(recommended)**
  - **(B) Subtle per-circuit accent** — each pickup a distinct retro hue (game
    art, not official brand colors); the collected color feeds the game-over bolt
    shader. Flashier, but introduces colors.

## 8. Rendering layers (draw order)

1. Clear to black `#0a0a0a`.
2. Parallax background (polished).
3. Scrolling wire / ground.
4. Obstacles.
5. Circuit pickups.
6. Particles (spark trail).
7. Player bolt.
8. HUD: `volts` (right), `best` (right, dim), collected-circuit pips (left).
9. CRT overlay: 1px scanlines at low alpha + faint vignette.
10. State overlays (IDLE prompt / GAME_OVER panel) — **DOM on top of the canvas**,
    not drawn, so text stays crisp and accessible.

**Palette:** bg `#0a0a0a`, bolt/primary `#ff32a0`, accents space-blue, text
`#ffffff` / `#ffffff99`. Monospace HUD.

**Bolt art:** pre-rasterize the bolt SVG to a small pixel sprite (like the
email/OG logos) and `drawImage` it — sharper and cheaper than path-drawing per
frame. Keep ground / HUD / chrome as ASCII / monospace for the hybrid look.

## 9. Input

- **Keyboard:** `Space` / `ArrowUp` = jump (and start/restart), `ArrowDown` =
  duck. `preventDefault` on these (space scrolls the page otherwise).
- **Touch:** tap top ⅔ = jump, tap bottom ⅓ = duck. Prevent double-tap zoom.
- Canvas is focusable (`tabindex=0`) with a visible focus ring.
- Ignore inputs when the tab is hidden.

## 10. Scoring & persistence

- Live **volts** counter (distance-based, integer). Milestone flash every 1,000.
- **Best** in `localStorage` (`sastw:404:best`), shown on IDLE and GAME_OVER;
  "new best!" flash when beaten.

## 11. Copy (SASTW voice)

| moment | text |
|---|---|
| Page `<h1>` (always visible) | `Signal lost.` |
| Subhead | `404 — this page isn't on the grid.` |
| Persistent link | `Plug back in →` (home) · secondary `Register →` |
| IDLE prompt | `press space to plug in` |
| HUD | `1,240 volts` · `best · 3,900` |
| Game over | `Current broke. Reconnect?` |
| All 5 circuits | `Fully charged.` |

## 12. Accessibility & reduced motion (required)

- The **404 message and navigation links are real DOM, always rendered** above /
  around the canvas — the game never gates them. The canvas is `aria-hidden` with
  a text alternative nearby.
- `prefers-reduced-motion`: **don't auto-run**. Show the static 404 + a `Play the
  bolt game` button that opts in. No autoplay motion / parallax until opted in.
- Fully keyboard-playable; visible focus; `Esc` returns focus to the page.

## 13. Performance

- Object pooling for obstacles / particles / pickups (no per-frame allocation).
- Pause on `visibilitychange`; cap delta.
- Single canvas, `ctx` reused; sprites drawn from a pre-decoded `Image` /
  offscreen canvas.
- 404 route → bundle cost is isolated, but keep the component lean and
  dependency-free.

## 14. Phasing & task breakdown

**Phase 1 — MVP (feel-locking, ~½ day)**
1. `not-found.tsx` shell + links + reduced-motion fallback.
2. Canvas + fixed-timestep loop + DPR scaling.
3. Bolt: run / jump + gravity; ground scroll; speed ramp.
4. One obstacle type (`spike`), spawn cadence, collision, GAME_OVER + restart.
5. Volts + localStorage best. Basic palette + scanlines.

**Phase 2 — Polished (~1–2 days)**
6. Duck + `cable` / `cluster` obstacles.
7. Circuit pickups + charge system (option A or B).
8. Spark particles, parallax skyline, CRT vignette, milestone flashes.

**Phase 3 — Stretch**
9. Game-over bolt blooms into the WebGL shader (reuse `ShaderCanvas`) in the
   collected color.
10. Optional sound (default **off**, toggle persisted).

## 15. QA checklist

- Jump clears the tallest obstacle at `SPEED_MAX` with margin; gaps always clearable.
- Space doesn't scroll the page; arrows don't scroll.
- Tab-away / return doesn't teleport the bolt or spike difficulty.
- Reduced-motion path shows static 404 + opt-in; links work with JS disabled.
- Mobile: tap controls, canvas scales, no zoom-on-double-tap.
- 404 still returns HTTP 404 and is crawlable as an error page.

## 16. Open decisions

1. **Pickup treatment:** (A) charge / intensity only *(recommended, brand-safe)*
   or (B) per-circuit accent colors feeding the game-over shader?
2. **Duck** from the start, or MVP jump-only?
3. **Sound** at all (default-off toggle), or skip it?

---

### Reference points in the codebase
- Bolt shader / color-easing to reuse for the game-over bloom:
  `components/site/shader-canvas.tsx`, `components/site/bolt-shader.tsx`.
- Bolt SVG to rasterize into a sprite: `public/brand/sastw-bolt.svg`.
- Circuit names: `lib/tracks.ts`.
- Brand palette + `.bolt-mask` reference: `app/globals.css`.
