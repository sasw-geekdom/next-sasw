import { requireAdmin } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-heading font-bold">
          Welcome, {user.name ?? user.email.split("@")[0]}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re signed in as {user.role}. The current&apos;s live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Speakers</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Call for speakers — coming in Phase 2/3.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registrations</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Attendee list — coming in Phase 2/3.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Check-in</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Door check-in — coming in Phase 4.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sponsors, partners, sessions — coming in Phase 5.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
