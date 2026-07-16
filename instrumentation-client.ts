import { initBotId } from "botid/client/core";

// Invisible CAPTCHA on the public write endpoints. Server routes call
// checkBotId() before any Firestore write or Resend send (Phase 2).
// Basic level — no visible challenge, no user friction.
initBotId({
  protect: [
    { path: "/api/speakers", method: "POST" },
    { path: "/api/register", method: "POST" },
    { path: "/api/get-involved", method: "POST" },
  ],
});
