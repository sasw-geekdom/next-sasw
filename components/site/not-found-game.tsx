"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";

// ─── Tuning (logical px; see docs/404-bolt-runner.md) ───────────────────────
const W = 800;
const H = 260;
const GROUND_Y = 214;
const GRAVITY = 2200;
const JUMP_V = -760;
const SPEED_START = 260;
const SPEED_RAMP = 8;
const SPEED_MAX = 600;
const GAP_MIN = 250;
const GAP_MAX = 520;
const MIN_REACTION = 0.42; // s — gaps never tighter than this at current speed
const VOLTS_PER_PX = 0.15;
const BOLT_X = 96;
const BOLT_W = 28;
const BOLT_H = 40;
const BOLT_H_DUCK = 22;
const BEST_KEY = "sastw:404:best";
const MUTE_KEY = "sastw:404:muted";

const MAGENTA = "#ff32a0";
const STEEL = "#d4d4d8";

type Phase = "idle" | "running" | "over" | "reduced";
type OType = "spike" | "tall" | "cluster" | "cable";

interface Obstacle {
  x: number;
  w: number;
  top: number;
  h: number;
  type: OType;
}

interface GameState {
  phase: Phase;
  y: number; // bolt feet (bottom); rests on GROUND_Y
  vy: number;
  onGround: boolean;
  duckHeld: boolean;
  speed: number;
  elapsed: number;
  distance: number;
  spawnTimer: number;
  obstacles: Obstacle[];
  t: number;
  best: number;
  lastMilestone: number;
  pendingMilestone: boolean;
  flashT: number;
}

// Downward lightning-bolt polygon in a unit box (y down).
const BOLT_PATH: [number, number][] = [
  [0.62, 0],
  [0.2, 0.52],
  [0.46, 0.52],
  [0.3, 1],
  [0.86, 0.4],
  [0.56, 0.4],
  [0.78, 0],
];

// ─── Procedural 8-bit SFX (Web Audio; no files, no licensing) ───────────────
class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private blip(
    f0: number,
    f1: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    when = 0,
  ) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  jump() {
    this.blip(300, 720, 0.12, "square", 0.12);
  }
  crash() {
    this.blip(220, 50, 0.32, "square", 0.18);
    this.blip(160, 40, 0.34, "sawtooth", 0.1, 0.02);
  }
  milestone() {
    this.blip(523, 523, 0.08, "square", 0.1, 0);
    this.blip(659, 659, 0.08, "square", 0.1, 0.09);
    this.blip(784, 784, 0.11, "square", 0.12, 0.18);
  }
}

// ─── Pure simulation (owns all mutation) ─────────────────────────────────────
function newState(): GameState {
  return {
    phase: "idle",
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    duckHeld: false,
    speed: SPEED_START,
    elapsed: 0,
    distance: 0,
    spawnTimer: 0.9,
    obstacles: [],
    t: 0,
    best: 0,
    lastMilestone: 0,
    pendingMilestone: false,
    flashT: -1,
  };
}

function freshRun(s: GameState) {
  s.y = GROUND_Y;
  s.vy = 0;
  s.onGround = true;
  s.duckHeld = false;
  s.speed = SPEED_START;
  s.elapsed = 0;
  s.distance = 0;
  s.spawnTimer = 0.9;
  s.obstacles = [];
  s.lastMilestone = 0;
  s.pendingMilestone = false;
  s.flashT = -1;
}

function doJump(s: GameState) {
  s.vy = JUMP_V;
  s.onGround = false;
}

function geometry(type: OType): { w: number; top: number; h: number } {
  switch (type) {
    case "tall":
      return { w: 16, h: 64, top: GROUND_Y - 64 };
    case "cluster":
      return { w: 54, h: 42, top: GROUND_Y - 42 };
    case "cable":
      return { w: 26, h: 38, top: GROUND_Y - 72 }; // overhead → must duck
    default:
      return { w: 16, h: 42, top: GROUND_Y - 42 };
  }
}

// Progressive difficulty: harder types unlock by distance.
function pickType(volts: number): OType {
  const pool: OType[] = ["spike", "spike"];
  if (volts > 800) pool.push("tall");
  if (volts > 1600) pool.push("cluster", "cable");
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawn(s: GameState, volts: number) {
  const type = pickType(volts);
  const geo = geometry(type);
  s.obstacles.push({ x: W + 24, ...geo, type });
}

/** Advance one fixed step. Returns true on the frame the bolt dies. */
function simulate(s: GameState, dt: number): boolean {
  s.t += dt;

  if (s.phase === "idle") {
    s.y = GROUND_Y - Math.abs(Math.sin(s.t * 3)) * 6;
    return false;
  }
  if (s.phase !== "running") return false;

  s.elapsed += dt;
  s.speed = Math.min(SPEED_MAX, SPEED_START + SPEED_RAMP * s.elapsed);
  s.distance += s.speed * dt;
  const volts = Math.floor(s.distance * VOLTS_PER_PX);

  const m = Math.floor(volts / 1000);
  if (m > s.lastMilestone) {
    s.lastMilestone = m;
    s.pendingMilestone = true;
    s.flashT = s.t;
  }

  if (!s.onGround) {
    s.vy += GRAVITY * dt;
    s.y += s.vy * dt;
    if (s.y >= GROUND_Y) {
      s.y = GROUND_Y;
      s.vy = 0;
      s.onGround = true;
    }
  }

  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    spawn(s, volts);
    const gapPx = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
    s.spawnTimer = Math.max(MIN_REACTION, gapPx / s.speed);
  }

  const move = s.speed * dt;
  for (let i = 0; i < s.obstacles.length; i++) s.obstacles[i].x -= move;
  s.obstacles = s.obstacles.filter((o) => o.x + o.w > -16);

  // Player box (shorter when ducking on the ground).
  const ducking = s.duckHeld && s.onGround;
  const ph = ducking ? BOLT_H_DUCK : BOLT_H;
  const px = BOLT_X + 4;
  const py = s.y - ph + 4;
  const pw = BOLT_W - 8;
  const pph = ph - 8;
  for (let i = 0; i < s.obstacles.length; i++) {
    const o = s.obstacles[i];
    if (
      px < o.x + o.w - 2 &&
      px + pw > o.x + 2 &&
      py < o.top + o.h &&
      py + pph > o.top
    ) {
      s.best = Math.max(s.best, volts);
      try {
        localStorage.setItem(BEST_KEY, String(s.best));
      } catch {
        /* storage blocked — best stays in-memory */
      }
      return true;
    }
  }
  return false;
}

function boltPath(ctx: CanvasRenderingContext2D, h: number) {
  ctx.beginPath();
  for (let i = 0; i < BOLT_PATH.length; i++) {
    const X = BOLT_PATH[i][0] * BOLT_W;
    const Y = BOLT_PATH[i][1] * h;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  }
  ctx.closePath();
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ctx.fillStyle = STEEL;
  if (o.type === "cable") {
    // Hanging cable + plug — duck under it.
    const cx = o.x + o.w / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, o.top);
    ctx.stroke();
    ctx.fillRect(o.x, o.top, o.w, o.h);
    return;
  }
  // Spikes (1 or a cluster of 3).
  const count = o.type === "cluster" ? 3 : 1;
  const seg = o.w / count;
  for (let i = 0; i < count; i++) {
    const bx = o.x + i * seg;
    ctx.beginPath();
    ctx.moveTo(bx, GROUND_Y);
    ctx.lineTo(bx + seg / 2, o.top);
    ctx.lineTo(bx + seg, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }
}

function draw(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Ground wire + moving "current" ticks.
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(W, GROUND_Y + 1);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,50,160,0.5)";
  const spacing = 30;
  const off = s.distance % spacing;
  ctx.beginPath();
  for (let x = -off; x < W; x += spacing) {
    ctx.moveTo(x, GROUND_Y + 6);
    ctx.lineTo(x + 12, GROUND_Y + 6);
  }
  ctx.stroke();

  for (let i = 0; i < s.obstacles.length; i++) drawObstacle(ctx, s.obstacles[i]);

  // Bolt (squashed when ducking on the ground).
  const ducking = s.duckHeld && s.onGround;
  const bh = ducking ? BOLT_H_DUCK : BOLT_H;
  ctx.save();
  ctx.translate(BOLT_X, s.y - bh);
  boltPath(ctx, bh);
  ctx.shadowColor = MAGENTA;
  ctx.shadowBlur = 14;
  ctx.fillStyle = MAGENTA;
  ctx.fill();
  ctx.restore();

  // HUD.
  const volts = Math.floor(s.distance * VOLTS_PER_PX);
  ctx.textAlign = "right";
  ctx.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${volts.toLocaleString()} volts`, W - 16, 30);
  if (s.best > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(`best · ${s.best.toLocaleString()}`, W - 16, 50);
  }

  // Prompts.
  ctx.textAlign = "center";
  const blink = Math.floor(s.t * 1.6) % 2 === 0;
  if (s.phase === "idle" && blink) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("press space to plug in", W / 2, 108);
  }
  if (s.phase === "over") {
    ctx.fillStyle = MAGENTA;
    ctx.font = "700 22px Oswald, system-ui, sans-serif";
    ctx.fillText("CURRENT BROKE.", W / 2, 102);
    if (blink) {
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "600 14px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText("press space to reconnect", W / 2, 132);
    }
  }

  // Milestone flash.
  const since = s.t - s.flashT;
  if (s.flashT >= 0 && since < 0.25) {
    ctx.fillStyle = `rgba(255,50,160,${0.28 * (1 - since / 0.25)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// Reduced-motion media query as an external store — no setState-in-effect,
// no hydration mismatch (server snapshot is always false).
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function NotFoundGame() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = React.useRef(0);
  const loopingRef = React.useRef(false);
  const g = React.useRef<GameState>(newState());
  const sfxRef = React.useRef<Sfx | null>(null);
  const [started, setStarted] = React.useState(false);
  const [muted, setMuted] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const startLoop = React.useCallback(() => {
    if (loopingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    loopingRef.current = true;
    const DT = 1 / 60;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;
      acc += dt;
      let died = false;
      while (acc >= DT) {
        if (simulate(g.current, DT)) died = true;
        acc -= DT;
      }
      draw(ctx, g.current);
      if (g.current.pendingMilestone) {
        g.current.pendingMilestone = false;
        sfxRef.current?.milestone();
      }
      if (died) {
        g.current.phase = "over";
        sfxRef.current?.crash();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const jump = React.useCallback(() => {
    const s = g.current;
    if (s.phase === "reduced") return;
    if (s.phase === "idle") {
      freshRun(s);
      s.phase = "running";
      doJump(s);
      sfxRef.current?.jump();
    } else if (s.phase === "over") {
      freshRun(s);
      s.phase = "running";
    } else if (s.phase === "running" && s.onGround) {
      doJump(s);
      sfxRef.current?.jump();
    }
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const ly = ((e.clientY - r.top) / r.height) * H;
      if (ly > H * 0.6 && g.current.phase === "running") {
        g.current.duckHeld = true;
      } else {
        jump();
      }
    },
    [jump],
  );
  const releaseDuck = React.useCallback(() => {
    g.current.duckHeld = false;
  }, []);

  const onPlay = React.useCallback(() => {
    setStarted(true);
    g.current.phase = "idle";
    startLoop();
  }, [startLoop]);

  const toggleMute = React.useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (sfxRef.current) sfxRef.current.muted = next;
      try {
        localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctxRef.current = ctx;

    const sfx = new Sfx();
    sfx.muted = muted;
    sfxRef.current = sfx;

    try {
      g.current.best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      /* ignore */
    }

    if (reduced) {
      g.current.phase = "reduced";
      draw(ctx, g.current);
    } else {
      g.current.phase = "idle";
      startLoop();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      loopingRef.current = false;
    };
  }, [reduced, startLoop, muted]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        g.current.duckHeld = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown") g.current.duckHeld = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [jump]);

  return (
    <div className="w-full max-w-240">
      <div className="relative overflow-hidden rounded-xl border border-white/10">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerUp={releaseDuck}
          onPointerLeave={releaseDuck}
          onPointerCancel={releaseDuck}
          tabIndex={0}
          aria-hidden="true"
          className="block h-auto w-full touch-none bg-[#0a0a0a] [image-rendering:pixelated] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
        {/* CRT scanlines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <button
          onClick={toggleMute}
          suppressHydrationWarning
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-md bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        {reduced && !started && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <button
              onClick={onPlay}
              className="rounded-md bg-magenta px-5 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            >
              Play the bolt game
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-widest text-white/40">
        Space / tap to jump · &darr; to duck
      </p>
    </div>
  );
}
