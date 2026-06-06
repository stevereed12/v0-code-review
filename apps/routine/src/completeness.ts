// ─── COMPLETENESS CHECK ──────────────────────────────────────────────────────
// Gate that decides whether an assembled BriefOutput is publishable. Throws on the
// first failure with a precise message so the routine aborts before rendering /
// emailing a half-empty brief.
//
// Field names follow the REAL validated schema (see white80-architecture.md):
// the build brief's shorthand (vibe.score, hotSectors, narrative, …) maps to
// vibe.vibe_score, vibe.hot_sectors, brief.verdict.summary, etc.

import type { BriefOutput } from "@white80/engine"

export class CompletenessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CompletenessError"
  }
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0
}

/**
 * Validate that every section the brief depends on is present and non-trivial.
 * Throws CompletenessError on the first problem. Returns the output unchanged on success.
 */
export function completenessCheck(output: BriefOutput): BriefOutput {
  const fail = (msg: string): never => {
    throw new CompletenessError(msg)
  }

  // ── Tier 1 ──
  if (!Array.isArray(output.tier1) || output.tier1.length < 1) {
    fail("Tier 1 scan returned no matches (need at least 1).")
  }

  // ── Signals: must cover at least all Tier 1 tickers ──
  // Signals scope is expanded beyond Tier 1 (includes Mag 7, Scout, Curator callouts)
  // so signals.length >= tier1.length is the correct check.
  if (!Array.isArray(output.signals)) {
    fail("Signals output is missing or not an array.")
  }
  if (output.signals.length < output.tier1.length) {
    fail(
      `Signals count (${output.signals.length}) is less than Tier 1 count (${output.tier1.length}). Every Tier 1 play must have positioning.`
    )
  }

  // ── Vibe: every field the template renders ──
  const vibe = output.vibe
  if (!vibe) fail("Vibe output is missing.")
  if (typeof vibe.vibe_score !== "number") fail("Vibe is missing a numeric vibe_score.")
  if (!nonEmptyString(vibe.mood)) fail("Vibe is missing mood.")
  if (!Array.isArray(vibe.drivers) || vibe.drivers.length === 0) fail("Vibe is missing drivers.")
  if (!Array.isArray(vibe.hot_sectors)) fail("Vibe is missing hot_sectors.")
  if (!Array.isArray(vibe.cold_sectors)) fail("Vibe is missing cold_sectors.")
  if (!Array.isArray(vibe.buzzing_tickers)) fail("Vibe is missing buzzing_tickers.")
  if (!nonEmptyString(vibe.social_pulse)) fail("Vibe is missing social_pulse.")
  if (!nonEmptyString(vibe.contrarian_note)) fail("Vibe is missing contrarian_note.")
  if (!nonEmptyString(vibe.play_it)) fail("Vibe is missing play_it (how to play).")

  // ── Brief: top plays, catalysts, narrative ──
  const brief = output.brief
  if (!brief) fail("Daily brief is missing.")
  if (!Array.isArray(brief.top_plays) || brief.top_plays.length === 0) {
    fail("Daily brief has no top_plays.")
  }
  if (!Array.isArray(brief.catalysts) || brief.catalysts.length < 1) {
    fail("Daily brief has no catalysts.")
  }
  // No `narrative` field exists in the validated schema — verdict.summary is the prose.
  if (!nonEmptyString(brief.verdict?.summary)) {
    fail("Daily brief verdict.summary (narrative) is empty.")
  }

  // ── Scout: non-empty OR explicitly empty (allowed, just logged) ──
  if (!Array.isArray(output.scout)) {
    fail("Scout output is missing or not an array.")
  }
  if (output.scout.length === 0) {
    console.warn("Scout returned no candidates today — allowed, continuing.")
  }

  return output
}
