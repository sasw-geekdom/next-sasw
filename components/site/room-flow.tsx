"use client";

import * as React from "react";
import Image from "next/image";
import { ROOMS, PORT_TOP, type Room } from "@/lib/locations";

// Faint warped-grid mesh — the "canvas" texture behind the graph.
function drawMesh(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = Math.max(1, rect.width * dpr);
  canvas.height = Math.max(1, rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(15,15,20,0.05)";
  ctx.lineWidth = 1;
  for (let gy = -20; gy < h + 20; gy += 32) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = gy + Math.sin(x * 0.014 + gy * 0.05) * 7 + Math.sin(x * 0.05) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let gx = -20; gx < w + 20; gx += 32) {
    ctx.beginPath();
    for (let y = 0; y <= h; y += 8) {
      const x = gx + Math.sin(y * 0.014 + gx * 0.05) * 7;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function RoomCard({ room }: { room: Room }) {
  return (
    <article
      data-port={room.port}
      style={{ ["--c" as string]: room.color }}
      className="relative grid grid-cols-1 items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-[var(--c)] sm:grid-cols-[150px_1fr] sm:gap-5"
    >
      {/* input node — on the spine (mobile) / card edge (desktop) */}
      <span
        aria-hidden="true"
        className="rf-dot left-[-22px] top-6 lg:left-[-6.5px] lg:top-1/2 lg:-translate-y-1/2"
      />

      {/* ASCII "screen" — black frame, magenta art. Real portrait drops in here. */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-[#0a0a0a] p-2.5">
        {room.image ? (
          <Image
            src={room.image}
            alt=""
            width={300}
            height={200}
            className="h-auto w-full"
          />
        ) : (
          <pre
            aria-hidden="true"
            className="overflow-x-auto font-mono text-[9px] leading-[1.15] text-magenta [text-shadow:0_0_6px_rgba(255,50,160,0.5)]"
          >
            {room.ascii}
          </pre>
        )}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold uppercase leading-none text-foreground">
          {room.name}
        </h3>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {room.host}
        </p>
        <span
          className="mt-2.5 inline-block rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest"
          style={{
            color: room.color,
            borderColor: `color-mix(in srgb, ${room.color} 40%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${room.color} 10%, transparent)`,
          }}
        >
          {room.tag}
        </span>
        <ul className="mt-3 flex flex-col gap-1.5">
          {room.sessions.map((s) => (
            <li key={s.title} className="flex items-baseline gap-2 text-sm text-foreground">
              <span style={{ color: room.color }}>▸</span>
              {s.title}
              <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.kind}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function RoomFlow() {
  const meshRef = React.useRef<HTMLCanvasElement>(null);
  const graphRef = React.useRef<HTMLDivElement>(null);
  const sourceRef = React.useRef<HTMLDivElement>(null);
  const wiresRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const mesh = meshRef.current;
    const graph = graphRef.current;
    const source = sourceRef.current;
    const svg = wiresRef.current;
    if (!graph || !source || !svg) return;

    const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

    const drawWires = () => {
      if (!isDesktop()) {
        svg.innerHTML = "";
        return;
      }
      const base = graph.getBoundingClientRect();
      svg.setAttribute("width", String(base.width));
      svg.setAttribute("height", String(base.height));
      const center = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - base.left + r.width / 2,
          y: r.top - base.top + r.height / 2,
        };
      };
      let out = "";
      graph.querySelectorAll<HTMLElement>("[data-port]").forEach((card) => {
        const pid = card.getAttribute("data-port");
        const sp = source.querySelector(`[data-src="${pid}"]`);
        const ip = card.querySelector(".rf-dot");
        if (!sp || !ip) return;
        const a = center(sp);
        const b = center(ip);
        const dx = (b.x - a.x) * 0.5;
        const d = `M${a.x} ${a.y} C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}`;
        const color =
          (card.style.getPropertyValue("--c") || "#ff32a0").trim();
        out += `<path class="rf-wire" d="${d}" style="color:${color};stroke:${color}"/>`;
      });
      svg.innerHTML = out;
    };

    const redraw = () => {
      if (mesh) drawMesh(mesh);
      requestAnimationFrame(drawWires);
    };

    redraw();
    const t = window.setTimeout(redraw, 200);
    window.addEventListener("resize", redraw);
    const ro = new ResizeObserver(() => requestAnimationFrame(drawWires));
    ro.observe(graph);
    if (document.fonts?.ready) document.fonts.ready.then(redraw).catch(() => {});

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", redraw);
      ro.disconnect();
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-background">
      <canvas
        ref={meshRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-magenta">
            Four activations · downtown
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
            One week. Four rooms.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
            Sept 28 – Oct 2. Every session runs through one of four downtown
            venues — trace the current to find your room.
          </p>
        </div>

        <div
          ref={graphRef}
          className="relative mt-14 lg:grid lg:grid-cols-[300px_1fr] lg:items-center lg:gap-24"
        >
          <svg
            ref={wiresRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden overflow-visible lg:block"
          />

          {/* source node — the current's origin */}
          <div
            ref={sourceRef}
            className="relative mb-10 rounded-2xl border border-border bg-white p-6 shadow-sm lg:mb-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/sastw-bolt.svg"
              alt=""
              aria-hidden="true"
              className="h-14 w-14"
            />
            <p className="mt-4 font-display text-xl font-bold uppercase leading-none text-foreground">
              Downtown SA
            </p>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Sept 28 – Oct 2 · the source
            </p>
            {/* output ports */}
            <div className="absolute right-0 top-0 hidden h-full lg:block" aria-hidden="true">
              {ROOMS.map((r) => (
                <span
                  key={r.port}
                  data-src={r.port}
                  className="rf-dot right-[-7px]"
                  style={{ ["--c" as string]: r.color, top: PORT_TOP[r.port] }}
                />
              ))}
            </div>
          </div>

          {/* room nodes */}
          <div className="relative flex flex-col gap-5 pl-7 lg:pl-0">
            <span aria-hidden="true" className="rf-spine lg:hidden" />
            {ROOMS.map((room) => (
              <RoomCard key={room.slug} room={room} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
