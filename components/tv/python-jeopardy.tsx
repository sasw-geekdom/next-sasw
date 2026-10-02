"use client";

import * as React from "react";
import {
  JEOPARDY_FINAL,
  JEOPARDY_ROUNDS,
  type JeopardyClue,
} from "@/lib/python-jeopardy";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";
import { PYSA } from "@/lib/pysa";
import { ShaderCanvas } from "@/components/site/shader-canvas";
import { MiniBolts } from "@/components/tv/tv-kit";

// Python Jeopardy for PySanAntonio II — see lib/python-jeopardy.ts for how the
// room plays it. Run from the laptop on the projector: the round, the played
// tiles and the Daily Double spots are kept in that browser, so a refresh
// mid-game picks up where it was.
//
// Host keys: Space or Enter shows the answer, then goes back to the board.
// Esc goes back without using the tile. F toggles full screen, M mutes.

// v2: the state grew a round, and tile ids carry it ("round-col-row").
const KEY = "pysa-jeopardy-v2";
const MAGENTA = "#ff32a0";
const GOLD = "#edca00";
const MUTE_KEY = "pysa-jeopardy-muted";

// ─── Sound ───────────────────────────────────────────────────────────────────
//
// One sound, on purpose: the Daily Double, so it is the moment that lands.
// Synthesized with the Web Audio API — no file, so nothing to license and
// nothing to fetch on the venue's network. Not the show's own cue, which is
// copyrighted; this is in the same spirit and our own.
//
// Browsers only allow audio after the page has been clicked; by the time a
// Daily Double turns up, the host has clicked plenty.

let audio: AudioContext | null = null;

function tone(
  ctx: AudioContext,
  out: AudioNode,
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType,
  peak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // A quick attack and an exponential tail: struck, not switched on.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(out);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function playDailyDouble() {
  try {
    audio ??= new AudioContext();
    const ctx = audio;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);
    const t = ctx.currentTime + 0.01;
    const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5;
    // A rising run that lands on a held chord.
    [C5, E5, G5, C6, E6].forEach((f, i) => tone(ctx, out, f, t + i * 0.07, 0.35, "sawtooth", 0.07));
    [C5, G5, C6, E6].forEach((f) => tone(ctx, out, f, t + 0.38, 1.4, "triangle", 0.16));
  } catch {
    // No Web Audio, or the browser refused it: the game runs silent.
  }
}

interface GameState {
  round: number;
  used: string[];
  dd: string[];
  started: boolean;
}

type Open =
  | { kind: "clue"; ci: number; r: number; revealed: boolean; dd: boolean }
  | { kind: "dd"; ci: number; r: number }
  | { kind: "final"; revealed: boolean }
  | { kind: "round" }
  | { kind: "rules" }
  | null;

const tileId = (round: number, ci: number, r: number) => `${round}-${ci}-${r}`;

function fresh(): GameState {
  // Each round's Daily Doubles sit in different categories, never in the top
  // row — the show's own rule, since the top row is the warm-up.
  const dd = JEOPARDY_ROUNDS.flatMap((round, ri) =>
    round.categories
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, round.dailyDoubles)
      .map((ci) => tileId(ri, ci, 1 + Math.floor(Math.random() * 4))),
  );
  return { round: 0, used: [], dd, started: false };
}

function load(): GameState {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s && Array.isArray(s.used) && Array.isArray(s.dd) && typeof s.round === "number")
      return s;
  } catch {}
  return fresh();
}

function save(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

// ─── The week's marks ─────────────────────────────────────────────────────────
//
// The game borrows the Startup + Tech Week pieces the site already has rather
// than inventing its own: the live bolt with current running through it (the
// schedule hero's "Start ⚡ Here."), the drifting mini bolts (the Startup Bash
// screens), and the five-pip charge ramp (the circuits device).

/** The live bolt, set in a line of type the way the schedule hero sets it. */
function InlineBolt({ color = MAGENTA }: { color?: string }) {
  return (
    <span
      aria-hidden="true"
      // Square, because the mask is; 1.5em puts its ink at about cap height,
      // and the negative margin takes back the SVG's own transparent edge.
      className="relative -mx-[0.18em] inline-block aspect-square h-[1.5em] w-[1.5em] align-[-0.34em]"
    >
      <ShaderCanvas color={color} maskClassName="bolt-mask" fallbackSrc="/brand/sastw-bolt.svg" className="h-full w-full" />
    </span>
  );
}

/**
 * How much of this round's board has been played, as the week's five-pip
 * ramp: each pip is a fifth of the board, and lit pips run from a low charge
 * to a full one, the way the circuits device does.
 */
function ChargeMeter({ played, total }: { played: number; total: number }) {
  const lit = Math.ceil((played / total) * 5);
  return (
    <div className="flex items-center gap-3" aria-label={`${played} of ${total} clues played`}>
      <div className="relative flex items-center gap-[1.4vw]">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="relative size-[0.7vw] rounded-full transition-[opacity,box-shadow] duration-500"
            style={{
              background: i < lit ? MAGENTA : "rgba(255,255,255,0.18)",
              opacity: i < lit ? 0.35 + (0.65 * (i + 1)) / 5 : 1,
              boxShadow: i < lit && i === lit - 1 ? `0 0 12px ${MAGENTA}` : "none",
            }}
          />
        ))}
      </div>
      <span className="tabular-nums">
        {played}/{total}
      </span>
    </div>
  );
}

// Hydration gate: the game's state lives in localStorage, so nothing renders
// until the client has it.
const subscribeNever = () => () => {};

export function PythonJeopardy() {
  const hydrated = React.useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  if (!hydrated) return <div className="fixed inset-0 bg-[#050608]" />;
  return <Game />;
}

function Game() {
  const [state, setState] = React.useState<GameState>(load);
  const [open, setOpen] = React.useState<Open>(() =>
    state.started ? null : { kind: "rules" },
  );
  const [armed, setArmed] = React.useState(false);
  const [muted, setMuted] = React.useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const round = JEOPARDY_ROUNDS[state.round];
  const sound = () => {
    if (!muted) playDailyDouble();
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {}
  };

  const update = (next: GameState) => {
    setState(next);
    save(next);
  };

  const pick = (ci: number, r: number) => {
    const dd = state.dd.includes(tileId(state.round, ci, r));
    if (dd) sound();
    setOpen(dd ? { kind: "dd", ci, r } : { kind: "clue", ci, r, revealed: false, dd: false });
  };

  const openFinal = () => setOpen({ kind: "final", revealed: false });

  const reveal = () => {
    if (open?.kind === "clue" && !open.revealed) {
      setOpen({ ...open, revealed: true });
      const id = tileId(state.round, open.ci, open.r);
      if (!state.used.includes(id)) update({ ...state, used: [...state.used, id] });
    } else if (open?.kind === "final" && !open.revealed) {
      setOpen({ ...open, revealed: true });
    }
  };

  // Backing out before the reveal leaves the tile live, so a mis-click
  // doesn't burn a question.
  const back = () => setOpen(null);

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };

  const start = () => {
    update({ ...state, started: true });
    setOpen(null);
  };

  // Forward to Double Jeopardy gets its splash; back to round one is a quiet
  // switch, for the host who moved on too early.
  const switchRound = () => {
    const next = state.round === 0 ? 1 : 0;
    update({ ...state, round: next });
    setOpen(next === 1 ? { kind: "round" } : null);
  };

  // New game asks twice, so a stray click mid-session can't wipe the board.
  React.useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  const reset = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    update(fresh());
    setOpen({ kind: "rules" });
  };

  const onKey = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (open && open.kind !== "rules") back();
      return;
    }
    if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey) {
      fullscreen();
      return;
    }
    if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey) {
      toggleMute();
      return;
    }
    if (e.key !== " " && e.key !== "Enter") return;
    if (!open || open.kind === "rules") return;
    e.preventDefault();
    if (open.kind === "round") back();
    else if (open.kind === "dd")
      setOpen({ kind: "clue", ci: open.ci, r: open.r, revealed: false, dd: true });
    else if (!open.revealed) reveal();
    else back();
  });
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col gap-[1.6vh] bg-[#050608] px-[2.4vw] py-[2vh] font-sans text-[#f4f6fb] antialiased">
      <header className="flex items-center justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/sastw-horizontal-white.png"
          alt="San Antonio Startup + Tech Week"
          className="h-[5.6vh] w-auto"
        />
        <h1 className="font-display text-[3.4vw] font-bold uppercase leading-none tracking-[0.04em]">
          <span style={{ color: GOLD }}>Python</span> <InlineBolt />{" "}
          {state.round === 1 ? (
            <>
              <span style={{ color: MAGENTA }}>Double</span> Jeopardy
            </>
          ) : (
            "Jeopardy"
          )}
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pysa/wordmark-dark.svg" alt="PySanAntonio" className="h-[4.4vh] w-auto" />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-6 grid-rows-[auto_repeat(5,minmax(0,1fr))] gap-[0.5vw]">
        {round.categories.map((c) => (
          <div
            key={c.name}
            className="grid min-h-[3.2em] place-items-center bg-[#0b2a57] px-2 py-[1.2vh] text-center font-display text-[1.45vw] font-bold uppercase leading-[1.1] tracking-[0.03em] text-balance"
            style={{ borderBottom: `3px solid ${state.round === 1 ? MAGENTA : GOLD}` }}
          >
            {c.name}
          </div>
        ))}
        {round.values.map((v, r) =>
          round.categories.map((c, ci) => {
            const used = state.used.includes(tileId(state.round, ci, r));
            return (
              <button
                key={`${state.round}-${ci}-${r}`}
                type="button"
                onClick={() => pick(ci, r)}
                disabled={used}
                aria-label={used ? `${c.name}, $${v}, played` : `${c.name} for $${v}`}
                className={cn(
                  "rounded font-display text-[3.6vw] font-bold tabular-nums tracking-[0.02em] transition",
                  used
                    ? "bg-[#0a1730] text-transparent"
                    : "bg-gradient-to-b from-[#1a52ad] to-[#12408a] shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] [text-shadow:0_3px_0_rgba(0,0,0,0.45)] hover:-translate-y-px hover:brightness-115",
                )}
                style={used ? undefined : { color: GOLD }}
              >
                {used ? (
                  // A spent charge rather than a hole in the board.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/brand/sastw-bolt.svg" alt="" className="mx-auto h-[55%] w-auto opacity-15" />
                ) : (
                  `$${v}`
                )}
              </button>
            );
          }),
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 font-mono text-[0.8vw] uppercase tracking-[0.12em] text-[#a9b6cc]">
        <div className="flex items-center gap-[2vw]">
          <div>
            <b className="font-medium" style={{ color: MAGENTA }}>
              PySanAntonio II
            </b>{" "}
            · Geekdom, 3rd Floor
          </div>
          <ChargeMeter
            played={state.used.filter((id) => id.startsWith(`${state.round}-`)).length}
            total={round.categories.length * round.values.length}
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Pill onClick={() => setOpen({ kind: "rules" })}>How to play</Pill>
          <Pill onClick={switchRound}>
            {state.round === 0 ? "Double Jeopardy" : "Back to round one"}
          </Pill>
          <Pill gold onClick={openFinal}>
            Final round
          </Pill>
          <Pill onClick={fullscreen}>Full screen</Pill>
          <Pill onClick={toggleMute}>{muted ? "Sound off" : "Sound on"}</Pill>
          <Pill warn onClick={reset}>
            {armed ? "Click again to reset" : "New game"}
          </Pill>
        </div>
      </footer>

      {open?.kind === "rules" && <Rules onStart={start} />}
      {open?.kind === "round" && (
        <Splash title="Double Jeopardy" cta="Show the board" onGo={back}>
          Python across six industries. <strong style={{ color: GOLD }}>Values double</strong>, and two
          Daily Doubles are hiding.
        </Splash>
      )}
      {open?.kind === "dd" && (
        <Splash
          title="Daily Double"
          cta="Show the question"
          onGo={() => setOpen({ kind: "clue", ci: open.ci, r: open.r, revealed: false, dd: true })}
        >
          This one is <strong style={{ color: GOLD }}>yours alone</strong>. No steals.
        </Splash>
      )}
      {open?.kind === "clue" && (
        <ClueScreen
          category={round.categories[open.ci].name}
          value={open.dd ? `Daily Double · $${round.values[open.r] * 2}` : `$${round.values[open.r]}`}
          clue={round.categories[open.ci].clues[open.r]}
          mode={open.dd ? "dd" : "open"}
          revealed={open.revealed}
          onReveal={reveal}
          onBack={back}
        />
      )}
      {open?.kind === "final" && (
        <ClueScreen
          category={`Final round · ${JEOPARDY_FINAL.name}`}
          value="Everyone plays"
          clue={JEOPARDY_FINAL}
          mode="final"
          revealed={open.revealed}
          onReveal={reveal}
          onBack={back}
        />
      )}
    </div>
  );
}

function Pill({
  children,
  onClick,
  gold,
  warn,
}: {
  children: React.ReactNode;
  onClick: () => void;
  gold?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 font-mono uppercase tracking-[0.12em] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#edca00]",
        gold
          ? "border-[#edca00] bg-[#edca00] text-[#111]"
          : warn
            ? "border-magenta text-magenta"
            : "border-white/15 text-[#f4f6fb] hover:border-[#4a90d9]",
      )}
    >
      {children}
    </button>
  );
}

function Rules({ onStart }: { onStart: () => void }) {
  const rules = [
    "Grab the mic and call out a category and a value.",
    "You get the first shot. Answer in the form of a question if you can. We won't hold you to it.",
    "Miss it, and anyone in the room can steal.",
    "Daily Doubles are hiding on the board. Those are yours alone. No steals.",
  ];
  return (
    <section className="fixed inset-0 z-10 flex flex-col overflow-y-auto bg-[#050608] px-[4vw] py-[4vh]">
      {/* The bolts drift up the right half only, behind the mascot, and
          leave the rules on clean black. MiniBolts lays its field out across
          the full stage width, so clipping it to half keeps half of them;
          the count is doubled to hold the density. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-1/2 overflow-hidden">
        <MiniBolts count={70} opacity={0.55} />
      </div>

      {/* The two marks, where the board carries them: the week on the left,
          PySanAntonio on the right. */}
      <header className="relative flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/sastw-horizontal-white.png" alt="San Antonio Startup + Tech Week" className="h-[5.6vh] w-auto" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pysa/wordmark-dark.svg" alt="PySanAntonio" className="h-[5vh] w-auto" />
      </header>

      <div className="relative grid w-full flex-1 grid-cols-[1fr_1.15fr] items-center gap-[3vw] pl-[4vw]">
        <div>
          <h2 className="mb-[0.35em] font-display text-[7.5vw] font-bold uppercase leading-[0.92]">
            <span style={{ color: GOLD }}>Python</span>
            <br />
            Jeopardy
          </h2>
          <ol className="mb-[2em] grid max-w-[46ch] gap-[0.7em] text-[1.35vw] leading-[1.4]">
            {rules.map((r, i) => (
              <li key={r} className="grid grid-cols-[2.2em_1fr] gap-[0.4em]">
                <span className="font-mono" style={{ color: GOLD }}>
                  0{i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
          {/* The site's own primary button, so the game's first control looks
              like every other one on sasw.co. */}
          <button
            type="button"
            autoFocus
            onClick={onStart}
            className={buttonClass("primary", "lg", "ring-offset-[#050608]")}
          >
            Play
          </button>
        </div>
        {/* The mascot clip PySanAntonio's own TV loop plays, feathered the
            same way so its near-black ground melts into the stage and the
            bolts drift by behind it. */}
        <div className="tv-soft-edge w-full">
          <video
            src={PYSA.video}
            poster={PYSA.mascotStill}
            autoPlay
            muted
            loop
            playsInline
            aria-label="The PySanAntonio mascot: a luchador mariachi with a blue guitar"
            className="aspect-[1114/720] w-full object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * The blackletter moments: a Daily Double, and the turn to Double Jeopardy.
 * The week's bolt strikes behind the title, live current running through it,
 * with the mini bolts drifting up around it.
 */
function Splash({
  title,
  cta,
  onGo,
  children,
}: {
  title: string;
  cta: string;
  onGo: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="fixed inset-0 z-10 flex items-center justify-center overflow-hidden bg-[#050608] text-center">
      <MiniBolts count={44} opacity={0.7} />
      <div aria-hidden="true" className="pj-strike absolute left-1/2 top-1/2 aspect-square h-[92vh]">
        <ShaderCanvas color={MAGENTA} maskClassName="bolt-mask" fallbackSrc="/brand/sastw-bolt.svg" className="h-full w-full" />
      </div>
      <div className="relative flex flex-col items-center gap-[2.5vh]">
        <h2
          className="pj-dd-in font-fraktur text-[11vw] font-normal leading-[0.95]"
          style={{ color: "#ffffff", textShadow: `0 0 40px ${MAGENTA}, 0 4px 0 rgba(0,0,0,0.5)` }}
        >
          {title}
        </h2>
        <p className="max-w-[40ch] text-[1.8vw] leading-[1.4] [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">{children}</p>
        <button
          type="button"
          autoFocus
          onClick={onGo}
          className="rounded-full px-[1.4em] py-[0.6em] font-mono text-[1.1vw] uppercase tracking-[0.14em] text-[#111]"
          style={{ background: GOLD }}
        >
          {cta}
        </button>
      </div>
    </section>
  );
}

function ClueScreen({
  category,
  value,
  clue,
  mode,
  revealed,
  onReveal,
  onBack,
}: {
  category: string;
  value: string;
  clue: JeopardyClue;
  mode: "open" | "dd" | "final";
  revealed: boolean;
  onReveal: () => void;
  onBack: () => void;
}) {
  const { q, mono } = clue;
  const ask = clue.ask ?? "What is";
  const isFinal = mode === "final";

  return (
    <section
      aria-live="polite"
      className="fixed inset-0 z-10 flex flex-col overflow-y-auto px-[6vw] py-[4vh]"
      style={{
        background: isFinal
          ? "radial-gradient(110% 80% at 50% 30%, #2a0b22 0%, #050608 70%)"
          : "radial-gradient(120% 90% at 50% 40%, #12408a 0%, #0b2a57 55%, #06172f 100%)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 font-display text-[1.8vw] uppercase tracking-[0.06em]">
        <span style={isFinal ? { color: MAGENTA } : undefined}>{category}</span>
        <span className="font-bold tabular-nums" style={{ color: GOLD }}>
          {value}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-[3.5vh] py-[3vh] text-center">
        <p
          className={cn(
            "m-0 font-display font-medium uppercase leading-[1.15] tracking-[0.015em] text-balance transition-opacity duration-500 ease-out [text-shadow:0_4px_0_rgba(0,0,0,0.35)]",
            revealed && "opacity-55",
            // The answer's space is held from the start, so a clue gets what
            // is left: past 80 characters it sets a size smaller so the whole
            // screen still fits.
            q.length > 80 ? "max-w-[30ch] text-[3.3vw]" : "max-w-[24ch] text-[4.2vw]",
          )}
        >
          {q}
        </p>
        {/*
          The reveal. The card is laid out from the start and only hidden, so
          showing it moves nothing else on the screen; it then rises and fades
          in on opacity and transform alone, which the browser hands to the
          GPU. The earlier version inserted the card (shoving the clue up a
          frame later), animated font sizes (a reflow every frame) and ran a
          blur over a 3D flip, and stuttered on a laptop driving a projector.
        */}
        <div
          aria-hidden={!revealed}
          data-shown={revealed || undefined}
          className="pj-answer relative overflow-hidden rounded-xl border border-[#edca00]/40 bg-[#06172f]/70 px-[2.4vw] py-[2vh] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        >
          <div
            className={cn(
              "font-display font-bold uppercase leading-[1.1] text-balance",
              // A monospace reply runs about a third wider than Oswald.
              mono ? "text-[3vw]" : "text-[4vw]",
            )}
          >
            <span className="text-white/85">{ask} </span>
            <span className={cn(mono && "font-mono normal-case")} style={{ color: GOLD }}>
              {clue.a}
            </span>
            <span style={{ color: GOLD }}>?</span>
          </div>
          {revealed && (
            <span aria-hidden="true" className="pj-glint pointer-events-none absolute inset-y-0 -left-1/3 w-1/3" />
          )}
        </div>
        <p className="font-mono text-[1vw] uppercase tracking-[0.14em] text-[#a9b6cc]">
          {isFinal ? (
            <>
              Shout it out. <b className="font-medium" style={{ color: MAGENTA }}>Everyone</b> can answer.
            </>
          ) : mode === "dd" ? (
            <>
              Daily Double · <b className="font-medium" style={{ color: MAGENTA }}>the picker answers alone</b>
            </>
          ) : (
            <>
              First shot to the picker · miss it and{" "}
              <b className="font-medium" style={{ color: MAGENTA }}>anyone can steal</b>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 text-[1vw]">
        {!revealed && (
          <button
            type="button"
            autoFocus
            onClick={onReveal}
            className="rounded-full px-[1.4em] py-[0.6em] font-mono uppercase tracking-[0.12em] text-[#111]"
            style={{ background: GOLD }}
          >
            Show answer
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/15 px-[1.4em] py-[0.6em] font-mono uppercase tracking-[0.12em] hover:border-[#4a90d9]"
        >
          Back to board
        </button>
      </div>
    </section>
  );
}
