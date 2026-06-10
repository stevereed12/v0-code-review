// ─── INTRADAY ALERT SCANNER ──────────────────────────────────────────────────
// Standalone hourly scanner (market hours only). Scores a ~150-name S&P 500 +
// Nasdaq 100 universe for conviction signals using ONLY live Polygon data
// (+ a single sonar catalyst check per ticker). Pure logic: returns scored
// results. Thresholding, dedup state, and email live in the routine app.
//
// Score (0–100) = optionsHeat(25) + volume(20) + consolidation(20)
//                + catalyst(15) + sma20(10) + sectorStrength(10)

import OpenAI from "openai"
import { resolvePolygonKey } from "../model"

const POLYGON_BASE = "https://api.polygon.io"

// ─── UNIVERSE ────────────────────────────────────────────────────────────────
// ~150 high-liquidity S&P 500 + Nasdaq 100 leaders. Deduplicated below.

const RAW_UNIVERSE = [
  // Mag 7
  "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA",
  // Semis
  "AMD", "AVGO", "QCOM", "MU", "INTC", "AMAT", "LRCX", "KLAC", "TXN", "MRVL", "SMCI", "ARM",
  // Tech / software
  "CRM", "NOW", "SNOW", "PLTR", "PANW", "CRWD", "NET", "DDOG", "MDB", "ZS", "FTNT", "OKTA",
  "ADBE", "ORCL", "CSCO", "INTU", "NFLX", "TEAM", "WDAY", "ANSS", "CDNS", "SNPS",
  // Finance
  "JPM", "GS", "MS", "BAC", "C", "WFC", "BRK.B", "V", "MA", "PYPL", "COIN", "SQ", "HOOD",
  "BLK", "SCHW", "AXP", "SPGI", "CME", "PNC",
  // Energy
  "XOM", "CVX", "OXY", "SLB", "COP", "EOG", "MPC", "PSX",
  // Healthcare
  "LLY", "NVO", "ABBV", "JNJ", "MRK", "PFE", "AMGN", "GILD", "REGN", "ISRG", "UNH",
  "TMO", "ABT", "DHR", "BMY", "VRTX",
  // Consumer
  "WMT", "COST", "TGT", "NKE", "SBUX", "MCD", "HD", "LOW", "PEP", "KO", "PG", "MDLZ", "MNST",
  // Industrial
  "CAT", "DE", "BA", "RTX", "LMT", "GE", "HON", "UPS", "FDX", "ETN", "ITW", "NOC",
  // Semis ETFs / proxies
  "SMH", "SOXX",
  // Market ETFs
  "SPY", "QQQ", "IWM",
  // Sector ETFs (also used for sector-strength reads)
  "XLK", "XLF", "XLE", "XLV", "XLY", "XLP", "XLI", "XLB", "XLU", "XLRE", "XLC",
  // Meme / high-vol
  "MSTR", "SOFI", "GME", "AMC", "RIVN", "LCID", "AFRM", "RBLX",
  // Watchlist names (watchlist.json)
  "AAL",
]

/** Deduplicated, uppercased scan universe. */
export const ALERT_UNIVERSE: string[] = [...new Set(RAW_UNIVERSE.map((t) => t.toUpperCase()))]

// ─── SECTOR ETF MAPPING (ticker → sector ETF) ────────────────────────────────

const SECTOR_ETF_BY_TICKER: Record<string, string> = {
  // Tech / semis / software → XLK
  AAPL: "XLK", MSFT: "XLK", NVDA: "XLK", AMD: "XLK", AVGO: "XLK", QCOM: "XLK",
  MU: "XLK", INTC: "XLK", AMAT: "XLK", LRCX: "XLK", KLAC: "XLK", TXN: "XLK",
  MRVL: "XLK", SMCI: "XLK", ARM: "XLK", CRM: "XLK", NOW: "XLK", SNOW: "XLK",
  PLTR: "XLK", PANW: "XLK", CRWD: "XLK", NET: "XLK", DDOG: "XLK", MDB: "XLK",
  ZS: "XLK", FTNT: "XLK", OKTA: "XLK", ADBE: "XLK", ORCL: "XLK", CSCO: "XLK",
  INTU: "XLK", TEAM: "XLK", WDAY: "XLK", ANSS: "XLK", CDNS: "XLK", SNPS: "XLK",
  // Communication services → XLC
  GOOGL: "XLC", META: "XLC", NFLX: "XLC",
  // Finance → XLF
  JPM: "XLF", GS: "XLF", MS: "XLF", BAC: "XLF", C: "XLF", WFC: "XLF",
  "BRK.B": "XLF", V: "XLF", MA: "XLF", PYPL: "XLF", COIN: "XLF", SQ: "XLF",
  HOOD: "XLF", BLK: "XLF", SCHW: "XLF", AXP: "XLF", SPGI: "XLF", CME: "XLF",
  PNC: "XLF", SOFI: "XLF", AFRM: "XLF",
  // Energy → XLE
  XOM: "XLE", CVX: "XLE", OXY: "XLE", SLB: "XLE", COP: "XLE", EOG: "XLE",
  MPC: "XLE", PSX: "XLE",
  // Healthcare → XLV
  LLY: "XLV", NVO: "XLV", ABBV: "XLV", JNJ: "XLV", MRK: "XLV", PFE: "XLV",
  AMGN: "XLV", GILD: "XLV", REGN: "XLV", ISRG: "XLV", UNH: "XLV", TMO: "XLV",
  ABT: "XLV", DHR: "XLV", BMY: "XLV", VRTX: "XLV",
  // Consumer discretionary → XLY
  AMZN: "XLY", TSLA: "XLY", HD: "XLY", LOW: "XLY", NKE: "XLY", SBUX: "XLY",
  MCD: "XLY", RIVN: "XLY", LCID: "XLY", RBLX: "XLY", GME: "XLY", AMC: "XLY",
  // Consumer staples → XLP
  WMT: "XLP", COST: "XLP", TGT: "XLP", PEP: "XLP", KO: "XLP", PG: "XLP",
  MDLZ: "XLP", MNST: "XLP",
  // Industrial → XLI
  CAT: "XLI", DE: "XLI", BA: "XLI", RTX: "XLI", LMT: "XLI", GE: "XLI",
  HON: "XLI", UPS: "XLI", FDX: "XLI", ETN: "XLI", ITW: "XLI", NOC: "XLI",
  AAL: "XLI",
  // Crypto-proxy / misc → XLK (tech-adjacent)
  MSTR: "XLK",
}

function sectorEtfFor(ticker: string): string {
  return SECTOR_ETF_BY_TICKER[ticker] || "SPY"
}

// ─── POLYGON FETCH ───────────────────────────────────────────────────────────

async function polygonFetch(endpoint: string, apiKey: string): Promise<unknown> {
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")
  const url = `${POLYGON_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited - please wait and try again")
    const text = await res.text()
    throw new Error(`Polygon API error ${res.status}: ${text.slice(0, 100)}`)
  }
  return res.json()
}

interface Bar { c: number; v: number; h: number; l: number; o: number; t: number }

async function getBars(ticker: string, apiKey: string, days = 25): Promise<Bar[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days - 10)
  const fromStr = from.toISOString().split("T")[0]
  const toStr = to.toISOString().split("T")[0]
  const data = (await polygonFetch(
    `/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=${days + 15}`,
    apiKey
  )) as { results?: Bar[] }
  return data.results || []
}

// ─── SCORING COMPONENTS ──────────────────────────────────────────────────────

/** Current ET wall-clock time as minutes since midnight. */
function etMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0")
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0")
  return hour * 60 + minute
}

/** Options Heat (25). Uses the live options snapshot endpoint for real flow. */
async function scoreOptionsHeat(ticker: string, currentPrice: number, apiKey: string): Promise<number> {
  try {
    const data = (await polygonFetch(
      `/v3/snapshot/options/${ticker}?limit=250`,
      apiKey
    )) as {
      results?: Array<{
        details?: { contract_type?: string; strike_price?: number; expiration_date?: string }
        day?: { volume?: number; vwap?: number }
        open_interest?: number
        implied_volatility?: number
        greeks?: { delta?: number }
      }>
    }

    const contracts = data.results ?? []
    if (contracts.length === 0) return 5 // neutral fallback

    let callVolume = 0
    let putVolume = 0
    let callOI = 0
    let putOI = 0
    let totalVolume = 0
    let totalOI = 0
    let unusualCount = 0 // contracts where volume > 2× OI (unusual flow)

    for (const c of contracts) {
      const type = c.details?.contract_type
      const vol = c.day?.volume ?? 0
      const oi = c.open_interest ?? 0

      totalVolume += vol
      totalOI += oi

      if (type === "call") {
        callVolume += vol
        callOI += oi
      } else if (type === "put") {
        putVolume += vol
        putOI += oi
      }

      // Unusual activity: today's volume significantly exceeds open interest
      if (oi > 0 && vol > oi * 2) unusualCount++
      // Also flag if a single contract has very high absolute volume (>500 contracts)
      if (vol > 500) unusualCount++
    }

    const callPutRatio = putVolume > 0 ? callVolume / putVolume : callVolume > 0 ? 5 : 1
    const unusualActivity = unusualCount >= 3 // at least 3 contracts with unusual flow

    // Score
    if (callPutRatio > 2.0 && unusualActivity) return 25
    if (callPutRatio > 2.0 || (callPutRatio > 1.5 && unusualActivity)) return 20
    if (callPutRatio > 1.5) return 15
    if (callPutRatio >= 0.8) return 5  // neutral
    if (callPutRatio < 0.5) return 0   // heavily put-dominated = bearish
    return 3                            // slight put lean
  } catch {
    return 5 // neutral on error
  }
}

/** Volume (20). Today's volume vs 20-day average, projected to full-day intraday. */
function scoreVolume(bars: Bar[]): number {
  if (bars.length < 5) return 0
  const today = bars[bars.length - 1]
  const lookback = bars.slice(-21, -1) // up to 20 prior days
  if (lookback.length === 0) return 0
  const avg = lookback.reduce((a, b) => a + b.v, 0) / lookback.length
  if (avg <= 0) return 0

  // Intraday adjustment: if market hasn't closed yet, project full-day volume
  // based on how much of the trading day has elapsed (9:30 AM–4:00 PM ET = 390 min)
  let adjustedVolume = today.v
  const etMinutes = etMinutesNow()
  const marketOpenMinute = 9 * 60 + 30
  const marketCloseMinute = 16 * 60
  const elapsed = Math.max(1, etMinutes - marketOpenMinute)
  const totalMinutes = marketCloseMinute - marketOpenMinute // 390
  if (elapsed < totalMinutes) {
    const pctElapsed = elapsed / totalMinutes
    adjustedVolume = today.v / pctElapsed
  }

  const ratio = adjustedVolume / avg
  if (ratio > 3) return 20
  if (ratio > 2) return 15
  if (ratio > 1.5) return 10
  if (ratio > 1) return 5
  return 0
}

/** Consolidation / Breakout (20). Tight 5-day range + push through the high. */
function scoreConsolidation(bars: Bar[]): number {
  if (bars.length < 6) return 0
  const last5 = bars.slice(-6, -1) // prior 5 sessions (exclude today)
  const today = bars[bars.length - 1]
  const price = today.c
  if (price <= 0) return 0

  const fiveDayHigh = Math.max(...last5.map((b) => b.h))

  // ATR over the prior 5 sessions as % of price.
  let trSum = 0
  for (let i = 1; i < last5.length; i++) {
    const prevClose = last5[i - 1].c
    const tr = Math.max(
      last5[i].h - last5[i].l,
      Math.abs(last5[i].h - prevClose),
      Math.abs(last5[i].l - prevClose)
    )
    trSum += tr
  }
  const atr = last5.length > 1 ? trSum / (last5.length - 1) : 0
  const atrPct = (atr / price) * 100
  const tight = atrPct < 1.5

  if (price > fiveDayHigh && tight) return 20
  if (price >= fiveDayHigh * 0.99) return 15
  if (price >= fiveDayHigh * 0.98) return 10
  return 0
}

/** Catalyst (15). Single-sentence sonar news check (plain text, not JSON). */
async function scoreCatalyst(ticker: string): Promise<{ score: number; note: string }> {
  if (!process.env.PERPLEXITY_API_KEY?.trim()) return { score: 0, note: "" }
  try {
    const client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    })
    const completion = await client.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `You are a financial news monitor with access to live web search. For the ticker ${ticker}:

1. Search for CONFIRMED, PUBLISHED news from the last 24 hours only.
2. If earnings were reported: state the actual EPS beat/miss and revenue vs estimate. Only report this if the earnings release has actually been published — do NOT speculate or estimate.
3. If earnings are SCHEDULED but NOT YET REPORTED: say "Earnings due [date] after/before close" — do NOT fabricate results.
4. If there is analyst upgrade/downgrade: state the firm, old rating, new rating, and price target.
5. If none of the above: reply NO.

Reply format: YES: <one factual sentence with source> or NO

CRITICAL: Never invent or estimate earnings results. If you are not certain the report has been published, say "Earnings due [date]" instead.`,
        },
      ],
    })
    const text = (completion.choices?.[0]?.message?.content ?? "").trim()
    if (/^\s*yes\b/i.test(text)) {
      const note = text.replace(/^\s*yes[:\s-]*/i, "").trim()
      return { score: 15, note }
    }
    return { score: 0, note: "" }
  } catch {
    return { score: 0, note: "" }
  }
}

/** SMA20 (10). Price vs 20-day SMA, with a green-candle bonus. */
function scoreSma20(bars: Bar[]): number {
  if (bars.length < 20) return 0
  const closes = bars.map((b) => b.c)
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const today = bars[bars.length - 1]
  const green = today.c >= today.o
  if (today.c > sma20 && green) return 10
  if (today.c > sma20) return 5
  return 0
}

/** Sector Strength (10). Sector ETF % change today. */
async function scoreSectorStrength(
  ticker: string,
  apiKey: string,
  cache: Map<string, number | null>
): Promise<number> {
  const etf = sectorEtfFor(ticker)
  let chg = cache.get(etf)
  if (chg === undefined) {
    chg = await sectorEtfChangePct(etf, apiKey)
    cache.set(etf, chg)
  }
  if (chg === null) return 5 // unknown → treat as flat
  if (chg > 0.5) return 10
  if (chg >= -0.5) return 5
  return 0
}

async function sectorEtfChangePct(etf: string, apiKey: string): Promise<number | null> {
  try {
    const data = (await polygonFetch(
      `/v2/aggs/ticker/${etf}/prev?adjusted=true`,
      apiKey
    )) as { results?: Array<{ c: number; o: number }> }
    const r = data.results?.[0]
    if (!r || !r.o) return null
    return ((r.c - r.o) / r.o) * 100
  } catch {
    return null
  }
}

// ─── PUBLIC TYPES ────────────────────────────────────────────────────────────

export interface ScoredTicker {
  ticker: string
  score: number
  price: number
  change: number // % change today
  topDrivers: string[]
  catalystNote: string
  breakdown: {
    optionsHeat: number
    volume: number
    consolidation: number
    catalyst: number
    sma20: number
    sectorStrength: number
  }
}

export interface ScanOptions {
  polygonKey?: string
  tickers?: string[]
  /** Run the sonar catalyst check (network + latency). Default true. */
  catalystCheck?: boolean
}

const DRIVER_LABELS: Record<keyof ScoredTicker["breakdown"], string> = {
  optionsHeat: "options heat",
  volume: "volume surge",
  consolidation: "breakout setup",
  catalyst: "catalyst",
  sma20: "above SMA20",
  sectorStrength: "sector strength",
}

function topDriversFrom(b: ScoredTicker["breakdown"]): string[] {
  return (Object.keys(b) as Array<keyof ScoredTicker["breakdown"]>)
    .filter((k) => b[k] > 0)
    .sort((a, c) => b[c] - b[a])
    .slice(0, 3)
    .map((k) => DRIVER_LABELS[k])
}

// ─── SCORE ONE TICKER ────────────────────────────────────────────────────────

async function scoreTicker(
  ticker: string,
  apiKey: string,
  sectorCache: Map<string, number | null>,
  catalystCheck: boolean
): Promise<ScoredTicker | null> {
  const bars = await getBars(ticker, apiKey, 25)
  if (bars.length < 6) return null

  const today = bars[bars.length - 1]
  const prevClose = bars.length >= 2 ? bars[bars.length - 2].c : today.o
  const price = today.c
  const change = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0

  const [optionsHeat, catalyst, sectorStrength] = await Promise.all([
    scoreOptionsHeat(ticker, price, apiKey),
    catalystCheck ? scoreCatalyst(ticker) : Promise.resolve({ score: 0, note: "" }),
    scoreSectorStrength(ticker, apiKey, sectorCache),
  ])

  const volume = scoreVolume(bars)
  const consolidation = scoreConsolidation(bars)
  const sma20 = scoreSma20(bars)

  const breakdown = {
    optionsHeat,
    volume,
    consolidation,
    catalyst: catalyst.score,
    sma20,
    sectorStrength,
  }
  const score =
    breakdown.optionsHeat +
    breakdown.volume +
    breakdown.consolidation +
    breakdown.catalyst +
    breakdown.sma20 +
    breakdown.sectorStrength

  return {
    ticker,
    score,
    price,
    change,
    topDrivers: topDriversFrom(breakdown),
    catalystNote: catalyst.note,
    breakdown,
  }
}

/**
 * Score the full alert universe (or a provided subset) using live Polygon data.
 * Batched with a small delay to respect Polygon rate limits. Tickers that error
 * or lack data are skipped. Results are sorted by score descending.
 */
export async function scanUniverse(opts: ScanOptions = {}): Promise<ScoredTicker[]> {
  const apiKey = resolvePolygonKey(opts.polygonKey)
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")

  const tickers = opts.tickers ?? ALERT_UNIVERSE
  const catalystCheck = opts.catalystCheck ?? true
  const sectorCache = new Map<string, number | null>()
  const out: ScoredTicker[] = []

  const batchSize = 5
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize)
    const settled = await Promise.allSettled(
      batch.map((t) => scoreTicker(t, apiKey, sectorCache, catalystCheck))
    )
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) out.push(r.value)
    }
    if (i + batchSize < tickers.length) {
      await new Promise((r) => setTimeout(r, 300))
    }
  }

  out.sort((a, b) => b.score - a.score)
  return out
}
