# Speaker social cards

1080×1350 speaker cards. One template per *brand*, one entry per card in
[cards.mjs](cards.mjs).

Five templates. The split is by whether the activation has a brand system
rather than by how many activations there are — with one exception, noted
under the table:

| template | for | why its own |
| --- | --- | --- |
| `pysanantonio.html` | PySanAntonio | blackletter wordmark, blue and gold, its own bloom |
| `the-model.html` / `the-model-pair.html` | The Model | lavender panel, cyan rule, and it is set in Geist where the rest use Oswald |
| `access-granted.html` | Access Granted | typeset green wordmark, schematic grid, `>_` prompts |
| `community-group.html` | **all six community groups** | none of them has a palette, a wordmark treatment or a coalition — just a logo |
| `tpr.html` | Texas Public Radio | *not* a brand — see below |
| `community-group-wide.html` | the community groups, at 1200x630 | a size, not a brand — see **Two sizes** |

`tpr.html` is the exception to the rule above. TPR is a room, not an
activation, so by that rule it should ride the community template. It doesn't,
because that template's identity **is** the group's mark in the wordmark slot
and TPR has no mark — strip it and what's left is a card with a hole where its
only differentiator was.

What TPR has instead is a device the site already gives it, as the one room
every circuit runs through: the five-charge pip ramp from
[room-flow.tsx](../../components/site/room-flow.tsx), and the tag `5 circuits ·
main stage` from [lib/locations.ts](../../lib/locations.ts). The ramp takes the
wordmark slot, widened to the ~470px a lockup would occupy so it reads as a
mark rather than a detail. The circuits deliberately have no colours of their
own — it is one magenta at five charges, and a card that gives a circuit its
own hue is wrong.

**The bolt is the subject here, not the ground.** That is the line between
this template and the community one, and it is the reason they don't look
alike: a community card is a *group's* card carrying the house mark behind it
at 0.17, and TPR is the house's own room, so the mark is what the card is
about — full charge, barely blurred, bleeding off two edges at a size no other
card gives it.

That buys one thing and costs another. It works because **the portrait is
greyscale, alone in the set** — magenta at full charge against a skin tone is
the one pairing on these cards that reads as a mistake, so dropping the photo
leaves exactly one colour on the card and hands it to the bolt. It costs the
bottom-left corner: the bolt's lower arm lands precisely where the name, role
and facts sit, and the role and the fact pips are themselves magenta, so they
disappeared into it. Hence `.frame::before` — a corner scrim under the type and
over the bolt, which keeps the upper mass at full charge (the half doing the
work) while the role comes back to 4.4:1 and the pips to 6.1:1.

TPR cards also carry a `circuit` — one of the five in
[lib/tracks.ts](../../lib/tracks.ts), never a sixth — which **captions the
ramp** rather than sitting in the facts. It was a fact first and had to move:
circuit names and job titles collide badly. Crystal Poenisch is Founder of
Frequency Labs speaking on the Founder circuit, so the card said "Founder"
twice four lines apart, which reads as a duplication bug rather than two
different facts. As a caption on the five-pip ramp it can't — the ramp is the
circuits device, so a track name under it reads as a circuit without having to
say the word.

**Times at TPR are not set yet**, and unlike every other event the day can't live on the event
either — these speakers sit across Tuesday and Thursday. When the slots land
they go on each card as `facts`, which overrides the event's.

The six community groups — .NET User Group, Google Developer Groups, AITX,
Datanauts, AWS User Group, Linux San Antonio — all run at The Rand and differ
only in their mark, their day and their hour. That is data, so they share one
template and get one small `COMMUNITY` entry each.

## Two sizes

1080x1350 by default. A card may carry `size` and its own `template`, which is
how the 1200x630 Meetup cards work — same event, same speaker, same data, a
different shape. The filename says which you are holding.

`community-group-wide.html` is the first of those, and it is deliberately not
the portrait card re-cropped: 0.8:1 to 1.9:1 is a different composition, and
more to the point a different job. **Meetup prints the group name, the event
title, the date, the time and the venue beside the image**, so a card
repeating them spends its width on what the reader is already looking at. What
the platform never says is that the meetup is part of Startup + Tech Week, and
it never shows the speaker's face. So the wide card carries the co-brand, the
face, the hook and the name, and drops the facts, the partner strip and the
role.

Two things it has to respect that the portrait card does not:

- **Meetup re-crops** across its list, page and mobile placements. Nothing that
  has to survive goes near an edge — 72px in from the sides, and the copy sits
  below centre rather than on the floor.
- **The portrait numbers do not carry over.** Bottom-anchored in a 630-tall
  frame, the portrait card's height puts the crown above the top edge — see
  `gdg-speaker-hastimal-jangid-wide`, solved from the crown instead.

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
- **The community cards have no partner strip**, because a community group is
  a single host rather than a coalition. That removed the thing holding the
  facts clear of the figure, so the template carries deep bottom padding
  instead — see the note on `.frame`.
- **Mason Egger's card and his speaker page disagree.** The card says
  *President · PyTexas Foundation*; his CMS record says *Sr Solutions Architect
  · Temporal Technologiues* — note the typo in that record, worth fixing in the
  admin either way.
