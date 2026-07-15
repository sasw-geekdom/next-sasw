// Options for the two new Plug In paths (volunteer + sponsor). Shared by the
// forms and their validation so the choices stay in sync.

export const VOLUNTEER_INTERESTS = [
  "Registration & check-in",
  "AV & tech",
  "Hospitality",
  "Setup & teardown",
  "Wayfinding",
  "Wherever needed",
] as const;

export const SPONSOR_LEVELS = [
  "Presenting",
  "Circuit",
  "Community",
  "In-kind",
  "Not sure yet",
] as const;
