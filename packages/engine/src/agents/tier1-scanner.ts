// ─── TIER 1 SCANNER AGENT ────────────────────────────────────────────────────
// Ported VERBATIM from the web app's app/api/tier1-scan/route.ts. All technical
// math (SMA, ATR, consolidation, options flow, sector strength, scoring, reasoning
// blurb) and the batched scan-with-rate-limit loop are preserved exactly. The only
// change is replacing the module-level mutable request key with an explicit apiKey
// threaded through polygonFetch — behavior is identical.

import type { Tier1Signal, SignalResult, ScanConfig, ScanResult } from "../types"
import { DEFAULT_SCAN_CONFIG, SECTOR_ETFS } from "../types"
import { resolvePolygonKey } from "../model"

const POLYGON_BASE = "https://api.polygon.io"

async function polygonFetch(endpoint: string, apiKey: string): Promise<unknown> {
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")

  const url = `${POLYGON_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`
  const res = await fetch(url)

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Rate limited - please wait and try again")
    }
    const text = await res.text()
    throw new Error(`Polygon API error ${res.status}: ${text.slice(0, 100)}`)
  }

  return res.json()
}

// ─── UNIVERSE: S&P 500 + Nasdaq 100 ──────────────────────────────────────────
// Static list to avoid extra API calls - updated periodically

const SP500_SAMPLE = [
  "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "BRK.B", "UNH", "JNJ",
  "JPM", "V", "PG", "XOM", "HD", "CVX", "MA", "ABBV", "MRK", "AVGO",
  "PEP", "KO", "COST", "LLY", "WMT", "TMO", "MCD", "CSCO", "ACN", "ABT",
  "DHR", "NKE", "VZ", "ADBE", "TXN", "CRM", "PM", "CMCSA", "NEE", "WFC",
  "BMY", "RTX", "ORCL", "UPS", "HON", "QCOM", "COP", "LOW", "UNP", "INTC",
  "SPGI", "IBM", "BA", "GE", "AMAT", "DE", "ELV", "CAT", "SBUX", "INTU",
  "AMD", "PLD", "ISRG", "NOW", "GS", "BKNG", "ADI", "AXP", "MDLZ", "MS",
  "LMT", "GILD", "BLK", "SYK", "TJX", "ADP", "VRTX", "REGN", "MMC", "CB",
  "SCHW", "ETN", "ZTS", "MO", "CI", "EOG", "DUK", "SO", "PGR", "LRCX",
  "BDX", "CME", "NOC", "ITW", "SLB", "EQIX", "PNC", "TGT", "MU", "APD",
]

const NASDAQ100_SAMPLE = [
  "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "AVGO", "COST", "ADBE",
  "AMD", "CSCO", "PEP", "NFLX", "CMCSA", "TMUS", "INTC", "INTU", "TXN", "QCOM",
  "HON", "AMGN", "AMAT", "BKNG", "ISRG", "SBUX", "MDLZ", "ADI", "GILD", "ADP",
  "VRTX", "REGN", "LRCX", "MU", "PYPL", "KLAC", "SNPS", "MELI", "PANW", "CDNS",
  "CRWD", "MAR", "ORLY", "CHTR", "MNST", "MRVL", "CTAS", "FTNT", "WDAY", "DXCM",
  "AEP", "KDP", "AZN", "KHC", "ODFL", "ADSK", "PAYX", "EXC", "PCAR", "ROST",
  "XEL", "CPRT", "IDXX", "MCHP", "FAST", "VRSK", "CTSH", "EA", "BIIB", "DDOG",
  "GEHC", "CSGP", "ON", "BKR", "FANG", "CDW", "ANSS", "GFS", "TEAM", "ZS",
  "TTWO", "ILMN", "WBD", "ALGN", "MRNA", "ENPH", "SIRI", "JD", "LCID", "RIVN",
  "ARM", "SMCI", "MSTR", "PLTR", "COIN", "HOOD", "SOFI", "AFRM", "RBLX", "SNOW",
]

// Deduplicate
const SCAN_UNIVERSE = [...new Set([...SP500_SAMPLE, ...NASDAQ100_SAMPLE])]

// ─── SECTOR MAPPING ──────────────────────────────────────────────────────────

const TICKER_SECTORS: Record<string, string> = {
  // Tech
  AAPL: "Technology", MSFT: "Technology", NVDA: "Technology", GOOGL: "Technology",
  META: "Technology", ADBE: "Technology", CRM: "Technology", ORCL: "Technology",
  AMD: "Technology", INTC: "Technology", AVGO: "Technology", TXN: "Technology",
  QCOM: "Technology", AMAT: "Technology", MU: "Technology", LRCX: "Technology",
  // Healthcare
  UNH: "Healthcare", JNJ: "Healthcare", ABBV: "Healthcare", MRK: "Healthcare",
  LLY: "Healthcare", TMO: "Healthcare", ABT: "Healthcare", DHR: "Healthcare",
  BMY: "Healthcare", GILD: "Healthcare", VRTX: "Healthcare", REGN: "Healthcare",
  // Financials
  JPM: "Financials", V: "Financials", MA: "Financials", BAC: "Financials",
  WFC: "Financials", GS: "Financials", MS: "Financials", BLK: "Financials",
  // Consumer
  AMZN: "Consumer Discretionary", TSLA: "Consumer Discretionary", HD: "Consumer Discretionary",
  MCD: "Consumer Discretionary", NKE: "Consumer Discretionary", SBUX: "Consumer Discretionary",
  // Energy
  XOM: "Energy", CVX: "Energy", COP: "Energy", SLB: "Energy", EOG: "Energy",
  // Default
}

function getSector(ticker: string): string {
  return TICKER_SECTORS[ticker] || "Technology"
}

// ─── FETCH HELPERS ───────────────────────────────────────────────────────────

async function getBars(ticker: string, apiKey: string, days = 50) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days - 10)

  const fromStr = from.toISOString().split("T")[0]
  const toStr = to.toISOString().split("T")[0]

  const data = await polygonFetch(
    `/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=${days + 5}`,
    apiKey
  ) as { results?: Array<{ c: number; v: number; h: number; l: number; o: number; t: number }> }

  return data.results || []
}

async function getTickerDetails(ticker: string, apiKey: string) {
  try {
    const data = await polygonFetch(`/v3/reference/tickers/${ticker}`, apiKey) as {
      results?: { name: string; sic_description?: string }
    }
    return data.results
  } catch {
    return null
  }
}

// ─── OPTIONS DATA ────────────────────────────────────────────────────────────

interface OptionsData {
  callVolume: number
  putVolume: number
  callPutRatio: number
  nearTermCallOI: number
  nearTermPutOI: number
  unusualCallActivity: boolean
  atmCallSkew: number // % of calls near the money
}

async function getOptionsFlow(ticker: string, currentPrice: number, apiKey: string): Promise<OptionsData | null> {
  try {
    // Get options contracts expiring in next 30 days
    const now = new Date()
    const in30Days = new Date()
    in30Days.setDate(now.getDate() + 30)

    const fromDate = now.toISOString().split("T")[0]
    const toDate = in30Days.toISOString().split("T")[0]

    const data = await polygonFetch(
      `/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date.gte=${fromDate}&expiration_date.lte=${toDate}&limit=250`,
      apiKey
    ) as {
      results?: Array<{
        contract_type: string
        strike_price: number
        expiration_date: string
      }>
    }

    const contracts = data.results || []
    if (contracts.length === 0) return null

    let callCount = 0
    let putCount = 0
    let atmCalls = 0 // Within 5% of current price

    const atmRange = currentPrice * 0.05

    for (const contract of contracts) {
      if (contract.contract_type === "call") {
        callCount++
        if (Math.abs(contract.strike_price - currentPrice) <= atmRange) {
          atmCalls++
        }
      } else if (contract.contract_type === "put") {
        putCount++
      }
    }

    const callPutRatio = putCount > 0 ? callCount / putCount : callCount > 0 ? 5 : 1
    const atmCallSkew = callCount > 0 ? (atmCalls / callCount) * 100 : 0

    // Unusual activity = high call/put ratio + concentration near ATM
    const unusualCallActivity = callPutRatio > 1.5 && atmCallSkew > 20

    return {
      callVolume: callCount,
      putVolume: putCount,
      callPutRatio,
      nearTermCallOI: atmCalls,
      nearTermPutOI: 0,
      unusualCallActivity,
      atmCallSkew,
    }
  } catch (err) {
    // Options data might not be available for all tickers
    console.error(`Options fetch failed for ${ticker}:`, err)
    return null
  }
}

// ─── SIGNAL CALCULATIONS ─────────────────────────────────────────────────────

function calculateTechnicals(bars: Array<{ c: number; v: number; h: number; l: number }>) {
  if (bars.length < 20) return null

  const closes = bars.map(b => b.c)
  const volumes = bars.map(b => b.v)
  const highs = bars.map(b => b.h)
  const lows = bars.map(b => b.l)

  const currentPrice = closes[closes.length - 1]
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20

  // ATR
  const atrPeriod = Math.min(14, bars.length - 1)
  let atrSum = 0
  for (let i = bars.length - atrPeriod; i < bars.length; i++) {
    const prevClose = closes[i - 1] || closes[i]
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - prevClose), Math.abs(lows[i] - prevClose))
    atrSum += tr
  }
  const atr = atrSum / atrPeriod

  // Volume
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const volumeRatio = recentVolume / avgVolume

  // Consolidation (range vs ATR)
  const recent10 = bars.slice(-10)
  const rangeHigh = Math.max(...recent10.map(b => b.h))
  const rangeLow = Math.min(...recent10.map(b => b.l))
  const rangePercent = ((rangeHigh - rangeLow) / currentPrice) * 100
  const consolidationScore = Math.max(0, Math.min(100, 100 - (rangePercent * 8)))

  return {
    currentPrice,
    sma20,
    atr,
    avgVolume,
    volumeRatio,
    consolidationScore,
    priceVsSma: ((currentPrice - sma20) / sma20) * 100,
  }
}

async function checkSectorStrength(sectorEtf: string, spyBars: Array<{ c: number }>, apiKey: string) {
  try {
    const sectorBars = await getBars(sectorEtf, apiKey, 20)
    if (sectorBars.length < 10 || spyBars.length < 10) return { active: false }

    const sectorReturn = (sectorBars[sectorBars.length - 1].c - sectorBars[0].c) / sectorBars[0].c
    const spyReturn = (spyBars[spyBars.length - 1].c - spyBars[0].c) / spyBars[0].c

    const outperformance = (sectorReturn - spyReturn) * 100

    return {
      active: outperformance > 0,
      value: outperformance,
      detail: `${outperformance > 0 ? "+" : ""}${outperformance.toFixed(1)}% vs SPY`,
    }
  } catch {
    return { active: false }
  }
}

// ─── MAIN SCAN FUNCTION ──────────────────────────────────────────────────────

async function scanTicker(
  ticker: string,
  spyBars: Array<{ c: number }>,
  config: ScanConfig,
  apiKey: string
): Promise<Tier1Signal | null> {
  try {
    const bars = await getBars(ticker, apiKey, 50)
    if (bars.length < 20) return null

    const technicals = calculateTechnicals(bars)
    if (!technicals) return null

    const details = await getTickerDetails(ticker, apiKey)
    const sector = getSector(ticker)
    const sectorEtf = SECTOR_ETFS[sector] || "XLK"

    // Signal 1: Near Catalyst (we'll use Claude for this in a separate call)
    // For now, mark as active for stocks with recent momentum (proxy for "something brewing")
    const recentMomentum = technicals.priceVsSma > 1 && technicals.volumeRatio > 1.0
    const nearCatalyst: SignalResult = {
      active: recentMomentum,
      detail: recentMomentum ? "Momentum suggests catalyst interest" : "No obvious catalyst"
    }

    // Signal 2: Consolidating - VERY relaxed (most stocks consolidate sometimes)
    const consolidating: SignalResult = {
      active: technicals.consolidationScore > 20, // Was 30
      value: technicals.consolidationScore,
      detail: `Consolidation: ${technicals.consolidationScore.toFixed(0)}/100`,
    }

    // Signal 3: Price trend - Above OR Near SMA20 (within 5% either way = range-bound = opportunity)
    const nearSma = Math.abs(technicals.priceVsSma) < 5
    const aboveSma: SignalResult = {
      active: technicals.priceVsSma > -5, // Much more lenient - just not crashing
      value: technicals.priceVsSma,
      detail: technicals.priceVsSma > 2 ? `+${technicals.priceVsSma.toFixed(1)}% above SMA20`
        : technicals.priceVsSma > -2 ? "Trading near SMA20"
        : `${technicals.priceVsSma.toFixed(1)}% vs SMA20`,
    }

    // Signal 4: Sector outperforming SPY - very relaxed (not underperforming badly)
    const sectorStrong = await checkSectorStrength(sectorEtf, spyBars, apiKey)
    // Make sector signal much more lenient - just not badly lagging
    if (sectorStrong.value !== undefined && sectorStrong.value > -3) {
      sectorStrong.active = true
    }

    // Signal 5: Real Options Heat from Polygon
    let optionsHeat: SignalResult
    const optionsData = await getOptionsFlow(ticker, technicals.currentPrice, apiKey)

    if (optionsData) {
      const { callPutRatio, unusualCallActivity, atmCallSkew } = optionsData

      // Active if: unusual call activity OR high call/put ratio OR concentrated ATM calls
      const isHot = unusualCallActivity || callPutRatio > 2 || atmCallSkew > 30

      optionsHeat = {
        active: isHot,
        value: callPutRatio,
        detail: isHot
          ? `C/P ratio ${callPutRatio.toFixed(1)}x, ${atmCallSkew.toFixed(0)}% ATM calls`
          : `C/P ratio ${callPutRatio.toFixed(1)}x (normal)`,
      }
    } else {
      // Fallback to volume proxy if options data unavailable
      optionsHeat = {
        active: technicals.volumeRatio > 1.3,
        value: technicals.volumeRatio,
        detail: technicals.volumeRatio > 1.3 ? "Elevated volume (options N/A)" : "Normal flow"
      }
    }

    // Signal 6: Volume building - any volume above 80% of normal
    const volumeBuilding: SignalResult = {
      active: technicals.volumeRatio > 0.8, // Very relaxed
      value: technicals.volumeRatio,
      detail: `${(technicals.volumeRatio * 100).toFixed(0)}% of avg volume`,
    }

    // Calculate composite score
    const signals = { nearCatalyst, consolidating, aboveSma, sectorStrong, optionsHeat, volumeBuilding }
    const score = Object.values(signals).filter(s => s.active).length

    // Generate reasoning blurb based on active signals
    const reasonParts: string[] = []
    if (nearCatalyst.active) reasonParts.push("momentum building ahead of potential catalyst")
    if (consolidating.active && technicals.consolidationScore > 50) reasonParts.push("tight consolidation - coiled spring setup")
    else if (consolidating.active) reasonParts.push("range-bound and building")
    if (aboveSma.active && technicals.priceVsSma > 3) reasonParts.push("strong uptrend above moving average")
    else if (aboveSma.active && technicals.priceVsSma > 0) reasonParts.push("holding above key support")
    else if (aboveSma.active) reasonParts.push("testing 20-day level")
    if (sectorStrong.active && (sectorStrong.value || 0) > 2) reasonParts.push("sector leader")
    else if (sectorStrong.active && (sectorStrong.value || 0) > 0) reasonParts.push("sector tailwind")
    if (optionsHeat.active && optionsData) {
      if (optionsData.callPutRatio > 2.5) reasonParts.push("heavy call buying")
      else if (optionsData.atmCallSkew > 30) reasonParts.push("options concentrated near the money")
      else reasonParts.push("unusual options activity")
    } else if (optionsHeat.active) {
      reasonParts.push("elevated volume")
    }
    if (volumeBuilding.active && technicals.volumeRatio > 1.2) reasonParts.push("accumulation underway")

    const reasoning = reasonParts.length > 0
      ? reasonParts.slice(0, 3).join(", ").replace(/,([^,]*)$/, " and$1") + "."
      : "On radar - monitoring for setup."

    // Return ALL tickers with any signals - frontend filters by minScore
    // This gives user control over how selective they want to be

    const prevClose = bars[bars.length - 2]?.c || technicals.currentPrice
    const changePercent = ((technicals.currentPrice - prevClose) / prevClose) * 100

    return {
      ticker,
      name: details?.name || ticker,
      sector,
      score,
      signals,
      price: technicals.currentPrice,
      changePercent,
      reasoning,
      optionsData: optionsData ? {
        callPutRatio: optionsData.callPutRatio,
        atmCallSkew: optionsData.atmCallSkew,
        unusualCallActivity: optionsData.unusualCallActivity,
      } : undefined,
    }
  } catch (err) {
    console.error(`Error scanning ${ticker}:`, err)
    return null
  }
}

export interface Tier1ScanOptions {
  polygonKey?: string
  tickers?: string[]
  config?: Partial<ScanConfig>
}

/**
 * Tier 1 Scanner agent — verbatim technical scan over the S&P/Nasdaq universe.
 * Returns the ScanResult (timestamp, totalScanned, matches, errors).
 */
export async function runTier1Scan(opts: Tier1ScanOptions = {}): Promise<ScanResult> {
  const apiKey = resolvePolygonKey(opts.polygonKey)
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")

  const config: ScanConfig = { ...DEFAULT_SCAN_CONFIG, ...opts.config }
  // Scan full universe - use batching and rate limiting to handle volume
  const tickersToScan = opts.tickers || SCAN_UNIVERSE

  // Get SPY bars for sector comparison
  const spyBars = await getBars("SPY", apiKey, 20)

  // Scan in batches to avoid rate limits
  const batchSize = 5 // Smaller batches for stability
  const results: Tier1Signal[] = []
  const errors: string[] = []

  for (let i = 0; i < tickersToScan.length; i += batchSize) {
    const batch = tickersToScan.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map(ticker => scanTicker(ticker, spyBars, config, apiKey))
    )

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j]
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value)
      } else if (result.status === "rejected") {
        errors.push(`${batch[j]}: ${result.reason?.message || "Unknown error"}`)
      }
    }

    // Delay between batches to respect Polygon rate limits (5 calls/min on free tier)
    if (i + batchSize < tickersToScan.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return {
    timestamp: new Date().toISOString(),
    totalScanned: tickersToScan.length,
    matches: results.slice(0, config.maxResults),
    errors: errors.slice(0, 10), // Limit error list
  }
}
