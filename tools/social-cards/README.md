# Speaker social cards

1080×1350 speaker cards. One template per *brand*, one entry per card in
[cards.mjs](cards.mjs).

The split is by whether the activation has a brand system rather than by how
many activations there are — with one exception, noted under the table:

| template | for | why its own |
| --- | --- | --- |
| `pysanantonio.html` | PySanAntonio | blackletter wordmark, blue and gold, its own bloom |
| `the-model.html` / `the-model-pair.html` | The Model | lavender panel, cyan rule, and it is set in Geist where the rest use Oswald |
| `access-granted.html` | Access Granted | typeset green wordmark, schematic grid, `>_` prompts |
| `community-group.html` | **all six community groups** | none of them has a palette, a wordmark treatment or a coalition — just a logo |
| `tpr.html` | Texas Public Radio | *not* a brand — see below |
| `community-group-wide.html` | the community groups, at 1200x630 | a size, not a brand — see **Two sizes** |
| `community-group-bill.html` | a community session with more than one talk, at 1200x630 | a shape, not a brand — see **Two sizes** |
| `devsa-partners.html` / `devsa-partners-wide.html` | DEVSA | a partner, not an activation — see below |
| `devsa-band.html` | one band of the DEVSA card, as a carousel slide | a crop, not a brand — see **The DEVSA card** |

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

## The DEVSA card

The one card here that is not an activation's. DEVSA is a partner — "the
501(c)(3) bridge across San Antonio's tech ecosystem", in their own words —
and the card announces the collaboration behind year eleven: the activations
they convened, and the organisations standing behind those.

**It was a circuit first, and that was the wrong picture.** A trunk off the
DEVSA mark with a tap per activation is a good diagram of a claim this card
does not make: a circuit says "these run off one thing", which puts DEVSA
above the groups. What is being announced is that they came together. A field
of marks at one size says that where a hierarchy of taps could not.

The circuit also could not hold the partners. Eleven of the marks here — Alamo
Python, PyTexas, TXLF, learnOPENtech, The Creative Futures, Tech Bloc, BSides,
DEF CON Group SATX, SAHA, CyberJedis and Alamo City Locksport — come off the
activations' own "powered by" lines and none of them is on the schedule, so
none could hang off a schedule's trunk without claiming to be a session.

**Three bands, and the labels are the argument.** The first cut ran two: "The
activations" and "The partners behind them". That first label was accurate for
six of the twelve and a stretch for the other six. The Model, Access Granted,
College Night, Linux San Antonio, Open Circuit and PySanAntonio were
programmed for this week. The AWS User Group, Datanauts, Google Developer
Groups, AITX and .NET already meet every month — DEVSA did not activate them,
it brought their meeting into the week, and calling a standing community group
an activation makes it sound like a brand campaign.

Give-a-LOT is the twelfth and the awkward one. DEVSA and learnOPENtech run it,
so by the reasoning above it was built rather than invited; it sits in
`invited` because that is the order the card was approved in, and because a
drive that collects hardware for four days and gives it away on the fifth is
not an activation under either label. If it moves, it moves in `DEVSA_INVITED`
and `DEVSA_BUILT` and nothing else changes — the splits are computed from the
two arrays' lengths.

It also argued against DEVSA's own line — "we don't replace the communities
doing the work, we host them, connect them, and help them grow" — because one
label over all twelve makes DEVSA the producer of all twelve, which is the
same hierarchy the circuit got wrong.

Split, it is a stronger claim rather than a weaker one: *built for the week*
and *invited to the week* show two capabilities where one label showed one,
and the partners read as a third tier instead of an afterthought.

Note that the repo keeps calling all twelve `activation` internally —
`ACTIVATION_SLUGS`, `resolveSchedule`. That is the data model's word and it is
right there. Audience vocabulary and schema vocabulary do not have to match.

**No count.** An earlier cut led on "Eleven activations", which is already
wrong by one. A number is the wrong
subject: it invites the reader to check it, it goes stale the week a twelfth
lands, and it says nothing about who convened them. The field is the evidence
and it is a stronger argument than counting it.

Three things worth keeping:

- **It draws the homepage bolt**, like `community-group-bill.html` — the WebGL
  still from [lib/og.tsx](../../lib/og.tsx), not the flat silhouette the other
  cards ground themselves with, and at full charge rather than blurred back.
  Here it is the house's half of the co-brand: the marks are what DEVSA
  brought, and the bolt is what they are powering.
- **The two marks are equal by what is drawn.** DEVSA's is a 1.3:1 badge and
  the lockup a 4:1 wordmark, so a shared file height draws one at a third of
  the other's width. Both are solved to ~250px across.
- **One box per mark, capped on both axes.** That is what "equal size" has to
  mean across ratios running 1:1 to 10:1: matched on height, Google Developer
  Groups draws five times DEF CON's width; matched on width, DEF CON draws
  five times GDG's height. A shared box is the only rule under which a badge
  and a wordmark read as peers.

`marks` is an array of `{ repo }`, `{ url }`, `{ partner }` or `{ html }`, and
`splits` gives the two cut points between the three bands.

- `url` for the two that are not vendored here — Alamo Python and PyTexas live
  on DEVSA's own S3 and lib/pysa.ts reads them from there, so this reads them
  from there too rather than committing a copy that can drift.
- `partner` for The Creative Futures and Tech Bloc, resolved from the CMS
  partner wall by name. Same bargain lib/the-model.ts makes for them: neither
  has a logo committed here, and the admin's copy is the one that tracks.
- `html` for the three activations that own no logo; their mark is the display
  face in their own accent, from lib/the-model.ts, lib/access-granted.ts and
  the house magenta.

Two optional overrides, and both are properties of a **file** rather than of
the design — which is why they sit on the mark and not in the template.
`scale` is the answer to a logo whose ink reads light at the shared box —
usually wide transparent margin, sometimes a hairline drawing. Alamo City
Locksport is line art in a 265x260 box with margin all round, so at the shared
box it reads half its neighbours' size (1.5); The Creative Futures is a
hairline ring with the name set around it and fills its box while still
measuring 104x126 against Tech Bloc's 172x110, so it comes up on weight rather
than on margin (1.25); BSides has Locksport's problem more mildly (1.28); AITX
has the opposite one and comes down (0.78).
`shift` is the answer to ink that is not centred in its canvas — the AWS mark
hangs its smile below the letters, so a box centred on the file sits "aws"
above the Datanauts wordmark beside it.

The wide card is not the portrait one stretched: four columns across 1760px
would draw each mark 420px wide and leave two rows of enormous logos with
nothing else on the card. Six across in every band is what fills 16:9 —
the two bands of six land as a single row each, which is what makes the
distinction between them legible at a glance, and the partners' eleven land as
six and five with no ragged third row. It also puts the bolt in the corner
rather than down a side, because twenty-three marks need the width.

**The three carousel slides are the same card, one band each.**
`devsa-band.html` takes `marks`, `cols` and `cellH` and nothing else the
poster does not already carry — the built band, the invited band and the
partners band, posted as a sequence under one caption instead of as one image
someone has to pinch to read. The poster stays the first slide's job; these
are for a reader who scrolls. `cols` and `cellH` exist because a slide
carrying six marks and a poster carrying twenty-three want different grids out
of the same layout, and neither number belongs to the template.

`devsa-community-reshare` is the fourth of these and the same twenty-three
marks again. The announcement card says DEVSA powers Tech Week, which is the
right claim from DEVSA's account and the wrong one from anybody else's — a
group resharing it is posting a card about its host. The reshare moves the
subject to the collective and keeps the co-brand.

## Cards with no person in them

Four of the activations have an event card as well as speaker cards — Access
Granted, The Model, PySanAntonio and Linux San Antonio — and an event card has
no speaker. These templates were drawn around a figure, so the naive version
is a card with a hole where half the composition was.

Two mechanisms, and which one a card gets depends on whether its activation
owns a picture:

- **`art`** names an image in the repo, staged into the portrait slot as
  `face`. As far as the layout is concerned it is the same picture in the same
  place, sized by the same `portrait.height` and `portrait.left`. Access
  Granted has its padlock, The Model its key art, PySanAntonio its mascot.
- **The guards.** `<!--if:face-->` around the portrait and `<!--if:first-->`
  around the name/role/org block, so a card with neither draws neither.
  Linux San Antonio has no figure in the repo and takes this path;
  `community-group.html` puts the homepage bolt in the space with
  `<!--ifnot:face-->`, the same swap the DEVSA card makes.

`artBlock` is the third and it is a property of one file. Every other `art`
and every headshot here is matted; PySanAntonio's mascot is a rectangle of
opaque near-black with a feathered edge, so drawn over the template's bloom it
paints the gradient out inside its own rectangle and the card goes from graded
to flat along the picture's edge. The flag drops the bloom on that card and
matches the ground to the picture's own — see `if:artBlock` in
`pysanantonio.html` for why the alternatives are worse.

## The motion card

One card here moves. `pysanantonio-motion` carries a `video` block and comes
out as an MP4 beside the PNGs: `{ src, height, x, y, loops, seconds }`, the
same kind of numbers as `portrait.height` and `portrait.left` and solved the
same way — against the still card. PySanAntonio is the one activation with a
video asset, and a still cut from it would only repeat the mascot the event
card already uses; the value in the file is the movement.

`transparent` is what makes it composite. The PNG is an overlay rather than a
card, so `omitBackground` has to have somewhere to reach: `<!--if:transparent-->`
clears `body` and adds the scrim that `.portrait::after` draws on the still.
`render.mjs` then places the clip and lays the design over it.

The background took four attempts and `render.mjs` records all of them, which
is worth reading before touching it — the short version is that the ground
above the clip is built from **the clip's own top rows, stretched**, so the
seam matches by construction, and nothing is done to the footage. Grading it,
tinting it and feathering it were all tried and all changed the picture to fix
the background. The clip has no headroom — at the top of the luchador's bob
his sombrero reaches within 10px of the frame — which is what rules the
feather out.

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

`community-group-bill.html` is the second, and it is a different *card* at
the same size rather than a different size of the same one. The wide card is
one speaker's — co-brand, face, hook, name, no facts — on the reasoning that
Meetup prints the date, time and venue beside the image. That holds for a
single talk announced on its own page. It stops holding the moment a group
wants one image for a session carrying two talks, and posts it somewhere that
is not Meetup: a Slack, a newsletter, a story. So the bill card keeps the
co-brand, drops the face, and carries **both talks and the slot**.

No face is the point rather than an omission. There are two speakers, and
picking one of them is an editorial decision the group has not made — while
two portraits at 1.9:1 is the pair template's problem at a size it was never
drawn for. The marks carry the card instead, which is what the group asked
for.

It takes a `talks` array rather than `headline`/`subtitle`, built into markup
in `render.mjs` the same way Give-a-LOT's `states` is, because the template
engine substitutes and branches but does not loop. Each entry is
`{ title, subtitle?, who? }` — the same three fields a speaker card carries.
One entry or several: the bill and its facts are centred in what is left
under the marks, so a one-talk card composes the same as a two-talk one.

It is also the first card drawn at **`scale: 2`** — the DEVSA cards followed —
so the file is 2400x1260 and
the filename says so. Every other card goes into an unfurl at its own
dimensions, where 1x is exactly right. These get posted, resized and
re-cropped, and 17px mono at 1x has about eleven pixels of x-height to draw a
letter in — at 2 the type is drawn from twice the information and every
downscale after that resamples from it rather than from the eleven. The layout
does not move; only the sample rate does.

Two things are its own and not the other cards':

- **It draws the homepage bolt.** Every other template grounds itself with
  `sastw-bolt.svg`, the flat `#ff32a0` silhouette, blurred back to 2.3:1 and
  sat under the copy. This one has no figure and the room to make the bolt a
  subject, so it uses `bolt-current-og.png` — the still of the live WebGL hero
  that [lib/og.tsx](../../lib/og.tsx) puts on the site's own share cards —
  unblurred, at its own gradient, placed inside the right margin rather than
  bled off it.
- **The two marks are balanced against each other, per card.** `markHeight`
  and `lockupHeight` are both set, and "the same size" is a *drawn* size. The
  lockup is 1600x400 with transparent margin inside it, so a matched file
  height drew its ink at 50px against the Datanauts helmet's 73. The three
  cards balance on drawn width instead — ~390px each — which is 108 for the
  lockup, 78 for Datanauts (4.9:1), 71 for AWS (5.5:1) and 39 for Google
  Developer Groups (10:1). Matched on height, GDG would draw twice the
  lockup's width and read as the week appearing at GDG's meetup.

  `markShift` is the other half of that. `align-items: center` centres the two
  *files*, which is not the same as aligning what is drawn in them: the AWS
  mark carries the smile below its letters, so its file centre sits lower than
  its letterforms and "aws User Group" drew 18px above the lockup's caps.
  Measured, not guessed — the lockup's caps run y92–124 and AWS's ran y74–106
  on the unshifted card.

Two things the wide cards have to respect that the portrait card does not:

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

After any template change, re-render the whole set and compare against the
last render before shipping. A refactor should move nothing, and a diff of
"these files and no others" is the only real check of that. Two bugs were
caught exactly this way while building the tool:

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

- **The seven PySanAntonio cards no longer match the PNGs posted before
  2026-09-06.** The house lockup went 46px to 58px, matching every other
  template, which moves the wordmark and headline down on all seven; the event
  card's ground changed with it. Both were asked for. Anything re-rendered from
  here is the current design, and the older files in Downloads are the older
  design — they are not two renders of the same card.

- **`the-model-keynote-justin-johnson` is a reconstruction, not a byte match.**
  Where every other card renders what was approved, this one differs from it by
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
