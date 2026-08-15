import localFont from "next/font/local";

// Geist Pixel Square — The Model's face, and the only font on this site that
// belongs to an activation rather than to SASTW. The brand sheet sets the event
// logo, the track tags, the timestamps and the metadata badges in it.
//
// Three decisions are packed in here, and each one was arrived at the hard way.
//
// 1. Not `next/font/google`. Google Fonts does publish Geist Pixel, as one
//    variable family on an `ELSH` axis whose five stops switch the shape. But
//    next/font/google validates against a font catalogue compiled into the
//    package, and next@16.2.10's knows only "Geist" and "Geist Mono" — so
//    `Geist_Pixel` there is a build error, not a font. Worth revisiting on the
//    next Next upgrade: the variable family would replace this file and give
//    the other four shapes for free.
//
// 2. Not the `geist` npm package either, which is Vercel's own route and was
//    tried first. `geist/font/pixel` is a single module that calls localFont()
//    five times, once per shape, so importing one name instantiates all five —
//    and next/font preloads every face a route declares. That put five
//    `<link rel="preload">` tags and 132KB of woff2 on every page in the site,
//    for the 28KB this one actually uses. Vendoring the single file is what
//    makes the preload honest.
//
// 3. Square of the five. Circle, Triangle, Line and Grid are display cuts whose
//    glyphs stop being letters at badge size, and most of this face's work here
//    is 11px labels. Swapping means dropping another woff2 from the same
//    release beside this one and changing the `src` — nothing downstream knows
//    which shape it is.
//
// The file is vendored from geist@1.7.2, licensed OFL 1.1 — see
// GeistPixel-OFL.txt beside it, which travels with the woff2 as the licence
// requires. Upstream is https://github.com/vercel/geist-font/releases.
export const geistPixel = localFont({
  src: "./GeistPixel-Square.woff2",
  variable: "--font-model-pixel",
  // The release ships one weight. Declared rather than left to default so the
  // browser knows there is nothing to synthesise — a faux-bold on a face built
  // from square pixels smears the grid the whole design rests on.
  weight: "500",
  display: "swap",
  // Off, as the geist package has it. Next would otherwise metric-adjust an
  // Arial fallback for this, and Arial is not what a monospaced pixel face
  // falls back to — globals.css hands it to Geist Mono instead.
  adjustFontFallback: false,
});
