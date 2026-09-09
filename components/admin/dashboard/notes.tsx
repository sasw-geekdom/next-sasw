import Link from "next/link";
import { ArrowUpRight, Inbox, Plane, UserCheck, Users } from "lucide-react";
import type { GetInvolvedRow, RegistrationRow } from "@/lib/admin/types";
import { OPEN_STATUSES } from "@/lib/admin/get-involved-filters";

const PATHS = [
  { key: "sponsor", label: "Sponsor" },
  { key: "host", label: "Host / venue" },
  { key: "general", label: "General" },
] as const;

/**
 * The three facts that are sentences rather than numbers.
 *
 * Attendance and travel, who is coming, and who has written in. They were
 * three loose lines of small grey text under a row of cards — accurate, and
 * unreadable at a glance, because nothing said which line was about what. An
 * icon and a label do that in the width of a character, which is the right
 * amount to spend on annotation.
 *
 * Grouped on one soft ground rather than in bordered cards. The row above is
 * white cards on the page's ground; making this a fourth bordered thing would
 * have said these are metrics of the same kind, and they are not — they are
 * the notes under the metrics.
 */
export function DashboardNotes({
  rows,
  registrations,
  attendance,
  visiting,
}: {
  rows: GetInvolvedRow[];
  registrations: RegistrationRow[];
  /** Percent of registrations checked in, or null before check-in starts. */
  attendance: number | null;
  visiting: number;
}) {
  const total = registrations.length;
  const share = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const count = (test: (r: RegistrationRow) => boolean) =>
    registrations.filter(test).length;

  // Grouped by what a sponsor conversation is about, not by the fifteen values
  // the form collects. "Founder" spans three stages and reads as 12% if only
  // the first is counted; together they are a fifth of the room.
  const mix = [
    {
      label: "Small business",
      n: count((r) => r.describesYou === "Small business owner or solopreneur"),
    },
    {
      label: "Founders",
      n: count((r) => !!r.describesYou?.startsWith("Founder")),
    },
    {
      label: "Technical",
      n: count(
        (r) => r.describesYou === "Engineer, developer, or technical builder",
      ),
    },
    { label: "Students", n: count((r) => r.describesYou === "Student") },
    {
      label: "Investors",
      n: count((r) => !!r.describesYou?.startsWith("Investor")),
    },
  ].sort((a, b) => b.n - a.n);

  const open = rows.filter((r) => OPEN_STATUSES.has(r.status)).length;

  return (
    <div className="flex flex-col gap-2.5 rounded-lg bg-muted/50 px-4 py-3.5 text-xs text-muted-foreground">
      {attendance !== null && (
        <Note icon={UserCheck} label="On the day">
          <Value label="Attended" value={`${attendance}%`} />
        </Note>
      )}

      <Note icon={Plane} label="Where from">
        <Value label="Out of town" value={visiting} />
      </Note>

      <Note icon={Users} label="Audience">
        {mix.map((m, i) => (
          <span key={m.label}>
            {i > 0 && " · "}
            <Value label={m.label} value={`${m.n} (${share(m.n)}%)`} />
          </span>
        ))}
      </Note>

      {/* Each path links to its own rows now that Get Involved reads its
          filter off the URL — the dashboard says "Sponsor 3" and pressing it
          lands on those three, rather than on all nineteen submissions. */}
      <Note icon={Inbox} label="Inbound">
        {PATHS.map((p, i) => (
          <span key={p.key}>
            {i > 0 && " · "}
            <Link
              href={`/admin/get-involved?path=${p.key}`}
              className="hover:underline hover:underline-offset-4"
            >
              <Value
                label={p.label}
                value={rows.filter((r) => r.path === p.key).length}
              />
            </Link>
          </span>
        ))}
        {/* Only once some have been worked — while every submission is still
            `new`, "19 open" just repeats the three counts before it. */}
        {open < rows.length && (
          <>
            {" · "}
            <Link
              href="/admin/get-involved?open=yes"
              className="hover:underline hover:underline-offset-4"
            >
              <Value label="Open" value={open} />
            </Link>
          </>
        )}
        <Link
          href="/admin/get-involved"
          className="ml-2 whitespace-nowrap underline underline-offset-4 hover:text-foreground"
        >
          Get Involved
          <ArrowUpRight
            className="ml-0.5 inline h-3 w-3 align-[-1px]"
            strokeWidth={2}
          />
        </Link>
      </Note>
    </div>
  );
}

/**
 * A line. The icon column is fixed so the three lines align down their left
 * edge whatever their labels are, and the text is a paragraph rather than a
 * flex row — as flex, each value became its own flex item and the line broke
 * one entry per row instead of wrapping as a sentence.
 */
function Note({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon
        className="mt-[3px] h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
        strokeWidth={1.8}
      />
      <p className="min-w-0">
        <span className="uppercase tracking-wide text-muted-foreground/80">
          {label}
        </span>{" "}
        {children}
      </p>
    </div>
  );
}

/** Name in the body colour, number in tabular figures. */
function Value({ label, value }: { label: string; value: string | number }) {
  return (
    <>
      <span className="text-foreground">{label}</span>{" "}
      <span className="tabular-nums">{value}</span>
    </>
  );
}
