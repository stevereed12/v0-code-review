// ─── FULL PIPELINE ORCHESTRATION ─────────────────────────────────────────────
// Runs all seven agents in sequence and assembles the single BriefOutput object
// the routine consumes. Each agent's logic is preserved verbatim in its own module;
// this file only sequences the calls and threads keys/watchlist between them.
//
// Ordering rationale (and how it satisfies the completeness invariants):
//   1. Curator     → resolves the active watchlist (builds from scratch if none given)
//   2. Tier 1 Scan → technical scan over the universe (no LLM); produces tier1 matches
//   3. Watchlist   → material news for the active watchlist tickers
//   4. Signals     → one Signal per Tier-1 match  ⇒  signals.length === tier1.length
//   5. Scout       → discovery candidates (may be empty)
//   6. Daily Brief → macro/catalysts/top_plays (Polygon + Claude)
//   7. Vibe        → market mood read (Polygon + Claude)

import type { BriefOutput, PipelineOptions } from "./types"
import { resolveAnthropicKey, resolvePolygonKey } from "./claude"
import { runCurator } from "./agents/curator"
import { runTier1Scan } from "./agents/tier1-scanner"
import { runWatchlist } from "./agents/watchlist"
import { runSignals } from "./agents/signals-engine"
import { runScout } from "./agents/scout"
import { runDailyBrief } from "./agents/daily-brief"
import { runVibe } from "./agents/vibe-engine"

const DEFAULT_SCOUT_THEMES = ["ai_infra", "semis", "ai_apps"]

/**
 * Run the full White80 morning pipeline end-to-end.
 *
 * Resolves keys once (explicit option → env var) and threads them through every
 * agent. Returns the aggregate BriefOutput. Throws if a required key is missing
 * or any agent throws — the routine's completeness check then has the final say
 * on whether the assembled output is publishable.
 */
export async function runPipeline(options: PipelineOptions = {}): Promise<BriefOutput> {
  const anthropicKey = resolveAnthropicKey(options.anthropicKey)
  const polygonKey = resolvePolygonKey(options.polygonKey)

  // ── 1. Curator: resolve the active watchlist ──
  const curator = await runCurator({
    anthropicKey,
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
  const news = await runWatchlist({ anthropicKey, tickers: watchlist })

  // ── 4. Signals: one Signal per Tier-1 match (keeps signals.length === tier1.length) ──
  const tier1Tickers = tier1.map((t) => t.ticker)
  const newsContext = news.length > 0 ? JSON.stringify(news) : null
  const signals = await runSignals({
    anthropicKey,
    tickers: tier1Tickers,
    newsContext,
  })

  // ── 5. Scout: discovery candidates (may be empty) ──
  const scout = await runScout({
    anthropicKey,
    themes: options.scoutThemes ?? DEFAULT_SCOUT_THEMES,
    capTier: options.scoutCapTier ?? "mixed",
    horizon: options.scoutHorizon ?? "1-3mo",
    excludeTickers: watchlist,
  })

  // ── 6. Daily Brief: macro / catalysts / top plays ──
  const brief = await runDailyBrief({ anthropicKey, polygonKey, tickers: watchlist })

  // ── 7. Vibe: market mood read ──
  const vibe = await runVibe({ anthropicKey, polygonKey, tickers: watchlist })

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
