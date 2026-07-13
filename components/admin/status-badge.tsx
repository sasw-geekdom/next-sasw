import { Badge } from "@/components/ui/badge";
import type { SubmissionStatus } from "@/lib/admin/types";

const TONE: Record<
  SubmissionStatus,
  React.ComponentProps<typeof Badge>["tone"]
> = {
  new: "magenta",
  reviewing: "blue",
  accepted: "success",
  declined: "danger",
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge tone={TONE[status]}>{status}</Badge>;
}
