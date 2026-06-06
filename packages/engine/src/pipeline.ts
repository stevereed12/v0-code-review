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

import { writeFileSync, readFileSync, existsSync } from "node:fs"
import type { BriefOutput, PipelineOptions } from "./types"
import { resolvePolygonKey } from "./model"
import { fetchMacroPulse } from "./macro"
import { MAG_7 } from "./models"
import { runCurator } from "./agents/curator"
import { runTier1Scan } from "./agents/tier1-scanner"
import { runWatchlist } from "./agents/watchlist"
import { runSignals } from "./agents/signals-engine"
import { runScout } from "./agents/scout"
import { runDailyBrief } from "./agents/daily-brief"
import { runVibe } from "./agents/vibe-engine"
import { fetchOptionsContext } from "./agents/options-context"

const PREMARKET_SNAPSHOT_PATH = "/tmp/white80-premarket-snapshot.json"

/** Read the 8:00 AM pre-market snapshot (if present) into a compact context string. */
function loadPremarketContext(): string {
  if (!existsSync(PREMARKET_SNAPSHOT_PATH)) return ""
  try {
    const snapshot = JSON.parse(readFileSync(PREMARKET_SNAPSHOT_PATH, "utf8"))
    return `
PRE-MARKET CONTEXT (as of 8:00 AM ET):
SPY: ${snapshot.spyPremarket.changePct > 0 ? "+" : ""}${snapshot.spyPremarket.changePct.toFixed(2)}%
QQQ: ${snapshot.qqqPremarket.changePct > 0 ? "+" : ""}${snapshot.qqqPremarket.changePct.toFixed(2)}%
VIX proxy: ${snapshot.vixLevel.toFixed(2)}
Overnight gappers (>1.5%): ${snapshot.overnightGappers
      .map((g: { ticker: string; direction: string; gapPct: number }) => `${g.ticker} ${g.direction === "up" ? "+" : ""}${g.gapPct.toFixed(1)}%`)
      .join(", ")}
${snapshot.earningsReactions.length > 0
        ? "Earnings reactions: " +
          snapshot.earningsReactions
            .map((e: { ticker: string; gapPct: number; note: string }) => `${e.ticker} ${e.gapPct > 0 ? "+" : ""}${e.gapPct.toFixed(1)}% — ${e.note}`)
            .join("; ")
        : ""}
`.trim()
  } catch {
    return ""
  }
}

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

  // ── Pre-market context: read the 8:00 AM snapshot (if the pre-market scan ran) ──
  // Injected into the Signals Engine and Daily Brief so both already account for
  // overnight gaps, futures-implied index moves, and earnings reactions.
  const premarketContext = loadPremarketContext()

  // ── 0. Macro pulse: fetch live prices from Polygon first ──
  // These are ground-truth prices for the ticker strip — no LLM guesses at them.
  const macroPulse = polygonKey ? await fetchMacroPulse(polygonKey) : undefined

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

  // ── 5b. Fetch live prices for every signal ticker from Polygon ──
  // These are passed as hard ground-truth to the Signals Engine so it cannot
  // hallucinate entry/target/stop prices from training data.
  let livePrices: Record<string, import("./types").LivePrice> | null = null
  if (polygonKey) {
    try {
      const tickerList = signalTickers.join(",")
      const snapRes = await fetch(
        `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerList}&apiKey=${polygonKey}`
      )
      if (snapRes.ok) {
        const snapData = await snapRes.json() as {
          tickers?: Array<{
            ticker: string
            lastTrade?: { p: number; t: number }
            lastQuote?: { P: number; p: number }
            min?: { c: number }
            day?: { c: number; o: number; h: number; l: number; v: number }
            prevDay?: { c: number }
            todaysChange?: number
            todaysChangePerc?: number
            marketStatus?: string
          }>
        }
        livePrices = {}
        const now = Date.now()
        for (const t of snapData.tickers ?? []) {
          const price = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
          const prevClose = t.prevDay?.c || 0
          const change = price - prevClose
          const changePct = prevClose > 0 ? (change / prevClose) * 100 : t.todaysChangePerc || 0
          const tradeTime = t.lastTrade?.t ? t.lastTrade.t / 1_000_000 : now  // nanoseconds -> ms
          livePrices[t.ticker] = {
            price,
            prev_close: prevClose,
            change,
            change_pct: changePct,
            day_high: t.day?.h || 0,
            day_low: t.day?.l || 0,
            volume: t.day?.v || 0,
            session: t.marketStatus || "UNKNOWN",
            market_state: t.marketStatus || "UNKNOWN",
            ts: tradeTime,
            age_seconds: Math.floor((now - tradeTime) / 1000),
            name: t.ticker,
          }
        }
        console.log(`[pipeline] Fetched live prices for ${Object.keys(livePrices).length}/${signalTickers.length} signal tickers`)
      }
    } catch (e) {
      console.warn("[pipeline] Live price fetch failed, Signals Engine will use web search:", e)
    }
  }

  // ── 5c. Options flow context for every signal ticker (hard constraints) ──
  // Bullish flow → tighter stop / higher target; bearish flow → flag the position.
  let optionsContextStr = ""
  if (polygonKey) {
    try {
      const optionsContext = await fetchOptionsContext(signalTickers)
      optionsContextStr = optionsContext
        .map(
          (o) =>
            `${o.ticker}: C/P ${o.callPutRatio.toFixed(2)}, bias ${o.bias}${o.unusualActivity ? " ⚡unusual" : ""}, dominant ${o.dominantStrike} exp ${o.dominantExpiry}, IVR ${o.ivRank}`
        )
        .join("\n")
      console.log(`[pipeline] Fetched options context for ${optionsContext.length}/${signalTickers.length} signal tickers`)
    } catch (e) {
      console.warn("[pipeline] Options context fetch failed, Signals Engine will run without it:", e)
    }
  }

  const signalsContextParts: string[] = []
  if (premarketContext) signalsContextParts.push(premarketContext)
  if (optionsContextStr) {
    signalsContextParts.push(
      `OPTIONS FLOW CONTEXT (hard constraints — bullish flow = tighter stop + higher target; bearish flow = flag the position):\n${optionsContextStr}`
    )
  }
  const signalsContextPrefix = signalsContextParts.join("\n\n") || null

  const signals = await runSignals({
    tickers: signalTickers,
    newsContext,
    livePrices,
    contextPrefix: signalsContextPrefix,
  })

  // Hand today's signal tickers to the intraday alert scanner (best-effort).
  // The alert scanner reads this file to raise the bar on names already in the brief.
  try {
    const briefTickersList = signals.map((s) => s.ticker)
    writeFileSync("/tmp/white80-brief-tickers.json", JSON.stringify(briefTickersList))
  } catch {
    /* non-fatal — alert scanner falls back to an empty brief-ticker set */
  }

  // ── 6. Daily Brief: macro / catalysts / top plays ──
  const brief = await runDailyBrief({ polygonKey, tickers: watchlist, premarketContext: premarketContext || null })

  // ── 7. Vibe: market mood read ──
  const vibe = await runVibe({ polygonKey, tickers: watchlist })

  return {
    generated_at: new Date().toISOString(),
    macro_pulse: macroPulse,
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
