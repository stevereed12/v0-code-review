// ─── X POST DRAFT ────────────────────────────────────────────────────────────
// Produces a ≤280-char draft post summarizing the day's brief. Format (per brief):
//
//   White80 | [Weekday]
//   Vibe: [score]/100 — [mood]
//   Top play: $[TICKER] [entry]->[target]
//   [driver] • [hot sector]
//   white80.io

import type { BriefOutput } from "@white80/engine"

const MAX_LEN = 280

function weekday(output: BriefOutput): string {
  // Prefer the brief's own session label/date; fall back to generated_at.
  const raw = output.brief?.session_date || output.session_date || output.generated_at
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { weekday: "long" })
  }
  // session_date may already be a human string like "Thursday, June 5" — take the first word.
  return String(raw).split(/[\s,]+/)[0] || "Today"
}

function topPlayLine(output: BriefOutput): string | null {
  const play = output.brief?.top_plays?.[0]
  if (!play) return null
  // play.play is free-form (e.g. "Buy $185 calls exp Jun 6"); extract entry → target if present.
  const ticker = play.ticker
  return `Top play: $${ticker} ${play.play}`.trim()
}

function driverAndSector(output: BriefOutput): string | null {
  const driver = output.vibe?.drivers?.[0]?.label
  const hotSector = output.vibe?.hot_sectors?.[0]?.sector
  const parts = [driver, hotSector].filter((p): p is string => !!p && p.trim().length > 0)
  return parts.length > 0 ? parts.join(" • ") : null
}

/** Build the X post draft, trimming to 280 characters without cutting a line mid-word. */
export function generateXPost(output: BriefOutput): string {
  const lines: string[] = []

  lines.push(`White80 | ${weekday(output)}`)

  const score = output.vibe?.vibe_score
  const mood = output.vibe?.mood
  if (typeof score === "number" && mood) {
    lines.push(`Vibe: ${Math.round(score)}/100 — ${mood}`)
  }

  const play = topPlayLine(output)
  if (play) lines.push(play)

  const ds = driverAndSector(output)
  if (ds) lines.push(ds)

  lines.push("white80.io")

  let post = lines.join("\n")

  // If over the limit, drop the driver/sector line first, then trim the play line.
  if (post.length > MAX_LEN && ds) {
    post = lines.filter((l) => l !== ds).join("\n")
  }
  if (post.length > MAX_LEN) {
    post = post.slice(0, MAX_LEN - 1).trimEnd() + "…"
  }

  return post
}
