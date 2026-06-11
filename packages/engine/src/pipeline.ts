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

const MIN_DTE = 14

const MONTH_ABBREVS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
]

/**
 * Parse an expiry token of the form "Jun 25" (short month + day, no year) into a
 * Date. The year is inferred relative to `from`: if the resulting date would be in
 * the past, it rolls forward to next year. Returns null if the token is unparseable.
 */
function parseExpiryToken(month: string, day: string, from: Date): Date | null {
  const monthIdx = MONTH_ABBREVS.indexOf(month.slice(0, 3).toLowerCase())
  const dayNum = parseInt(day, 10)
  if (monthIdx === -1 || isNaN(dayNum)) return null
  let year = from.getFullYear()
  let candidate = new Date(year, monthIdx, dayNum)
  // Roll into next year if the month/day already passed (e.g. "Jan 16" seen in December).
  if (candidate.getTime() < from.getTime() - 24 * 60 * 60 * 1000) {
    year += 1
    candidate = new Date(year, monthIdx, dayNum)
  }
  return candidate
}

/** Calculate the next standard monthly expiry (3rd Friday) at least `minDays` out. */
function getNextMonthlyExpiry(from: Date, minDays: number): Date {
  const minDate = new Date(from.getTime() + minDays * 24 * 60 * 60 * 1000)
  for (let monthOffset = 0; monthOffset <= 2; monthOffset++) {
    const year = minDate.getFullYear()
    const month = minDate.getMonth() + monthOffset
    let fridayCount = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day)
      if (d.getDay() === 5) {
        fridayCount++
        if (fridayCount === 3) {
          if (d >= minDate) return d
          break
        }
      }
    }
  }
  return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000)
}

/** Format a Date as "Mon D" (e.g. "Jul 18") to match the play-string expiry style. */
function formatPlayExpiry(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Enforce the minimum-DTE floor on a signal's play string. The expiry lives inside
 * the freeform `play` text (e.g. "Buy $130 calls exp Jun 25") — there is no separate
 * expiry field on Signal. If the play references an expiry under MIN_DTE days out,
 * rewrite that token to the next monthly expiry at least MIN_DTE days out.
 */
function enforceMinDte(play: string, ticker: string, from: Date): string {
  const match = play.match(/\bexp\s+([A-Za-z]{3,})\s+(\d{1,2})\b/)
  if (!match) return play
  const expiry = parseExpiryToken(match[1], match[2], from)
  if (!expiry) return play
  const dte = Math.round((expiry.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  if (dte >= MIN_DTE) return play
  const corrected = getNextMonthlyExpiry(from, MIN_DTE)
  const correctedStr = formatPlayExpiry(corrected)
  console.warn(`[expiry-gate] ${ticker} had ${dte} DTE — corrected to ${correctedStr}`)
  return play.replace(match[0], `exp ${correctedStr}`)
}

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

  // Tier 1 conviction context: every Tier 1 match is a highest-conviction bullish
  // play. Inject it into the Signals Engine prompt so it never returns a put/fade
  // on a name the brief simultaneously flags as a top long.
  const tier1ContextStr = tier1
    .map((t) => `${t.ticker}: TIER 1 BULLISH — highest conviction long, DO NOT recommend puts or fade signals`)
    .join("\n")

  let signals = await runSignals({
    tickers: signalTickers,
    newsContext,
    livePrices,
    contextPrefix: signalsContextPrefix,
    tier1Context: tier1ContextStr || null,
  })

  // ── Coherence gate: a Tier 1 ticker can never carry a bearish signal ──
  // Safety net behind the prompt injection above — if the Signals Engine still
  // returns SELL/FADE on a Tier 1 name, drop it so the brief stays internally
  // consistent (Tier 1 has final authority on directional bias).
  const tier1TickerSet = new Set(tier1.map((t) => t.ticker.toUpperCase()))
  signals = signals.filter((signal) => {
    if (!tier1TickerSet.has(signal.ticker.toUpperCase())) return true
    const isBearish = signal.signal === "SELL" || signal.signal === "FADE"
    if (isBearish) {
      console.warn(`[coherence] Removing bearish signal (${signal.signal}) for Tier 1 ticker ${signal.ticker}`)
      return false
    }
    return true
  })

  // ── Expiry gate: no signal may carry an expiry under MIN_DTE days out ──
  // Safety net behind the prompt rules + options-context filter. 0DTE/1DTE plays
  // are unusable; any sub-14-day expiry in a play string is rewritten to the next
  // standard monthly expiry (3rd Friday) at least MIN_DTE days out.
  const expiryGateNow = new Date()
  signals = signals.map((signal) =>
    signal.play
      ? { ...signal, play: enforceMinDte(signal.play, signal.ticker, expiryGateNow) }
      : signal
  )

  // ── 5d. Overwrite each signal's displayed price/change with the authoritative
  //        Polygon snapshot. The LLM is told the live price but still emits the
  //        `price`/`change_pct` fields itself, so it can drift to a stale
  //        training-data value (e.g. MU $270 instead of $933). The template
  //        renders signals[].price directly, so the snapshot must win here. ──
  if (livePrices) {
    for (const s of signals) {
      const live = livePrices[s.ticker.toUpperCase()]
      if (live && live.price > 0) {
        s.price = live.price
        s.change_pct = live.change_pct
      }
    }
  }

  // Hand today's signal tickers to the intraday alert scanner (best-effort).
  // The alert scanner reads this file to raise the bar on names already in the brief.
  try {
    const briefTickersList = signals.map((s) => s.ticker)
    writeFileSync("/tmp/white80-brief-tickers.json", JSON.stringify(briefTickersList))
  } catch {
    /* non-fatal — alert scanner falls back to an empty brief-ticker set */
  }

  // ── 6. Daily Brief: macro / catalysts / top plays ──
  const brief = await runDailyBrief({ polygonKey, tickers: watchlist, premarketContext: premarketContext || null, livePrices })

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
