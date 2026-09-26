"use client";

/* eslint-disable @next/next/no-img-element -- see tv-kit.tsx */

import * as React from "react";
import { BoltShader } from "@/components/site/bolt-shader";
import {
  Chrome,
  Eyebrow,
  Glow,
  Logo,
  Mark,
  Mascots,
  MiniBolts,
  Person,
  SceneLoop,
  StateChip,
  clockOf,
  rise,
  slotStates,
  type SceneDef,
  type SlotState,
} from "@/components/tv/tv-kit";
import { useNow } from "@/components/tv/tv-stage";
import type {
  TvBlock,
  TvData,
  TvDayData,
  TvEventData,
  TvGroupData,
  TvSponsor,
  TvTalk,
  TvWeekData,
} from "@/lib/tv";

const MAGENTA = "#ff32a0";

export function TvLoop({ data }: { data: TvData }) {
  switch (data.kind) {
    case "event":
      return <EventLoop data={data} />;
    case "day":
      return <DayLoop data={data} />;
    case "group":
      return <GroupLoop data={data} />;
    case "week":
      return <WeekLoop data={data} />;
  }
}

// ── Shared scenes ────────────────────────────────────────────────────────────

function whoLine(t: TvTalk): string {
  const speakers = t.people.filter((p) => p.role !== "moderator").map((p) => p.name);
  const mod = t.people.find((p) => p.role === "moderator");
  return [speakers.join(", "), mod ? `moderated by ${mod.name}` : ""].filter(Boolean).join(" · ");
}

/** The running order: one row at a time, then held, with Now / Up next live. */
function Agenda({
  title,
  rows,
  states,
  accent,
  top = 250,
}: {
  title: React.ReactNode;
  rows: { time: string; title: string; who?: string; flag?: boolean }[];
  states: SlotState[];
  accent: string;
  top?: number;
}) {
  // Rows share what's left between the heading and the footer, so seven talks
  // and ten both fit without a scroll or a clipped last line.
  const rowH = Math.min(96, Math.floor((1080 - top - 90 - 150) / Math.max(1, rows.length)));
  const dense = rowH < 80;
  return (
    <div className="absolute inset-x-29 z-10" style={{ top }}>
      <div className="tv-rise" style={rise(0, 0.2)}>
        <Eyebrow accent={accent}>{title}</Eyebrow>
      </div>
      <div className="mt-6">
        {rows.map((r, i) => {
          const s = states[i] ?? "later";
          return (
            <div
              key={i}
              data-tv-keep
              className="tv-rise grid grid-cols-[190px_1fr] items-center border-t border-white/12 first:border-t-0"
              style={{
                ...rise(i, 0.6, 1.1),
                height: rowH,
                background:
                  s === "now"
                    ? `linear-gradient(90deg, ${accent}2e, transparent 85%)`
                    : undefined,
                opacity: s === "past" ? 0.38 : undefined,
              }}
            >
              <span
                className="pl-3 font-mono tabular-nums"
                style={{ color: accent, fontSize: dense ? 26 : 30 }}
              >
                {r.time}
              </span>
              <span className="flex min-w-0 items-baseline">
                <span
                  className="shrink truncate font-display font-medium uppercase leading-[1.15]"
                  style={{ fontSize: dense ? 38 : 44, color: r.flag ? accent : undefined, maxWidth: "78%" }}
                >
                  {r.title}
                </span>
                <StateChip state={s} accent={accent} />
                {r.who ? (
                  <span
                    className="ml-5 min-w-0 flex-1 truncate text-white/60"
                    style={{ fontSize: dense ? 22 : 24 }}
                  >
                    {r.who}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** "On stage now", a talk given the whole screen. */
function Spotlight({
  label,
  talk,
  then,
  accent,
  extra,
}: {
  label: string;
  talk: TvTalk;
  then?: TvTalk;
  accent: string;
  extra?: React.ReactNode;
}) {
  const people = talk.people;
  const size = people.length > 3 ? 160 : people.length > 2 ? 190 : people.length > 1 ? 215 : 290;
  return (
    <div className="absolute inset-x-29 top-52.5 bottom-35 z-10 flex flex-col">
      <div className="tv-rise" style={rise(0, 0.2)}>
        <Eyebrow accent={accent}>
          {label} · {clockOf(talk.startsAt)}
          {talk.by ? ` · ${talk.by}` : ""}
        </Eyebrow>
      </div>
      <h2
        data-tv-keep
        className="tv-rise mt-6 max-w-375 font-display text-[92px] font-bold uppercase leading-[0.95] tracking-[-0.005em]"
        style={rise(1, 0.5)}
      >
        {talk.short}
      </h2>
      {talk.title !== talk.short ? (
        <p data-tv-keep className="tv-rise mt-4 max-w-375 text-[40px] font-medium leading-[1.2] text-white/85" style={rise(1, 0.7)}>
          {talk.title.slice(talk.short.length).replace(/^[\s:—–]+/, "")}
        </p>
      ) : null}
      {talk.lede ? (
        <p
          data-tv-keep
          className="tv-rise mt-8 max-w-337.5 text-[32px] leading-[1.42] text-white/75"
          style={rise(2, 0.5, 0.5)}
        >
          {talk.lede}
        </p>
      ) : null}
      {extra}
      <div
        data-tv-keep
        className="tv-rise mt-auto grid gap-x-16 gap-y-8"
        style={{
          ...rise(2, 0.6, 0.6),
          gridTemplateColumns: `repeat(${Math.min(people.length, 3) || 1}, minmax(0, 1fr))`,
        }}
      >
        {people.map((p) => (
          <Person key={p.name} p={p} size={size} accent={accent} />
        ))}
      </div>
      {then ? (
        <p
          data-tv-keep
          className="tv-rise mt-10 font-mono text-[24px] uppercase tracking-[0.14em] text-white/55"
          style={rise(4, 0.6, 0.6)}
        >
          <span style={{ color: accent }}>Then</span> · {clockOf(then.startsAt)} · {then.short}
        </p>
      ) : null}
    </div>
  );
}

/** Pick the talk a screen should feature right now, and what to call it. */
function featured(talks: TvTalk[], states: SlotState[], now: number) {
  const on = states.indexOf("now");
  if (on >= 0) return { i: on, label: "On stage now" };
  const next = states.indexOf("next");
  if (next >= 0) return { i: next, label: "Up next" };
  if (talks.length && now && now < talks[0].startsAt) return { i: 0, label: "Up first" };
  return null;
}

function Tiles({
  logos,
  accent,
}: {
  logos: { name: string; node: React.ReactNode; caption?: string }[];
  accent: string;
}) {
  const cols = logos.length > 4 ? 3 : logos.length;
  return (
    <div
      className="grid gap-9"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {logos.map((l, i) => (
        <div
          key={l.name}
          data-tv-keep
          className="tv-tile flex flex-col items-center justify-center gap-7 rounded-[20px] border border-white/10"
          style={{
            // Two animations on a tile (see .tv-tile): its entrance, then its
            // turn in the light — one delay each.
            animationDelay: `${0.7 + i * 0.35}s, ${3 + i * 2.2}s`,
            height: logos.length > 3 ? 250 : 360,
            background: "radial-gradient(ellipse 80% 70% at 50% 40%, #16151b, #0b0b0e)",
            ["--acc" as string]: accent,
          }}
        >
          <div className="flex h-42.5 items-center">{l.node}</div>
          {l.caption ? (
            <p className="font-mono text-[22px] uppercase tracking-[0.18em]" style={{ color: accent }}>
              {l.caption}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SponsorScene({ s, accent }: { s: TvSponsor; accent: string }) {
  return (
    <div className="absolute inset-x-29 top-60 z-10">
      <div className="tv-rise" style={rise(0, 0.2)}>
        <Eyebrow accent={accent}>The circuit</Eyebrow>
      </div>
      <h2
        data-tv-keep
        className="tv-rise mt-6 flex items-center gap-8 font-display text-[110px] font-bold uppercase leading-none"
        style={rise(1, 0.4)}
      >
        <span className="inline-block h-21 w-4.5 rounded-full" style={{ background: s.color }} />
        {s.circuit}
      </h2>
      <p
        data-tv-keep
        className="tv-rise mt-16 font-mono text-[24px] uppercase tracking-[0.18em] text-white/60"
        style={rise(2, 0.6, 0.5)}
      >
        Sponsored by
      </p>
      <div data-tv-keep className="tv-rise mt-7 inline-block" style={rise(3, 0.6, 0.5)}>
        <img src={s.src} alt={s.name} className="block h-37.5 w-auto max-w-275 object-contain" />
      </div>
      {s.note ? (
        <p
          data-tv-keep
          className="tv-rise mt-14 max-w-287.5 border-l-4 pl-8 text-[34px] leading-[1.4] text-white/85"
          style={{ ...rise(4, 0.6, 0.5), borderColor: accent }}
        >
          {s.note}
        </p>
      ) : null}
    </div>
  );
}

// ── The events: The Model, Access Granted, PySanAntonio ─────────────────────

const EVENT_ACCENT: Record<TvEventData["brand"], string> = {
  "the-model": "#C0B4FC",
  "access-granted": "#00ff66",
  pysanantonio: "#4a90d9",
};

function EventWordmark({ brand }: { brand: TvEventData["brand"] }) {
  if (brand === "the-model")
    return (
      <div className="whitespace-nowrap font-mono text-[150px] font-medium uppercase leading-none tracking-[-0.02em] text-white/90">
        The
        <span className="ml-2 inline-block bg-[#C0B4FC] px-4 text-[#09090B]">Model</span>
        <span className="tv-caret ml-4 inline-block h-31.5 w-2.75 bg-[#00B4FC] align-[-8px]" />
      </div>
    );
  if (brand === "access-granted")
    return (
      <div className="font-display text-[170px] font-bold uppercase leading-[0.88]">
        <span className="text-[#00ff66]">Access</span>
        <br />
        Granted
      </div>
    );
  return <img src="/pysa/wordmark-dark.svg" alt="PySanAntonio" className="block h-37.5 w-auto" />;
}

/** The main visual on the right of the hero, per event. */
function EventVisual({ brand }: { brand: TvEventData["brand"] }) {
  if (brand === "access-granted")
    return (
      <video
        src="/access-granted/padlock-loop.mp4"
        autoPlay
        muted
        loop
        playsInline
        // The padlock sits mid-frame on a ground a shade off black, so the
        // clip is feathered from its centre out — an edge fade leaves the
        // box readable along each side.
        className="tv-spot-mask absolute right-22.5 top-45 z-1 h-200 w-auto"
      />
    );
  if (brand === "pysanantonio")
    return (
      <div className="tv-soft-edge absolute right-15 top-45 z-1 h-200 w-205">
        <video
          src="/pysa/pysa2-loop.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover object-center"
        />
      </div>
    );
  return null; // The Model's visual is the mascots, over the whole stage.
}

function EventLoop({ data }: { data: TvEventData }) {
  const now = useNow();
  const accent = EVENT_ACCENT[data.brand];
  const states = slotStates(data.talks, now);
  const pick = featured(data.talks, states, now);
  const first = data.talks[0];
  const last = data.talks[data.talks.length - 1];
  const hero = data.brand === "the-model";

  const rows: { time: string; title: string; who?: string; flag?: boolean }[] = data.talks.map((t) => ({
    time: clockOf(t.startsAt),
    title: t.short,
    who: whoLine(t),
  }));
  const rowStates = [...states];
  if (data.village) {
    rows.push({ time: "1–6 PM", title: data.village.name, who: `${data.village.by} · drop in anytime`, flag: true });
    rowStates.push("later");
  }

  const scenes: SceneDef[] = [
    {
      key: "hero",
      dur: 16,
      node: (
        <div className="absolute left-29 top-55 z-10 w-250">
          <div className="tv-rise" style={rise(0, 0.2)}>
            <Eyebrow accent={accent}>{data.dayWord} at Geekdom</Eyebrow>
          </div>
          <div data-tv-keep className="tv-rise mt-7 inline-block" style={rise(1, 0.4)}>
            <EventWordmark brand={data.brand} />
          </div>
          <p
            data-tv-keep
            className="tv-rise mt-12 max-w-225 border-l-4 pl-8 text-[40px] leading-[1.38] text-white/90"
            style={{ ...rise(2, 0.6, 0.6), borderColor: data.brand === "the-model" ? "#00B4FC" : accent }}
          >
            {data.hook.setup} {data.hook.turn}
          </p>
          {first && last ? (
            <p
              data-tv-keep
              className="tv-rise mt-10 font-mono text-[26px] tracking-[0.06em] text-white/65"
              style={rise(3, 0.6, 0.6)}
            >
              <span style={{ color: accent }}>{"//"}</span> {data.talks.length} sessions ·{" "}
              {clockOf(first.startsAt)} – {clockOf(last.startsAt)} · {data.place}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "agenda",
      dur: Math.round(3 + rows.length * 1.1 + 9),
      node: <Agenda title="The afternoon" rows={rows} states={rowStates} accent={accent} top={210} />,
    },
  ];
  if (pick) {
    const t = data.talks[pick.i];
    scenes.push({
      key: "spotlight",
      dur: 14,
      node: <Spotlight label={pick.label} talk={t} then={data.talks[pick.i + 1]} accent={accent} />,
    });
  }
  if (data.organizers.length)
    scenes.push({
      key: "powered",
      dur: 6 + data.organizers.length * 2.2,
      node: (
        <div className="absolute inset-x-29 top-57.5 z-10">
          <div className="tv-rise" style={rise(0, 0.2)}>
            <Eyebrow accent={accent}>Powered by</Eyebrow>
          </div>
          <h2
            data-tv-keep
            className="tv-rise mt-5 text-[76px] font-semibold leading-[1.05] tracking-[-0.015em]"
            style={rise(1, 0.4)}
          >
            {`${["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"][data.organizers.length] ?? data.organizers.length} communities`},{" "}
            <em className="px-3 not-italic text-black" style={{ background: accent }}>
              one room.
            </em>
          </h2>
          <div className="mt-14">
            <Tiles
              accent={accent}
              logos={data.organizers.map((o) => ({ name: o.name, node: <Logo logo={o} />, caption: o.name }))}
            />
          </div>
        </div>
      ),
    });
  if (data.village) {
    const v = data.village;
    scenes.push({
      key: "village",
      dur: 11,
      node: (
        <div className="absolute inset-x-29 top-60 z-10 grid grid-cols-[1fr_auto] items-center gap-20">
          <div>
            <div className="tv-rise" style={rise(0, 0.2)}>
              <Eyebrow accent={accent}>All afternoon · 1 – 6 PM</Eyebrow>
            </div>
            <h2
              data-tv-keep
              className="tv-rise mt-6 font-display text-[140px] font-bold uppercase leading-[0.9]"
              style={rise(1, 0.4)}
            >
              Lockpicking
              <br />
              <span style={{ color: accent }}>Village</span>
            </h2>
            <p
              data-tv-keep
              className="tv-rise mt-12 max-w-225 border-l-4 pl-8 text-[36px] leading-[1.4] text-white/85"
              style={{ ...rise(2, 0.6, 0.6), borderColor: accent }}
            >
              {v.note}
            </p>
            <p
              data-tv-keep
              className="tv-rise mt-10 font-mono text-[26px] uppercase tracking-[0.14em] text-white/60"
              style={rise(3, 0.6, 0.6)}
            >
              Walk in whenever · {v.by}
            </p>
          </div>
          <div data-tv-keep className="tv-rise" style={rise(2, 0.6, 0.6)}>
            <Logo logo={v.logo} scale={1.6} />
          </div>
        </div>
      ),
    });
  }
  if (data.sponsor)
    scenes.push({ key: "sponsor", dur: 11, node: <SponsorScene s={data.sponsor} accent={accent} /> });

  return (
    <div className="absolute inset-0">
      <Glow color={accent} />
      {data.brand === "access-granted" ? <div className="tv-grid absolute inset-0 z-0" /> : null}
      {hero ? <Mascots color={accent} /> : null}
      <HeroVisualGate brand={data.brand} />
      <Chrome
        accent={accent}
        url={data.url}
        when={
          <>
            {data.dateLabel.replace(/^\w+, /, "")} · <b className="font-medium" style={{ color: accent }}>{data.timeLabel}</b> · {data.place}
          </>
        }
      />
      <SceneLoop scenes={scenes} />
    </div>
  );
}

/**
 * The padlock and the mascot video sit behind every scene but show only on
 * the hero — hidden rather than unmounted elsewhere, so the video keeps its
 * place and never restarts from a black first frame.
 */
function HeroVisualGate({ brand }: { brand: TvEventData["brand"] }) {
  return (
    <div className="tv-hero-visual">
      <EventVisual brand={brand} />
    </div>
  );
}

// ── The community days: Tuesday, Thursday ────────────────────────────────────

function blockWho(b: TvBlock): string {
  const names = b.talks.flatMap((t) => t.people.filter((p) => p.role !== "moderator").map((p) => p.name));
  return [...new Set(names)].join(", ");
}

function BlockSpotlight({ b, state, accent }: { b: TvBlock; state: SlotState; accent: string }) {
  const people = [...new Map(b.talks.flatMap((t) => t.people).map((p) => [p.name, p])).values()];
  const size = people.length > 4 ? 140 : people.length > 2 ? 175 : 235;
  return (
    <div className="absolute inset-x-29 top-50 bottom-35 z-10 flex flex-col">
      <div className="tv-rise flex items-center" style={rise(0, 0.2)}>
        <Eyebrow accent={accent}>
          {b.timeLabel} · {b.circuit}
        </Eyebrow>
        <StateChip state={state} accent={accent} />
      </div>
      <div data-tv-keep className="tv-rise mt-8" style={rise(1, 0.4)}>
        <Mark mark={b.mark} h={b.mark.kind === "image" ? 120 : 130} accent={accent} />
      </div>
      <div className="mt-10 space-y-5">
        {b.talks.length ? (
          b.talks.slice(0, 3).map((t, i) => (
            <p
              key={t.title}
              data-tv-keep
              className="tv-rise font-display font-medium uppercase leading-[1.02]"
              style={{ ...rise(i, 0.9, 0.5), fontSize: b.talks.length > 1 ? 52 : 72 }}
            >
              {b.talks.length > 1 ? (
                <span className="mr-5 font-mono text-[28px] font-normal" style={{ color: accent }}>
                  {clockOf(t.startsAt)}
                </span>
              ) : null}
              {b.talks.length > 1 ? t.short : t.title}
            </p>
          )).concat(
            b.talks.length === 1 && b.talks[0].lede
              ? [
                  <p
                    key="lede"
                    data-tv-keep
                    className="tv-rise max-w-337.5 pt-3 text-[32px] leading-[1.42] text-white/75"
                    style={rise(1, 1.2)}
                  >
                    {b.talks[0].lede}
                  </p>,
                ]
              : [],
          )
        ) : (
          <p data-tv-keep className="tv-rise max-w-325 text-[42px] leading-[1.35] text-white/85" style={rise(0, 0.9)}>
            {b.blurb}
          </p>
        )}
      </div>
      {people.length ? (
        <div
          data-tv-keep
          className="tv-rise mt-auto grid gap-x-14 gap-y-7"
          style={{ ...rise(3, 0.9, 0.5), gridTemplateColumns: `repeat(${people.length > 2 ? 3 : 2}, minmax(0, 1fr))` }}
        >
          {people.slice(0, 6).map((p) => (
            <Person key={p.name} p={p} size={size} accent={accent} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DayLoop({ data }: { data: TvDayData }) {
  const now = useNow();
  const accent = MAGENTA;
  const states = slotStates(data.blocks, now);
  const first = data.blocks[0];
  const last = data.blocks[data.blocks.length - 1];

  // Spotlights start from whoever is on (or next), so the first one the room
  // sees after a changeover is the group now at the front.
  const lead = Math.max(0, states.findIndex((s) => s === "now" || s === "next"));
  const order = data.blocks.map((_, i) => (i + lead) % data.blocks.length).filter((i) => states[i] !== "past");

  const scenes: SceneDef[] = [
    {
      key: "hero",
      dur: 11,
      node: (
        <>
          <div className="absolute left-29 top-75 z-10">
            <div className="tv-rise" style={rise(0, 0.2)}>
              <Eyebrow accent={accent}>Powered by DEVSA</Eyebrow>
            </div>
            <h1
              data-tv-keep
              className="tv-rise mt-6 font-display text-[190px] font-bold uppercase leading-[0.86]"
              style={rise(1, 0.4)}
            >
              {data.dayWord}
              <br />
              <span style={{ color: accent }}>at Geekdom</span>
            </h1>
            {first && last ? (
              <p
                data-tv-keep
                className="tv-rise mt-12 font-mono text-[30px] tracking-[0.06em] text-white/75"
                style={rise(2, 0.6, 0.6)}
              >
                {data.dateLabel} · <b className="font-medium" style={{ color: accent }}>{clockOf(first.startsAt)} – {clockOf(last.endsAt)}</b> · The Rand, 3rd Floor
              </p>
            ) : null}
          </div>
          <div className="tv-bolt-in absolute right-27.5 top-47.5 z-1 w-175">
            <BoltShader color={accent} />
          </div>
        </>
      ),
    },
    {
      key: "lineup",
      dur: Math.round(3 + data.blocks.length * 1.1 + 9),
      node: (
        <div className="absolute inset-x-29 top-57.5 z-10">
          <div className="tv-rise" style={rise(0, 0.2)}>
            <Eyebrow accent={accent}>{data.dayWord} at Geekdom</Eyebrow>
          </div>
          <div className="mt-8">
            {data.blocks.map((b, i) => {
              const s = states[i];
              return (
                <div
                  key={b.slug}
                  data-tv-keep
                  className="tv-rise grid grid-cols-[250px_1fr] items-center border-t border-white/12 py-5.5 first:border-t-0"
                  style={{
                    ...rise(i, 0.6, 1.1),
                    background: s === "now" ? `linear-gradient(90deg, ${accent}2e, transparent 85%)` : undefined,
                    opacity: s === "past" ? 0.38 : undefined,
                  }}
                >
                  <span className="pl-3 font-mono text-[30px] tabular-nums" style={{ color: accent }}>
                    {clockOf(b.startsAt)}
                  </span>
                  <span className="flex items-center">
                    <Mark mark={b.mark} h={b.mark.kind === "image" ? 70 : 64} accent={accent} />
                    <StateChip state={s} accent={accent} />
                    {b.mark.kind === "image" && blockWho(b) ? (
                      <span className="ml-8 truncate text-[24px] text-white/55">{blockWho(b)}</span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    ...order.map((i) => ({
      key: `block-${data.blocks[i].slug}`,
      dur: 11,
      node: <BlockSpotlight b={data.blocks[i]} state={states[i]} accent={accent} />,
    })),
    ...data.sponsors.map((s) => ({
      key: `sponsor-${s.circuit}`,
      dur: 10,
      node: <SponsorScene s={s} accent={accent} />,
    })),
  ];

  return (
    <div className="absolute inset-0">
      <MiniBolts count={36} opacity={0.6} />
      <Chrome
        url={data.url}
        when={
          <>
            {data.dateLabel.replace(/^\w+, /, "")} · <b className="font-medium text-[#ff32a0]">Geekdom</b> · The Rand
          </>
        }
      />
      <SceneLoop scenes={scenes} />
    </div>
  );
}

// ── One group ────────────────────────────────────────────────────────────────

function GroupLoop({ data }: { data: TvGroupData }) {
  const now = useNow();
  const accent = MAGENTA;
  const b = data.block;
  const [state] = slotStates([b], now);
  const talkStates = slotStates(b.talks, now);
  const afterStates = slotStates(data.after, now);

  const scenes: SceneDef[] = [
    {
      key: "hero",
      dur: 12,
      node: (
        <>
          <div className="absolute left-29 top-70 z-10 w-275">
            <div className="tv-rise flex items-center" style={rise(0, 0.2)}>
              <Eyebrow accent={accent}>{data.dayWord} at Geekdom</Eyebrow>
              <StateChip state={state} accent={accent} />
            </div>
            <div data-tv-keep className="tv-rise mt-10" style={rise(1, 0.4)}>
              <Mark mark={b.mark} h={150} accent={accent} wrap />
            </div>
            {b.tagline ? (
              <p
                data-tv-keep
                className="tv-rise mt-8 max-w-275 text-[50px] font-medium leading-[1.2] text-white/90"
                style={rise(2, 0.5)}
              >
                {b.tagline}
              </p>
            ) : null}
            <p
              data-tv-keep
              className="tv-rise mt-12 font-mono text-[34px] tracking-[0.06em] text-white/80"
              style={rise(2, 0.6, 0.6)}
            >
              <b className="font-medium" style={{ color: accent }}>{b.timeLabel}</b> · The Rand, 3rd Floor
            </p>
            {b.blurb ? (
              <p
                data-tv-keep
                className="tv-rise mt-10 max-w-250 border-l-4 pl-8 text-[34px] leading-[1.4] text-white/80"
                style={{ ...rise(3, 0.6, 0.6), borderColor: accent }}
              >
                {b.blurb}
              </p>
            ) : null}
          </div>
          <div className="tv-bolt-in absolute right-27.5 top-57.5 z-1 w-155">
            <BoltShader color={accent} />
          </div>
        </>
      ),
    },
    ...b.talks.map((t, i) => ({
      key: `talk-${i}`,
      dur: 14,
      node: (
        <Spotlight
          label={talkStates[i] === "now" ? "On stage now" : talkStates[i] === "next" ? "Up next" : b.talks.length > 1 ? `Talk ${i + 1} of ${b.talks.length}` : "The talk"}
          talk={t}
          then={b.talks[i + 1]}
          accent={accent}
        />
      ),
    })),
  ];
  if (b.poweredBy.length)
    scenes.push({
      key: "powered",
      dur: 10,
      node: (
        <div className="absolute inset-x-29 top-65 z-10">
          <div className="tv-rise" style={rise(0, 0.2)}>
            <Eyebrow accent={accent}>Powered by</Eyebrow>
          </div>
          <div className="mt-12">
            <Tiles accent={accent} logos={b.poweredBy.map((o) => ({ name: o.name, node: <Logo logo={o} scale={1.3} />, caption: o.name }))} />
          </div>
        </div>
      ),
    });
  if (data.sponsor) scenes.push({ key: "sponsor", dur: 10, node: <SponsorScene s={data.sponsor} accent={accent} /> });
  if (data.after.length)
    scenes.push({
      key: "after",
      dur: 10,
      node: (
        <Agenda
          title={`Later at Geekdom · ${data.dayWord}`}
          rows={data.after.map((a) => ({
            time: clockOf(a.startsAt),
            title: a.mark.kind === "text" ? a.mark.text : a.title,
            who: blockWho(a),
          }))}
          states={afterStates}
          accent={accent}
        />
      ),
    });

  return (
    <div className="absolute inset-0">
      <MiniBolts count={36} opacity={0.6} />
      <Chrome
        url={data.url}
        when={
          <>
            {data.dateLabel.replace(/^\w+, /, "")} · <b className="font-medium text-[#ff32a0]">{b.timeLabel}</b> · Geekdom
          </>
        }
      />
      <SceneLoop scenes={scenes} />
    </div>
  );
}

// ── The week ─────────────────────────────────────────────────────────────────

function LogoWall({ title, logos, accent }: { title: string; logos: TvWeekData["partners"]; accent: string }) {
  const big = logos.length <= 8;
  return (
    <div className="absolute inset-x-29 top-55 bottom-37.5 z-10 flex flex-col">
      <div className="tv-rise" style={rise(0, 0.2)}>
        <Eyebrow accent={accent}>{title}</Eyebrow>
      </div>
      <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-x-20 gap-y-14">
        {logos.map((l, i) => (
          <div key={l.name + i} data-tv-keep className="tv-rise" style={rise(i, 0.5, Math.min(0.25, 6 / logos.length))}>
            <Logo logo={l} scale={big ? 1.4 : 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekLoop({ data }: { data: TvWeekData }) {
  const now = useNow();
  const accent = MAGENTA;
  const todayIso = now ? new Date(now).toLocaleDateString("en-CA", { timeZone: "America/Chicago" }) : "";
  const today = data.days.find((d) => d.iso === todayIso);
  const todayStates = today ? slotStates(today.items, now) : [];
  const upcoming = today
    ? today.items.map((it, i) => ({ it, s: todayStates[i] })).filter((x) => x.s !== "past").slice(0, 8)
    : [];

  const scenes: SceneDef[] = [
    {
      key: "hero",
      dur: 13,
      node: (
        <>
          <div className="absolute left-29 top-65 z-10 w-262.5">
            <div className="tv-rise" style={rise(0, 0.2)}>
              <Eyebrow accent={accent}>San Antonio · Sept 28 – Oct 2, 2026</Eyebrow>
            </div>
            <h1
              data-tv-keep
              className="tv-rise mt-7 font-display text-[150px] font-bold uppercase leading-[0.88]"
              style={rise(1, 0.4)}
            >
              Startup
              <br />+ Tech <span style={{ color: accent }}>Week</span>
            </h1>
            <p
              data-tv-keep
              className="tv-rise mt-12 border-l-4 pl-8 text-[46px] leading-[1.3] text-white/90"
              style={{ ...rise(2, 0.6, 0.6), borderColor: accent }}
            >
              Five circuits, one current. <span style={{ color: accent }}>Plug in.</span>
            </p>
          </div>
          <div className="tv-bolt-in absolute right-27.5 top-45 z-1 w-180">
            <BoltShader color={accent} />
          </div>
        </>
      ),
    },
  ];

  if (today && upcoming.length)
    scenes.push({
      key: "today",
      dur: Math.round(3 + upcoming.length * 1.1 + 9),
      node: (
        <div className="absolute inset-x-29 top-55 z-10">
          <div className="tv-rise" style={rise(0, 0.2)}>
            <Eyebrow accent={accent}>
              Today · {today.weekday}, {today.label}
            </Eyebrow>
          </div>
          <div className="mt-6">
            {upcoming.map(({ it, s }, i) => (
              <div
                key={it.title + it.startsAt}
                data-tv-keep
                className="tv-rise grid grid-cols-[210px_minmax(0,1fr)_auto] items-baseline gap-6 border-t border-white/12 py-3.5 first:border-t-0"
                style={{
                  ...rise(i, 0.6, 1.1),
                  background: s === "now" ? `linear-gradient(90deg, ${accent}2e, transparent 85%)` : undefined,
                }}
              >
                <span className="pl-3 font-mono text-[28px] tabular-nums" style={{ color: accent }}>
                  {clockOf(it.startsAt)}
                </span>
                <span className="truncate font-display text-[40px] font-medium uppercase leading-[1.05]">
                  {it.title}
                  <StateChip state={s} accent={accent} />
                </span>
                <span className="font-mono text-[22px] uppercase tracking-[0.12em] text-white/55">{it.venue}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    });

  scenes.push({
    key: "week",
    dur: 16,
    node: (
      <div className="absolute inset-x-29 top-55 bottom-35 z-10 flex flex-col">
        <div className="tv-rise" style={rise(0, 0.2)}>
          <Eyebrow accent={accent}>The week</Eyebrow>
        </div>
        <div className="mt-10 grid flex-1 grid-cols-5 gap-8">
          {data.days.map((d, i) => {
            const shown = d.items.slice(0, 6);
            return (
              <div
                key={d.iso}
                data-tv-keep
                className="tv-rise overflow-hidden rounded-[18px] border border-white/10 bg-[#0c0b10] p-7"
                style={{ ...rise(i, 0.5, 0.4), borderColor: d.iso === todayIso ? accent : undefined }}
              >
                <p className="font-display text-[46px] font-bold uppercase leading-none">{d.weekday.slice(0, 3)}</p>
                <p className="mt-2 font-mono text-[20px] uppercase tracking-[0.14em]" style={{ color: accent }}>
                  {d.label}
                </p>
                <ul className="mt-6 space-y-3">
                  {shown.map((it) => (
                    <li key={it.title + it.startsAt} className="line-clamp-2 text-[22px] leading-[1.2] text-white/85">
                      {it.title}
                    </li>
                  ))}
                  {d.items.length > shown.length ? (
                    <li className="font-mono text-subheading uppercase tracking-[0.12em] text-white/45">
                      +{d.items.length - shown.length} more
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    ),
  });

  scenes.push({
    key: "circuits",
    dur: 14,
    node: (
      <div className="absolute inset-x-29 top-55 z-10">
        <div className="tv-rise" style={rise(0, 0.2)}>
          <Eyebrow accent={accent}>Five circuits, one current</Eyebrow>
        </div>
        <div className="mt-8">
          {data.circuits.map((c, i) => (
            <div
              key={c.name}
              data-tv-keep
              className="tv-rise grid grid-cols-[28px_1fr_auto] items-center gap-8 border-t border-white/12 py-3.75 first:border-t-0"
              style={rise(i, 0.6, 0.9)}
            >
              <span className="h-16 w-3 rounded-full" style={{ background: c.color }} />
              <span>
                <span className="block font-display text-[50px] font-bold uppercase leading-none">{c.name}</span>
                <span className="mt-2 block text-[25px] text-white/60">{c.description}</span>
              </span>
              {c.sponsor ? (
                <span className="flex items-center gap-6">
                  <span className="font-mono text-subheading uppercase tracking-[0.16em] text-white/50">Sponsored by</span>
                  <img src={c.sponsor.src} alt={c.sponsor.name} className="block h-15 w-auto max-w-95 object-contain" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    ),
  });

  for (const c of data.circuits)
    if (c.sponsor) scenes.push({ key: `sponsor-${c.name}`, dur: 10, node: <SponsorScene s={c.sponsor} accent={accent} /> });
  if (data.sponsors.length)
    scenes.push({ key: "sponsors", dur: 12, node: <LogoWall title="Our sponsors" logos={data.sponsors} accent={accent} /> });
  if (data.partners.length)
    scenes.push({ key: "partners", dur: 14, node: <LogoWall title="Our partners" logos={data.partners} accent={accent} /> });

  return (
    <div className="absolute inset-0">
      <MiniBolts count={36} opacity={0.6} />
      <Chrome
        url={data.url}
        when={
          <>
            Sept 28 – Oct 2 · <b className="font-medium text-[#ff32a0]">sasw.co</b>
          </>
        }
      />
      <SceneLoop scenes={scenes} />
    </div>
  );
}
