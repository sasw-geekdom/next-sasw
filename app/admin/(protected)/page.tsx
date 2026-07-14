import { requireAdmin } from "@/lib/auth/session";
import { listRegistrations, listSpeakerSubmissions } from "@/lib/admin/queries";
import { listSessions, listSpeakers } from "@/lib/admin/cms-queries";
import { getTopPages } from "@/lib/analytics/ga4";
import { registrationsByDay } from "@/lib/admin/metrics";
import { PageHeader } from "@/components/admin/page-header";
import { StatTile } from "@/components/admin/dashboard/stat-tile";
import { RegistrationsChart } from "@/components/admin/dashboard/registrations-chart";
import { Ga4TopPages } from "@/components/admin/dashboard/ga4-top-pages";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  const [registrations, submissions, sessions, speakers, topPages] =
    await Promise.all([
      listRegistrations(),
      listSpeakerSubmissions(),
      listSessions(),
      listSpeakers(),
      getTopPages(4),
    ]);

  const checkedIn = registrations.filter((r) => r.checkedIn).length;
  const newSubs = submissions.filter((s) => s.status === "new").length;
  const pct = registrations.length
    ? Math.round((checkedIn / registrations.length) * 100)
    : 0;
  const byDay = registrationsByDay(
    registrations.map((r) => r.createdAt),
    14,
  );

  const firstName = (user.name ?? user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Sept 28 – Oct 2 · Year 11. The current's live."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Registered"
          value={registrations.length}
          footnote={`${checkedIn} checked in`}
        />
        <StatTile
          label="Checked in"
          value={checkedIn}
          footnote={`${pct}% of registered`}
        />
        <StatTile
          label="Speaker submissions"
          value={submissions.length}
          footnote={`${newSubs} new`}
        />
        <StatTile
          label="Sessions"
          value={sessions.length}
          footnote={`${speakers.length} speakers`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RegistrationsChart data={byDay} />
        </div>
        <Ga4TopPages pages={topPages} />
      </div>
    </div>
  );
}
