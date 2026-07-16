// Option lists for the Get Involved form ("Form 2" in the SASTW 2026 form
// requirements): sponsor inquiries, event hosting proposals, and general
// questions — one form, three routed paths.

export const GET_INVOLVED_PATHS = ["sponsor", "host", "general"] as const;
export type GetInvolvedPath = (typeof GET_INVOLVED_PATHS)[number];

export const PATH_LABELS: Record<GetInvolvedPath, string> = {
  sponsor: "Sponsor",
  host: "Host an event",
  general: "General",
};

export const BUDGET_RANGES = [
  "Under $5K",
  "$5–10K",
  "$10–25K",
  "$25K+",
  "Not sure yet",
] as const;

export const VENUE_STATUS = [
  "Need a venue",
  "Have a venue",
  "Open to either",
] as const;

export const HEARD_ABOUT = [
  "Word of mouth",
  "Email",
  "LinkedIn",
  "Instagram",
  "Geekdom",
  "LaunchSA",
  "Other partner",
  "Press",
  "Other",
] as const;

// Shown under the preferred-day-and-time field, per the requirements doc.
export const SCHEDULE_CAVEAT =
  "We try to avoid schedule conflicts as much as possible and may come back with suggestions on a better fit for the schedule.";
