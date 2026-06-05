// ─── FULL PIPELINE ORCHESTRATION ─────────────────────────────────────────────
// Runs all seven agents in sequence and assembles the single BriefOutput object
// the routine consumes. Each agent's logic is preserved verbatim in its own module;
// this file only sequences the calls and threads keys/watchlist between them.
//
// Signal ticker scope (as of v2):
//   • Tier 1 matches (technical scan)
//   • Curator active_watchlist callouts (promote list — catalyst/earnings flagged)
//   • Mag 7 — always present every day
//   • Scout tickers — anything Scout surfaces
//   All deduplicated before passing to Signals Engine.

import type { BriefOutput, PipelineOptions } from "./types"
import { resolvePolygonKey } from "./model"
import { MAG_7 } from "./models"
import { runCurator } from "./agents/curator"
import { runTier1Scan } from "./agents/tier1-scanner"
import { runWatchlist } from "./agents/watchlist"
import { runSignals } from "./agents/signals-engine"
import { runScout } from "./agents/scout"
import { runDailyBrief } from "./agents/daily-brief"
import { runVibe } from "./agents/vibe-engine"

const DEFAULT_SCOUT_THEMES = ["ai_infra", "semis", "ai_apps"]

/** Deduplicate a list of tickers, uppercasing all entries. */
function dedupe(tickers: string[]): string[] {
  return [...new Set(tickers.map((t) => t.toUpperCase()))]
}

/**
 * Run the full White80 morning pipeline end-to-end.
 *
 * Resolves keys once (explicit option → env var) and threads them through every
 * agent. Returns the aggregate BriefOutput. Throws if a required key is missing
 * or any agent throws — the routine's completeness check then has the final say
 * on whether the assembled output is publishable.
 */
export async function runPipeline(options: PipelineOptions = {}): Promise<BriefOutput> {
  const polygonKey = resolvePolygonKey(options.polygonKey)

  // ── 1. Curator: resolve the active watchlist ──
  const curator = await runCurator({
    watchlist: options.watchlist ?? [],
  })
  const watchlist = curator.active_watchlist

  // ── 2. Tier 1 Scanner: technical scan (pure Polygon, no LLM) ──
  const scan = await runTier1Scan({
    polygonKey,
    tickers: options.tier1Tickers,
  })
  const tier1 = scan.matches

  // ── 3. Watchlist (news monitor) over the active watchlist ──
  const news = await runWatchlist({ tickers: watchlist })

  // ── 4. Scout: discovery candidates (may be empty) — run before Signals
  //        so Scout tickers can be included in the signal universe ──
  const scout = await runScout({
    themes: options.scoutThemes ?? DEFAULT_SCOUT_THEMES,
    capTier: options.scoutCapTier ?? "mixed",
    horizon: options.scoutHorizon ?? "1-3mo",
    excludeTickers: watchlist,
  })

  // ── 5. Signals: expanded ticker scope ──
  //   • Tier 1 matches
  //   • Curator promotions (catalyst / earnings callouts)
  //   • Mag 7 — always
  //   • Scout tickers
  const tier1Tickers    = tier1.map((t) => t.ticker)
  const curatorTickers  = curator.promote.map((p) => p.ticker)
  const scoutTickers    = scout.map((s) => s.ticker)
  const signalTickers   = dedupe([
    ...tier1Tickers,
    ...curatorTickers,
    ...MAG_7,
    ...scoutTickers,
  ])
  const newsContext = news.length > 0 ? JSON.stringify(news) : null
  const signals = await runSignals({
    tickers: signalTickers,
    newsContext,
  })

  // ── 6. Daily Brief: macro / catalysts / top plays ──
  const brief = await runDailyBrief({ polygonKey, tickers: watchlist })

  // ── 7. Vibe: market mood read ──
  const vibe = await runVibe({ polygonKey, tickers: watchlist })

  return {
    generated_at: new Date().toISOString(),
    session_date: brief.session_date,
    curator,
    watchlist,
    tier1,
    news,
    signals,
    scout,
    brief,
    vibe,
  }
}
