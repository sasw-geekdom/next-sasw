"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ShaderCanvas } from "@/components/site/shader-canvas";

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
const CIRCUITS = 5;
const PICKUP_R = 9;
const PICKUP_BONUS = 150;
const PICKUP_MIN = 2.6;
const PICKUP_MAX = 4.4;
const SURGE_DUR = 6; // s of 2× volts after fully charging
const PARTICLE_CAP = 140;
const TAU = Math.PI * 2;
const BEST_KEY = "sastw:404:best";
const MUTE_KEY = "sastw:404:muted";

const MAGENTA = "#ff32a0";
const STEEL = "#d4d4d8";
const SKY_FAR = "#1e0c17";
const SKY_NEAR = "#301325";

type Phase = "idle" | "running" | "over" | "reduced";
type OType = "spike" | "tall" | "cluster" | "cable";

interface Obstacle {
  x: number;
  w: number;
  top: number;
  h: number;
  type: OType;
}
interface Pickup {
  x: number;
  y: number;
  circuit: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  white: boolean;
}

interface GameState {
  phase: Phase;
  /** Visible world width — narrower on phones so the panel renders taller. */
  viewW: number;
  /** Coarse-pointer device — switches prompt copy to touch wording. */
  touch: boolean;
  y: number; // bolt feet (bottom); rests on GROUND_Y
  vy: number;
  onGround: boolean;
  duckHeld: boolean;
  speed: number;
  elapsed: number;
  distance: number;
  volts: number;
  spawnTimer: number;
  pickupTimer: number;
  trailTimer: number;
  obstacles: Obstacle[];
  pickups: Pickup[];
  particles: Particle[];
  charged: boolean[];
  surgeT: number;
  t: number;
  best: number;
  lastMilestone: number;
  pendingMilestone: boolean;
  pendingPickup: boolean;
  pendingFull: boolean;
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

// Parallax skyline: [x, height, width] within a repeating tile.
const TILE = 800;
const SKY_FAR_B: [number, number, number][] = [
  [20, 46, 40], [90, 64, 34], [150, 40, 50], [230, 74, 30], [300, 52, 44],
  [380, 88, 28], [470, 58, 50], [560, 70, 34], [650, 48, 46], [720, 80, 30],
];
const SKY_NEAR_B: [number, number, number][] = [
  [40, 70, 54], [130, 96, 40], [210, 64, 60], [430, 80, 54], [600, 90, 48],
  [690, 118, 44],
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
  pickup() {
    this.blip(680, 1180, 0.1, "triangle", 0.12);
  }
  milestone() {
    this.blip(523, 523, 0.08, "square", 0.1, 0);
    this.blip(659, 659, 0.08, "square", 0.1, 0.09);
    this.blip(784, 784, 0.11, "square", 0.12, 0.18);
  }
  fullCharge() {
    this.blip(523, 523, 0.09, "square", 0.12, 0);
    this.blip(659, 659, 0.09, "square", 0.12, 0.08);
    this.blip(784, 784, 0.09, "square", 0.12, 0.16);
    this.blip(1046, 1046, 0.16, "square", 0.14, 0.24);
  }
}

// ─── Pure simulation (owns all mutation) ─────────────────────────────────────
function newState(): GameState {
  return {
    phase: "idle",
    viewW: W,
    touch: false,
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    duckHeld: false,
    speed: SPEED_START,
    elapsed: 0,
    distance: 0,
    volts: 0,
    spawnTimer: 0.9,
    pickupTimer: 1.6,
    trailTimer: 0,
    obstacles: [],
    pickups: [],
    particles: [],
    charged: new Array(CIRCUITS).fill(false),
    surgeT: 0,
    t: 0,
    best: 0,
    lastMilestone: 0,
    pendingMilestone: false,
    pendingPickup: false,
    pendingFull: false,
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
  s.volts = 0;
  s.spawnTimer = 0.9;
  s.pickupTimer = 1.6;
  s.trailTimer = 0;
  s.obstacles = [];
  s.pickups = [];
  s.particles = [];
  s.charged = new Array(CIRCUITS).fill(false);
  s.surgeT = 0;
  s.lastMilestone = 0;
  s.pendingMilestone = false;
  s.pendingPickup = false;
  s.pendingFull = false;
  s.flashT = -1;
}

function doJump(s: GameState) {
  s.vy = JUMP_V;
  s.onGround = false;
}

function burst(s: GameState, x: number, y: number, n: number, spread: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = spread * (0.4 + Math.random() * 0.6);
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      life: 0.4 + Math.random() * 0.4,
      max: 0.8,
      size: 1 + Math.floor(Math.random() * 2),
      white: Math.random() < 0.4,
    });
  }
  if (s.particles.length > PARTICLE_CAP) {
    s.particles.splice(0, s.particles.length - PARTICLE_CAP);
  }
}

function updateParticles(s: GameState, dt: number) {
  for (let i = 0; i < s.particles.length; i++) {
    const p = s.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 320 * dt;
    p.life -= dt;
  }
  s.particles = s.particles.filter((p) => p.life > 0);
}

function chargedCount(s: GameState): number {
  let n = 0;
  for (let i = 0; i < s.charged.length; i++) if (s.charged[i]) n++;
  return n;
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

// Progressive difficulty: harder types unlock by volts.
function pickType(volts: number): OType {
  const pool: OType[] = ["spike", "spike"];
  if (volts > 800) pool.push("tall");
  if (volts > 1600) pool.push("cluster", "cable");
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnObstacle(s: GameState, volts: number) {
  const type = pickType(volts);
  s.obstacles.push({ x: s.viewW + 24, ...geometry(type), type });
}

function spawnPickup(s: GameState) {
  // Prefer an un-collected circuit so a full set is reachable.
  const open: number[] = [];
  for (let i = 0; i < CIRCUITS; i++) if (!s.charged[i]) open.push(i);
  const circuit = open.length
    ? open[Math.floor(Math.random() * open.length)]
    : Math.floor(Math.random() * CIRCUITS);
  s.pickups.push({
    x: s.viewW + 24,
    y: GROUND_Y - (78 + Math.random() * 34),
    circuit,
  });
}

/** Advance one fixed step. Returns true on the frame the bolt dies. */
function simulate(s: GameState, dt: number): boolean {
  s.t += dt;
  updateParticles(s, dt);

  if (s.phase === "idle") {
    s.y = GROUND_Y - Math.abs(Math.sin(s.t * 3)) * 6;
    return false;
  }
  if (s.phase !== "running") return false;

  s.elapsed += dt;
  s.speed = Math.min(SPEED_MAX, SPEED_START + SPEED_RAMP * s.elapsed);
  s.distance += s.speed * dt;
  s.surgeT = Math.max(0, s.surgeT - dt);

  const mult = (s.surgeT > 0 ? 2 : 1) * (1 + 0.08 * chargedCount(s));
  s.volts += s.speed * dt * VOLTS_PER_PX * mult;
  const volts = Math.floor(s.volts);

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

  // Spark trail behind the running bolt.
  s.trailTimer -= dt;
  if (s.trailTimer <= 0) {
    s.trailTimer = 0.035;
    s.particles.push({
      x: BOLT_X + 4,
      y: s.y - BOLT_H * 0.5,
      vx: -s.speed * 0.15 - 20,
      vy: -10 + Math.random() * 20,
      life: 0.25 + Math.random() * 0.2,
      max: 0.45,
      size: 1,
      white: Math.random() < 0.3,
    });
    if (s.particles.length > PARTICLE_CAP) s.particles.shift();
  }

  // Spawn obstacles + pickups.
  s.spawnTimer -= dt;
  if (s.spawnTimer <= 0) {
    spawnObstacle(s, volts);
    const gapPx = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
    s.spawnTimer = Math.max(MIN_REACTION, gapPx / s.speed);
  }
  s.pickupTimer -= dt;
  if (s.pickupTimer <= 0) {
    spawnPickup(s);
    s.pickupTimer = PICKUP_MIN + Math.random() * (PICKUP_MAX - PICKUP_MIN);
  }

  const move = s.speed * dt;
  for (let i = 0; i < s.obstacles.length; i++) s.obstacles[i].x -= move;
  for (let i = 0; i < s.pickups.length; i++) s.pickups[i].x -= move;
  s.obstacles = s.obstacles.filter((o) => o.x + o.w > -16);
  s.pickups = s.pickups.filter((p) => p.x > -16);

  // Player box (shorter when ducking on the ground).
  const ducking = s.duckHeld && s.onGround;
  const ph = ducking ? BOLT_H_DUCK : BOLT_H;
  const py = s.y - ph;

  // Collect pickups (generous full-box overlap).
  for (let i = s.pickups.length - 1; i >= 0; i--) {
    const p = s.pickups[i];
    if (
      BOLT_X < p.x + PICKUP_R &&
      BOLT_X + BOLT_W > p.x - PICKUP_R &&
      py < p.y + PICKUP_R &&
      py + ph > p.y - PICKUP_R
    ) {
      s.pickups.splice(i, 1);
      s.charged[p.circuit] = true;
      s.volts += PICKUP_BONUS;
      s.pendingPickup = true;
      burst(s, p.x, p.y, 8, 120);
      if (chargedCount(s) >= CIRCUITS) {
        s.charged = new Array(CIRCUITS).fill(false);
        s.surgeT = SURGE_DUR;
        s.flashT = s.t;
        s.pendingFull = true;
        burst(s, BOLT_X + BOLT_W / 2, s.y - BOLT_H / 2, 22, 220);
      }
    }
  }

  // Obstacle collision (forgiving hitbox).
  const hx = BOLT_X + 4;
  const hy = py + 4;
  const hw = BOLT_W - 8;
  const hh = ph - 8;
  for (let i = 0; i < s.obstacles.length; i++) {
    const o = s.obstacles[i];
    if (
      hx < o.x + o.w - 2 &&
      hx + hw > o.x + 2 &&
      hy < o.top + o.h &&
      hy + hh > o.top
    ) {
      s.best = Math.max(s.best, volts);
      try {
        localStorage.setItem(BEST_KEY, String(s.best));
      } catch {
        /* storage blocked — best stays in-memory */
      }
      burst(s, BOLT_X + BOLT_W / 2, s.y - BOLT_H / 2, 26, 260);
      return true;
    }
  }
  return false;
}

// ─── Rendering ───────────────────────────────────────────────────────────────
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

function drawSkyline(
  ctx: CanvasRenderingContext2D,
  distance: number,
  vw: number,
) {
  // Far layer.
  ctx.fillStyle = SKY_FAR;
  let off = (distance * 0.12) % TILE;
  for (let base = -off - TILE; base < vw + TILE; base += TILE) {
    for (const b of SKY_FAR_B) ctx.fillRect(base + b[0], GROUND_Y - b[1], b[2], b[1]);
  }
  // Near layer + the tower.
  ctx.fillStyle = SKY_NEAR;
  off = (distance * 0.28) % TILE;
  for (let base = -off - TILE; base < vw + TILE; base += TILE) {
    for (const b of SKY_NEAR_B) ctx.fillRect(base + b[0], GROUND_Y - b[1], b[2], b[1]);
    const tx = base + 300;
    ctx.fillRect(tx - 4, GROUND_Y - 150, 8, 150); // shaft
    ctx.fillRect(tx - 15, GROUND_Y - 152, 30, 15); // observation deck
    ctx.fillRect(tx - 1, GROUND_Y - 170, 2, 20); // antenna
  }
}

function drawObstacle(ctx: CanvasRenderingContext2D, o: Obstacle) {
  ctx.fillStyle = STEEL;
  if (o.type === "cable") {
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

function drawPickup(ctx: CanvasRenderingContext2D, p: Pickup, t: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(t * 2.2);
  ctx.shadowColor = MAGENTA;
  ctx.shadowBlur = 12;
  ctx.fillStyle = MAGENTA;
  ctx.fillRect(-PICKUP_R * 0.7, -PICKUP_R * 0.7, PICKUP_R * 1.4, PICKUP_R * 1.4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, s: GameState) {
  const vw = s.viewW;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, vw, H);

  drawSkyline(ctx, s.distance, vw);

  // Ground wire + moving "current" ticks.
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 1);
  ctx.lineTo(vw, GROUND_Y + 1);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,50,160,0.5)";
  const spacing = 30;
  const off = s.distance % spacing;
  ctx.beginPath();
  for (let x = -off; x < vw; x += spacing) {
    ctx.moveTo(x, GROUND_Y + 6);
    ctx.lineTo(x + 12, GROUND_Y + 6);
  }
  ctx.stroke();

  for (let i = 0; i < s.obstacles.length; i++) drawObstacle(ctx, s.obstacles[i]);
  for (let i = 0; i < s.pickups.length; i++) drawPickup(ctx, s.pickups[i], s.t);

  // Bolt (squashed when ducking; brighter glow while surging).
  const ducking = s.duckHeld && s.onGround;
  const bh = ducking ? BOLT_H_DUCK : BOLT_H;
  ctx.save();
  ctx.translate(BOLT_X, s.y - bh);
  boltPath(ctx, bh);
  ctx.shadowColor = MAGENTA;
  ctx.shadowBlur = s.surgeT > 0 ? 26 : 14;
  ctx.fillStyle = MAGENTA;
  ctx.fill();
  ctx.restore();

  // Particles.
  for (let i = 0; i < s.particles.length; i++) {
    const p = s.particles[i];
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
    ctx.fillStyle = p.white ? "#ffffff" : MAGENTA;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // HUD — volts + best.
  const volts = Math.floor(s.volts);
  ctx.textAlign = "right";
  ctx.font = "600 16px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = s.surgeT > 0 ? MAGENTA : "#ffffff";
  ctx.fillText(`${volts.toLocaleString()} volts`, vw - 16, 30);
  if (s.best > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(`best · ${s.best.toLocaleString()}`, vw - 16, 50);
  }

  // HUD — circuit pips (offset clear of the mute button).
  for (let i = 0; i < CIRCUITS; i++) {
    ctx.beginPath();
    ctx.arc(76 + i * 16, 24, 4.5, 0, TAU);
    ctx.fillStyle = s.charged[i] ? MAGENTA : "rgba(255,255,255,0.18)";
    ctx.fill();
  }

  // Idle prompt (game-over UI is a DOM overlay).
  if (s.phase === "idle" && Math.floor(s.t * 1.6) % 2 === 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 15px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(
      s.touch ? "tap to plug in" : "press space to plug in",
      vw / 2,
      108,
    );
  }

  // Flash (milestone / fully-charged).
  const since = s.t - s.flashT;
  if (s.flashT >= 0 && since < 0.28) {
    ctx.fillStyle = `rgba(255,50,160,${0.3 * (1 - since / 0.28)})`;
    ctx.fillRect(0, 0, vw, H);
  }
}

// Reduced-motion media query as an external store — no setState-in-effect.
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
  const [over, setOver] = React.useState(false);
  const [result, setResult] = React.useState({ volts: 0, best: 0 });
  // Narrower view window on phones → the panel renders taller (same world
  // height, less horizontal lookahead). Decided once on mount.
  const [viewW] = React.useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? 400 : W,
  );
  const [touch] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );
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
      if (g.current.pendingPickup) {
        g.current.pendingPickup = false;
        sfxRef.current?.pickup();
      }
      if (g.current.pendingFull) {
        g.current.pendingFull = false;
        sfxRef.current?.fullCharge();
      }
      if (g.current.pendingMilestone) {
        g.current.pendingMilestone = false;
        sfxRef.current?.milestone();
      }
      if (died) {
        g.current.phase = "over";
        sfxRef.current?.crash();
        try {
          navigator.vibrate?.(40); // Android haptic on zap; iOS ignores it
        } catch {
          /* ignore */
        }
        setResult({ volts: Math.floor(g.current.volts), best: g.current.best });
        setOver(true);
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
      setOver(false);
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
    setOver(false);
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
    g.current.viewW = viewW;
    g.current.touch = touch;
    canvas.width = viewW * dpr;
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
  }, [reduced, startLoop, muted, viewW, touch]);

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
          suppressHydrationWarning
          className="block h-auto w-full touch-none bg-[#0a0a0a] [image-rendering:pixelated] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta"
          style={{ aspectRatio: `${viewW} / ${H}` }}
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
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Game over — the bolt blooms into the WebGL shader. */}
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 backdrop-blur-[1px] sm:gap-1">
            <div className="w-12 sm:w-24">
              <ShaderCanvas
                color={MAGENTA}
                base={[0.3, 0.02, 0.18]}
                maskClassName="bolt-mask"
                fallbackSrc="/brand/sastw-bolt.svg"
                className="aspect-square w-full"
              />
            </div>
            <p className="font-display text-base font-bold uppercase text-magenta sm:text-xl">
              Current broke.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/70 sm:text-xs">
              {result.volts.toLocaleString()} volts
              {result.best > 0 && (
                <span className="text-white/40">
                  {" "}
                  · best {result.best.toLocaleString()}
                </span>
              )}
            </p>
            <button
              onClick={jump}
              className="mt-1 rounded-md bg-magenta px-4 py-1.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90 sm:mt-2 sm:px-5 sm:py-2"
            >
              Reconnect
            </button>
          </div>
        )}

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
      <p
        suppressHydrationWarning
        className="mt-2 text-center font-mono text-[11px] uppercase tracking-widest text-white/40"
      >
        {touch
          ? "Tap to jump · hold low to duck · grab the circuits"
          : "Space / tap to jump · ↓ duck · grab the circuits"}
      </p>
    </div>
  );
}
