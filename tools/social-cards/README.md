# Speaker social cards

1080×1350 cards for the activations that have their own brand — PySanAntonio,
The Model, Access Granted. One template per event, one entry per card in
[cards.mjs](cards.mjs).

```bash
pnpm add -D playwright && pnpm exec playwright install chromium   # once

node --env-file=.env.local tools/social-cards/render.mjs --out ~/Downloads
node --env-file=.env.local tools/social-cards/render.mjs pysanantonio-speaker-edwin-jung
```

Playwright is not a dependency of this repo on purpose: it is a ~300MB browser
download in service of a tool nothing in the build runs.

## Why this exists

These started as loose HTML files in a temp directory, one per speaker. That
cost twice, and both failures are the reason for the shape of this directory:

- A card was re-exported from a stale per-speaker file that still carried a
  device we had removed weeks earlier, silently replacing the good version.
  **Hence one template per event and no per-card HTML** — a card cannot drift
  from its template if it has no file of its own.
- The sources were wiped mid-session and had to be rebuilt from memory.
  **Hence in the repo.**

A third failure is why headshots are resolved from Firestore by speaker slug
rather than pinned as URLs: a replaced photo gets a new blob URL, and twice a
pinned one kept rendering the picture it had replaced.

## Adding a speaker

Add an entry to `CARDS`. Everything except the two portrait numbers comes from
the CMS or the event.

```js
{
  id: "pysanantonio-speaker-someone",   // also the output filename
  event: "pysanantonio",
  speaker: "someone",                   // speaker slug, as on /speakers/<slug>
  headline: "A Talk Title",
  subtitle: "the half after the colon", // optional
  headlineSize: 106,                    // optional, default 88
  portrait: { height: 903, left: 439 },
}
```

`role` and `org` are read from the speaker's record and can be overridden per
card where the card wants a different hat — see `mason-egger`, whose CMS record
carries his employer while the card carries his PyTexas role.

## The two numbers you have to solve

`portrait.height` and `portrait.left` (or `top`, on the two-up template) do
**not** carry between speakers, and a wrong pair is the most visible thing on
the card.

| | what it does | how it goes wrong |
| --- | --- | --- |
| `height` | matches the drawn head to the rest of the set | a head-and-shoulders crop and a full-body cutout need very different values for the same head size |
| `left` / `top` | places the figure; on the pair card, aligns the crowns | two crops start at different depths, so equal offsets sit one subject lower and read as them being shorter |

Both are functions of where the subject sits inside their own frame, so a
**replaced headshot needs both re-derived** — a file swap alone will look wrong.

`probe.mjs` prints suggestions:

```bash
node --env-file=.env.local tools/social-cards/probe.mjs serena-hernandez daniel-gallegos
```

Take its offset — that one is exact. **Check its height by eye.** It finds the
chin by watching for the shoulder line and long hair hides that, so a
long-haired subject measures a longer head than they draw. Which way it errs
depends on whose neck is covered; on this pair it is out by ~15% either way.

## Editing a template

Templates are plain HTML with `{{token}}` substitution and
`<!--if:key-->…<!--/if:key-->` / `<!--ifnot:key-->…<!--/ifnot:key-->` blocks.
They are formatted by prettier like everything else; the conditional blocks
survive it.

After any template change, re-render and compare against the approved PNGs
before shipping. Every card in `CARDS` currently reproduces its approved
version pixel-for-pixel, which is the only real check that a refactor changed
nothing. Two bugs were caught exactly this way while building the tool:

- A missing `letter-spacing: 0.005em` on the PySA headline. Invisible at a
  glance; 25,000 differing pixels.
- A `margin-bottom` on `.role` that belonged only to the no-org case. The block
  below the flex spacer is bottom-anchored as a group, so an unconditional
  margin there made the group taller and lifted the **name** by 4px on every
  card that did have an org.

## Where the brand values come from

Nothing here invents a colour. Each template's palette and devices are lifted
from the activation's own source, and a card is wrong if it drifts from it:

| event | source | devices |
| --- | --- | --- |
| PySanAntonio | [lib/pysa.ts](../../lib/pysa.ts) | blackletter wordmark, `#4a90d9` blue, `#edca00` gold, the blue bloom |
| The Model | [lib/the-model.ts](../../lib/the-model.ts) | `#c0b4fc` lavender highlight, `#00b4fc` cyan, `//` labels |
| Access Granted | [lib/access-granted.ts](../../lib/access-granted.ts) | typeset green wordmark, the 34px schematic grid and its mask, the `>_` prompt, green kept sparing |

## Known gaps

- **`the-model-keynote-justin-johnson` is a reconstruction, not a byte match.**
  Every other card here reproduces its approved PNG exactly; this one differs by
  about 21% of pixels. It predates the tool, its source was lost, and the
  template was reverse-engineered from the rendered image — so the layout,
  colours, copy and portrait match, while the headline and name sit a little
  heavier than the original.

  Reverse-engineering it did surface something worth knowing: **this card is set
  in Geist, not the Oswald every later card uses.** It was made before that
  convention existed. Chasing the reference's measure with tracking on Oswald
  got the width right and the letterforms wrong — the `O` in "OF" is circular in
  the original and a condensed oval in Oswald.

  If you regenerate it, compare against the PNG before posting. The approved
  file in Downloads remains the better artifact.
- **Mason Egger's card and his speaker page disagree.** The card says
  *President · PyTexas Foundation*; his CMS record says *Sr Solutions Architect
  · Temporal Technologiues* — note the typo in that record, worth fixing in the
  admin either way.
