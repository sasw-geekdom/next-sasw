"use client";

import * as React from "react";
import { slugify } from "@/lib/slug";

/**
 * Personalizes the sponsor report for a tagged link, /sponsor-report?for=
 * <sponsor> — the same tag the reading analytics use (see ReportRail).
 *
 * It changes no words and moves nothing. Every place the report credits an
 * organization carries `data-org` (its name, slugified: "nopalera",
 * "80-20-foundation"); this lights the ones for the tagged sponsor — their
 * roster mark in magenta, their circuit spotlight framed, the "Powering"
 * band they sit in outlined. The reader still opens on the cover and reads
 * the whole report; their own credits are simply the ones that are lit.
 *
 * Client-side, because the page is static: reading the query on the server
 * would make every request render.
 */
export function ReportFor() {
  React.useEffect(() => {
    const tag = new URLSearchParams(window.location.search).get("for");
    if (!tag) return;
    const slug = slugify(tag, "");
    if (!slug) return;
    for (const el of document.querySelectorAll(`[data-org="${CSS.escape(slug)}"]`)) {
      el.setAttribute("data-lit", "");
      el.closest("[data-band]")?.setAttribute("data-lit", "");
    }
  }, []);
  return null;
}
