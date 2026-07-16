// Option lists for the registration form ("Form 1" in the SASTW 2026 form
// requirements). Shared by the form UI and its validation so the choices stay
// in sync. Circuit options come from lib/tracks (TRACK_NAMES).

export const DESCRIBES_YOU = [
  "Founder (pre-seed / idea stage)",
  "Founder (seed / raising)",
  "Founder (Series A+ / scaling)",
  "Small business owner or solopreneur",
  "Engineer, developer, or technical builder",
  "Designer or creative",
  "Student",
  "Investor (angel, VC, family office)",
  "Ecosystem builder or nonprofit",
  "Corporate innovation or partnerships",
  "Government or civic",
  "Media or press",
  "Curious about startups / exploring",
  "Other",
] as const;

export const INDUSTRIES = [
  "AI / applied AI",
  "Software / SaaS",
  "Cybersecurity",
  "Defense / dual-use",
  "Healthcare / biotech",
  "Consumer goods / CPG / food",
  "Manufacturing / advanced mfg",
  "Fintech",
  "Real estate / proptech",
  "Energy / climate",
  "Education",
  "Media / creative",
  "Services / consulting",
  "Nonprofit",
  "Not applicable",
  "Other",
] as const;

export const SA_TENURE = [
  "New to SA (< 1 year)",
  "1–5 years",
  "5–10 years",
  "10+ years",
  "Born and raised",
  "Just visiting",
] as const;

export const VOLUNTEER_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export const SPONSOR_CONSENT_LABEL =
  "I'm okay with sponsors of events I attend contacting me. My info stays with SASTW otherwise.";
