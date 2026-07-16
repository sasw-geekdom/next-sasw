"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

// Domain-warped fbm flow, tinted between a dark base and the active color,
// brightening toward the cursor — the "current."
const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color;
uniform vec3 u_base;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = v_uv;
  float t = u_time * 0.12;
  vec2 q = vec2(fbm(uv * 2.4 + vec2(0.0, t)), fbm(uv * 2.4 + vec2(t, 1.0)));
  float f = fbm(uv * 2.4 + q * 1.8 + t * 0.3);
  float d = distance(uv, u_mouse);
  float glow = smoothstep(0.6, 0.0, d);
  vec3 col = mix(u_base, u_color, smoothstep(0.15, 0.95, f) + glow * 0.5);
  col += u_color * glow * 0.45;
  gl_FragColor = vec4(col, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? "shader compile failed");
  }
  return s;
}

/**
 * Full-bleed WebGL "current" flow, clipped to a CSS mask (a brand shape SVG).
 * Falls back to a static image when WebGL is unavailable or motion is reduced.
 * `className` controls sizing/aspect; `maskClassName` clips the canvas.
 */
function lerpPalette(
  pal: [number, number, number][],
  t: number,
): [number, number, number] {
  if (pal.length === 1) return pal[0];
  const x = t * (pal.length - 1);
  const i = Math.min(pal.length - 2, Math.floor(x));
  const f = x - i;
  const a = pal[i];
  const b = pal[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

/**
 * Full-bleed WebGL "current" flow, clipped to a CSS mask (a brand shape SVG).
 * Falls back to a static image when WebGL is unavailable or motion is reduced.
 * `className` controls sizing/aspect; `maskClassName` clips the canvas.
 * With `sweep`, the color eases across that palette as the cursor moves across.
 */
export function ShaderCanvas({
  color,
  maskClassName,
  fallbackSrc,
  className,
  base = [0.08, 0.0, 0.05],
  sweep,
  active = true,
}: {
  color: string;
  maskClassName: string;
  fallbackSrc: string;
  className?: string;
  /** Dark floor the flow mixes up from. Lift it to brighten the whole shape. */
  base?: [number, number, number];
  /** Colors swept left→right as the cursor moves across the shape. */
  sweep?: string[];
  /** When false, keep the context warm but skip GPU work (paused). */
  active?: boolean;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const [failed, setFailed] = React.useState(false);
  const activeRef = React.useRef(active);
  React.useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const mouse = React.useRef<[number, number]>([0.5, 0.55]);
  const target = React.useRef<[number, number, number]>(hexToRgb(color));
  const sweepRef = React.useRef<[number, number, number][] | null>(
    sweep ? sweep.map(hexToRgb) : null,
  );
  React.useEffect(() => {
    sweepRef.current = sweep ? sweep.map(hexToRgb) : null;
  }, [sweep]);
  const current = React.useRef<[number, number, number]>(hexToRgb(color));
  const baseRef = React.useRef<[number, number, number]>(base);

  React.useEffect(() => {
    target.current = hexToRgb(color);
  }, [color]);

  React.useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (!gl) throw new Error("no webgl");

      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("link failed");
      }
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, "u_time");
      const uMouse = gl.getUniformLocation(prog, "u_mouse");
      const uColor = gl.getUniformLocation(prog, "u_color");
      const uBase = gl.getUniformLocation(prog, "u_base");
      gl.uniform3f(uBase, baseRef.current[0], baseRef.current[1], baseRef.current[2]);

      const start = performance.now();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      const draw = (now: number) => {
        if (!activeRef.current) {
          raf = requestAnimationFrame(draw);
          return; // paused — no GPU work while idle
        }
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const bw = Math.max(1, Math.floor(w * dpr));
        const bh = Math.max(1, Math.floor(h * dpr));
        if (canvas.width !== bw || canvas.height !== bh) {
          canvas.width = bw;
          canvas.height = bh;
          gl!.viewport(0, 0, bw, bh);
        }
        for (let i = 0; i < 3; i++) {
          current.current[i] += (target.current[i] - current.current[i]) * 0.07;
        }
        gl!.uniform1f(uTime, (now - start) / 1000);
        gl!.uniform2f(uMouse, mouse.current[0], mouse.current[1]);
        gl!.uniform3f(
          uColor,
          current.current[0],
          current.current[1],
          current.current[2],
        );
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
        raf = requestAnimationFrame(draw);
      };
      raf = requestAnimationFrame(draw);
    } catch {
      setFailed(true);
    }

    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  function setFromPoint(el: Element, clientX: number, clientY: number) {
    const r = el.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width;
    mouse.current = [fx, 1 - (clientY - r.top) / r.height];
    const pal = sweepRef.current;
    if (pal) target.current = lerpPalette(pal, Math.min(1, Math.max(0, fx)));
  }

  function resetSweep() {
    if (sweepRef.current) target.current = hexToRgb(color);
  }

  function onMove(e: React.MouseEvent) {
    setFromPoint(e.currentTarget, e.clientX, e.clientY);
  }

  function onTouch(e: React.TouchEvent) {
    const t = e.touches[0];
    if (t) setFromPoint(e.currentTarget, t.clientX, t.clientY);
  }

  return (
    <div className={cn("relative select-none", className)}>
      {reduce || failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fallbackSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <canvas
          ref={canvasRef}
          onMouseMove={onMove}
          onMouseLeave={resetSweep}
          onTouchStart={onTouch}
          onTouchMove={onTouch}
          onTouchEnd={resetSweep}
          aria-hidden="true"
          className={cn("absolute inset-0 h-full w-full", maskClassName)}
        />
      )}
    </div>
  );
}
