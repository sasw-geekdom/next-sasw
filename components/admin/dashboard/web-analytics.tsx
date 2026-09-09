"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Users, Eye, Gauge, LineChart } from "lucide-react";
import {
  RANGE_KEYS,
  type RangeKey,
  type WebAnalytics as WebAnalyticsData,
} from "@/lib/analytics/types";
import { formatCompact, formatPercent, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/admin/dashboard/metric-card";
import { SessionsTrend } from "@/components/admin/dashboard/sessions-trend";

const RANGE_LABELS: Record<RangeKey, string> = {
  "7": "7d",
  "30": "30d",
  "90": "90d",
  event: "Event week",
};

export function WebAnalytics({
  data,
  range,
  registrations,
}: {
  data: WebAnalyticsData | null;
  range: RangeKey;
  /**
   * Signups inside the same window, so traffic and the thing traffic is for
   * can be read against each other. They were two sections of one page with no
   * relationship shown between them.
   */
  registrations: {
    total: number;
    byDay: { iso: string; label: string; count: number }[];
  };
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">
          Web analytics
        </h2>
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {RANGE_KEYS.map((k) => (
            <Link
              key={k}
              href={`/admin?range=${k}`}
              scroll={false}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium tabular-nums transition-colors",
                range === k
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {RANGE_LABELS[k]}
            </Link>
          ))}
        </div>
      </div>

      {data === null ? (
        <Setup />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Metrics across the top, chart full width beneath.
              The chart used to take two thirds and the four metric cards a
              third beside it — which left the right column ending halfway down
              a tall card, a column of dead space, and both curves drawn at two
              thirds of the width available to them. A time series wants width
              more than anything else on this page. */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              icon={LineChart}
              label="Sessions"
              value={formatCompact(data.sessions.value)}
              delta={data.sessions.delta}
              sub={data.comparison}
            />
            <MetricCard
              icon={Users}
              label="Users"
              value={formatCompact(data.users.value)}
              delta={data.users.delta}
            />
            <MetricCard
              icon={Eye}
              label="Page views"
              value={formatCompact(data.pageViews.value)}
              delta={data.pageViews.delta}
            />
            <MetricCard
              icon={Gauge}
              label="Engagement rate"
              value={formatPercent(data.engagementRate.value)}
              delta={data.engagementRate.delta}
              sub={`Avg ${formatDuration(data.avgSessionDuration)} engaged`}
            />
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Sessions
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {data.label}
              </span>
            </div>
            <div className="mt-1 font-display text-3xl font-bold tabular-nums">
              {formatCompact(data.sessions.value)}
            </div>
            <div className="mt-3">
              <SessionsTrend data={data.byDay} />
            </div>

            {/* The same days, the same width, directly beneath — which is the
                only arrangement in which two curves can be read against each
                other. */}
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Registrations
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {data.label}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold tabular-nums">
                  {registrations.total}
                </span>
                <span className="text-xs text-muted-foreground">
                  {data.sessions.value > 0
                    ? `${((registrations.total / data.sessions.value) * 100).toFixed(1)}% of sessions`
                    : "No sessions"}
                </span>
              </div>
              <div className="mt-3">
                <SessionsTrend
                  tone="magenta"
                  data={registrations.byDay.map((d) => ({
                    iso: d.iso,
                    label: d.label,
                    sessions: d.count,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* The two long tails, first. These are where the questions the
              marketing team actually brings to this page get answered — which
              activations people are reading about, and which partner sent
              them — so they follow the trend directly instead of sitting under
              a device split. */}
          <Breakdowns
            tabs={[
              {
                key: "pages",
                label: "Pages",
                node: (
                  <RankedList
                    groups={groupPages(data.topPages)}
                    unit="pages"
                    metric="views"
                  />
                ),
              },
              {
                key: "referrers",
                label: "Referrers",
                node: (
                  <RankedList
                    groups={groupSources(data.referrers)}
                    unit="sources"
                    metric="sessions"
                  />
                ),
              },
            ]}
          />
          {/* Composition, not ranking — see `Composition`. Small, fixed sets
              that account for every session between them, so they are always
              on screen rather than behind a tab, and they sit below the two
              long lists because that is the order of how much they are worth:
              devices is three values that have not moved in a month, and it
              was previously stacked above an eighty-seven-row page list. */}
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Composition
              title="Channels"
              caption="How sessions arrived"
              rows={data.channels.map((c) => ({
                label: c.name,
                value: c.sessions,
              }))}
            />
            <Composition
              title="Devices"
              caption="What they were on"
              rows={data.devices.map((d) => ({
                label: d.name,
                value: d.sessions,
              }))}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Setup() {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Connect Google Analytics</p>
      <p className="mt-1 max-w-prose">
        Set <code className="font-mono text-xs">GA4_PROPERTY_ID</code>, grant
        the service account Viewer access to the property, and enable the
        Analytics Data API to see sessions, users, page views, and engagement
        here.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Compositions — few values, summing to a whole                              */
/* -------------------------------------------------------------------------- */

/** Enough colours for eight channels; devices only ever needs three. */
const SLICES = [
  "bg-magenta",
  "bg-space-blue",
  "bg-magenta/60",
  "bg-space-blue/60",
  "bg-magenta/35",
  "bg-space-blue/35",
  "bg-foreground/30",
  "bg-foreground/15",
];

/**
 * A whole, divided — not a ranking.
 *
 * Channels and devices were tabs in the same card as pages and referrers, as
 * if the four were the same kind of answer. They are not. These two have a
 * fixed, small set of values that account for every session between them:
 * eight channels, three devices. The useful fact is each one's share of the
 * whole, which a stacked bar states in one line and a ranked list with its own
 * per-row bars only implies.
 *
 * Being small is also why they are no longer behind a click. Devices is three
 * rows; spending a tab on it meant the answer to "was this a phone audience"
 * was two interactions away, and the card it was hiding in was sized for the
 * eighty-seven-row list next door.
 */
function Composition({
  title,
  caption,
  rows,
}: {
  title: string;
  caption: string;
  rows: { label: string; value: number }[];
}) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </div>

      {total === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No sessions yet.</p>
      ) : (
        <>
          <div className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {rows.map((r, i) => (
              <div
                key={r.label}
                className={cn("h-full", SLICES[i % SLICES.length])}
                style={{ width: `${(r.value / total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {rows.map((r, i) => (
              <li
                key={r.label}
                className="flex items-baseline gap-2 text-sm tabular-nums"
              >
                <span
                  className={cn(
                    "size-2 shrink-0 translate-y-px rounded-full",
                    SLICES[i % SLICES.length],
                  )}
                />
                <span className="min-w-0 flex-1 truncate capitalize">
                  {r.label}
                </span>
                <span className="text-muted-foreground">
                  {Math.round((r.value / total) * 100)}%
                </span>
                <span className="w-12 text-right font-medium">
                  {r.value.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Rankings — long tails, grouped                                             */
/* -------------------------------------------------------------------------- */

interface BreakdownTab {
  key: string;
  label: string;
  node: React.ReactNode;
}

/**
 * The two long lists, one card.
 *
 * Down from four tabs to two, because the other two stopped being lists. What
 * is left is the pair that genuinely share a shape — dozens of rows, ordered,
 * with a tail worth opening — so the tab strip now switches between two things
 * of the same kind rather than shuffling four unrelated answers.
 */
function Breakdowns({ tabs }: { tabs: BreakdownTab[] }) {
  const [active, setActive] = React.useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === active) ?? tabs[0];
  if (!tab) return null;

  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            aria-pressed={t.key === tab.key}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              t.key === tab.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab.node}
    </div>
  );
}

export interface RankGroup {
  key: string;
  label: string;
  value: number;
  /** Rendered in the mono column when the row is a raw path or host. */
  mono?: boolean;
  /** Empty for a leaf row; populated for a section that rolls several up. */
  children: { label: string; value: number }[];
}

/** Slug sections, given the name the team calls them rather than their route. */
const SECTIONS: Record<string, string> = {
  "/schedule": "Sessions",
  "/speakers": "Speakers",
  "/partners": "Partners",
};

/**
 * Group the slug pages, because individually they are invisible and together
 * they are the story.
 *
 * A ranked top six could not show this site. Nine fixed routes compete with 32
 * session pages and 34 speaker pages, and the slug pages lose every time on
 * their own — the best session page draws 76 views against the home page's
 * 1,966, so none of them ever placed. Rolled up, `/schedule/*` is 620 views,
 * more than the `/schedule` index that links to them, and `/speakers/*` is 327
 * against the index's 189. Both facts were absent from the dashboard entirely.
 *
 * Grouping rather than simply lengthening the list, because the flat version is
 * 87 rows of which 33 have fewer than five views: it would technically contain
 * the answer while burying it.
 */
export function groupPages(
  pages: { path: string; views: number }[],
): RankGroup[] {
  const groups = new Map<string, RankGroup>();
  const singles: RankGroup[] = [];

  for (const p of pages) {
    const segments = p.path.split(/[?#]/)[0].split("/").filter(Boolean);
    if (segments.length < 2) {
      singles.push({
        key: p.path,
        label: p.path,
        value: p.views,
        mono: true,
        children: [],
      });
      continue;
    }
    const root = `/${segments[0]}`;
    const group = groups.get(root) ?? {
      key: `${root}/*`,
      label: SECTIONS[root] ?? `${root}/*`,
      value: 0,
      children: [],
    };
    group.value += p.views;
    // The slug alone: the section is the row above, and repeating `/schedule/`
    // on 32 children spends the column on a prefix instead of on which session.
    // A section that collapses to a single row gets its full path back, since
    // there is then no parent row saying which section it belonged to.
    group.children.push({
      label:
        group.children.length === 0 && p.path === group.key.replace("/*", "")
          ? p.path
          : segments.slice(1).join("/"),
      value: p.views,
    });
    groups.set(root, group);
  }

  return finish([...singles, ...groups.values()], true);
}

/**
 * One referrer per row, which the raw dimension does not give you.
 *
 * `sessionSource` reports the host that sent the click, so a single referrer
 * arrives as several: Geekdom sends 347 sessions as `Geekdom` and another 34
 * as `geekdom.com`, and at 381 it is the largest referral source on the site —
 * yet the smaller half never placed in a top six and the two were never added
 * together anywhere. Instagram splits three ways, Facebook two, Luma three.
 *
 * Matching on the registrable-ish name rather than a fixed list of hosts, so
 * `m.facebook.com`, `l.facebook.com` and `facebook.com` land together without
 * anyone maintaining an alias table.
 *
 * Search engines are held apart from their own domains, which is the one case
 * where the name alone is ambiguous: `google` at medium `organic` is somebody
 * searching, while `google.com`, `sites.google.com` and `docs.google.com` at
 * medium `referral` are links in a doc or a site someone built. Same word, two
 * unrelated things, and merging them quietly credited search with traffic it
 * did not earn. The medium is what separates them, so it is asked for rather
 * than guessed from the shape of the name — `yahoo` is a search engine and
 * `mx.search.yahoo.com` is a referral, which no amount of string-matching
 * would tell you.
 *
 * Everything that is not organic still merges by name, so Geekdom's newsletter
 * and links on geekdom.com stay one partner rather than splitting by medium.
 */
export function groupSources(
  sources: { name: string; medium: string; sessions: number }[],
): RankGroup[] {
  const PLACEHOLDERS: Record<string, string> = {
    "(direct)": "Direct",
    "(none)": "Direct",
    "(not set)": "Unknown",
    "(data not available)": "Unknown",
  };
  // Sources that are the same referrer under names GA cannot relate itself.
  const ALIASES: Record<string, string> = { ig: "instagram", "t.co": "x" };
  // Where capitalising the key gets the name wrong.
  const NAMES: Record<string, string> = {
    linkedin: "LinkedIn",
    chatgpt: "ChatGPT",
    duckduckgo: "DuckDuckGo",
    x: "X / Twitter",
    youtube: "YouTube",
    github: "GitHub",
  };

  const groups = new Map<string, RankGroup>();
  for (const s of sources) {
    const raw = s.name.toLowerCase();
    const placeholder = PLACEHOLDERS[raw];
    // Drop a leading subdomain, anything from the first slash, and the public
    // suffix: `l.instagram.com` and `ig` both reduce to `instagram`, and
    // `luma/` stops being a third row alongside `luma` and `luma.com`.
    const host = raw
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .split(".");
    const name =
      placeholder ??
      ALIASES[raw] ??
      (host.length > 1 ? host[host.length - 2] : host[0]);
    const organic = s.medium === "organic";
    const key = organic ? `${name} organic` : name;

    const label =
      placeholder ??
      NAMES[name] ??
      name.charAt(0).toUpperCase() + name.slice(1);
    const group = groups.get(key) ?? {
      key,
      label: organic ? `${label} Search` : label,
      value: 0,
      children: [],
    };
    group.value += s.sessions;
    group.children.push({ label: s.name, value: s.sessions });
    groups.set(key, group);
  }
  return finish([...groups.values()], false);
}

/**
 * Sort, and un-group anything that turned out to be one row.
 *
 * A section of one is just that page: collapsing it behind a disclosure would
 * hide a single row behind a click and claim a grouping that is not there.
 */
function finish(groups: RankGroup[], mono: boolean): RankGroup[] {
  return groups
    .map((g) =>
      g.children.length === 1
        ? {
            ...g,
            // A path takes the leaf's name back, because a collapsed section
            // has no parent row left to say which section it was in and
            // `the-model` alone is not a page. A referrer keeps the group's
            // name: `LinkedIn` is what the team calls it, and reverting to
            // `linkedin.com` because it happened to arrive under one host
            // would be the raw dimension leaking back through.
            label: mono ? g.children[0].label : g.label,
            children: [],
          }
        : g,
    )
    .map((g) => ({
      ...g,
      // Only leaves are set in the mono face, and only where the leaf is a
      // literal path. A section head is a word — "Sessions" — and a referrer
      // is a brand; neither is a string anyone needs to read character by
      // character, which is the only thing mono buys.
      mono: mono && g.children.length === 0,
      children: [...g.children].sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * A ranked list whose sections open, with every row reachable.
 *
 * One line per row, the bar behind the text rather than under it. As two
 * stacked elements each row cost about 42px, so the card showed eight of
 * eighty-seven and the list read as a column of stubs — the home page is three
 * times the next row, which leaves every other bar a nub against a lot of
 * empty track. Behind the text the same proportion is still legible, a row is
 * 28px, and roughly twice as much of the list is on screen at once.
 *
 * Scrolls rather than paginating or capping. The question this answers is
 * "which of these got traffic", and that is a list you scan — a Show more
 * button would just be a click between the team and an answer already in
 * memory.
 */
function RankedList({
  groups,
  unit,
  metric,
}: {
  groups: RankGroup[];
  /** What a leaf row is — "pages", "sources". Named in the footer. */
  unit: string;
  /** What the numbers are — "views", "sessions". */
  metric: string;
}) {
  const [open, setOpen] = React.useState<Set<string>>(new Set());

  if (groups.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Nothing yet.</p>;
  }

  const max = Math.max(1, ...groups.map((g) => g.value));
  const total = groups.reduce((a, g) => a + g.value, 0);
  const leaves = groups.reduce((a, g) => a + Math.max(1, g.children.length), 0);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex max-h-96 flex-col gap-0.5 overflow-y-auto pr-1">
        {groups.map((g) => {
          const isOpen = open.has(g.key);
          const expandable = g.children.length > 0;

          return (
            <li key={g.key}>
              <Row
                label={g.label}
                value={g.value}
                share={g.value / max}
                mono={g.mono}
                count={expandable ? `${g.children.length} ${unit}` : undefined}
                open={isOpen}
                onToggle={
                  expandable
                    ? () =>
                        setOpen((prev) => {
                          const next = new Set(prev);
                          if (!next.delete(g.key)) next.add(g.key);
                          return next;
                        })
                    : undefined
                }
              />
              {isOpen && (
                <ul className="mb-1 ml-5 flex flex-col gap-0.5 border-l border-border pl-2">
                  {g.children.map((c) => (
                    <li
                      key={c.label}
                      className="flex items-baseline justify-between gap-3 py-0.5"
                    >
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {c.label}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {c.value.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {/* Both counts, so it is clear the grouping is not hiding anything: the
          rows on screen, and the pages or sources they account for. */}
      <p className="text-xs text-muted-foreground">
        {groups.length.toLocaleString()} rows · {leaves.toLocaleString()} {unit}{" "}
        · {total.toLocaleString()} {metric}
      </p>
    </div>
  );
}

/** One line: a tinted track behind the label, the number right-aligned. */
function Row({
  label,
  value,
  share,
  mono,
  count,
  open,
  onToggle,
}: {
  label: string;
  value: number;
  share: number;
  mono?: boolean;
  count?: string;
  open?: boolean;
  onToggle?: () => void;
}) {
  const body = (
    <>
      <div
        className="absolute inset-y-0 left-0 rounded-sm bg-magenta/10"
        style={{ width: `${Math.max(share * 100, 0.5)}%` }}
      />
      <span className="relative flex min-w-0 flex-1 items-center gap-1.5">
        {onToggle && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
            strokeWidth={2}
          />
        )}
        <span
          className={cn(
            "truncate",
            mono ? "font-mono text-xs" : "text-sm",
            onToggle && "font-medium",
          )}
        >
          {label}
        </span>
        {count !== undefined && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </span>
      <span className="relative shrink-0 text-sm font-medium tabular-nums">
        {value.toLocaleString()}
      </span>
    </>
  );

  const shell =
    "relative flex w-full items-center gap-3 overflow-hidden rounded-sm px-2 py-1.5 text-left";

  if (!onToggle) return <div className={shell}>{body}</div>;
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={cn(shell, "hover:bg-muted/60")}
    >
      {body}
    </button>
  );
}
