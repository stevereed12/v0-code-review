// ─── OPTIONS FLOW CONTEXT ────────────────────────────────────────────────────
// Fetches the Polygon options snapshot for each signal ticker and distills a
// structured options-flow summary the Signals Engine uses as hard context when
// setting entry/target/stop levels. Bullish flow → tighter stop, higher target;
// bearish flow → flag the position.

import { resolvePolygonKey } from "../model"

const POLYGON_BASE = "https://api.polygon.io"
const BATCH_SIZE = 10
const BATCH_DELAY_MS = 200

export interface OptionsContext {
  ticker: string
  callPutRatio: number
  unusualActivity: boolean // true if volume > 2x avg OI
  dominantExpiry: string // e.g. "6/20" — expiry with most OI
  dominantStrike: number // strike with most OI at dominant expiry
  ivRank: number // 0-100, estimated from IV vs recent range
  bias: "bullish" | "neutral" | "bearish"
}

// ─── POLYGON OPTIONS SNAPSHOT ────────────────────────────────────────────────

interface OptionContract {
  details?: {
    contract_type?: "call" | "put"
    strike_price?: number
    expiration_date?: string // YYYY-MM-DD
  }
  day?: { volume?: number }
  open_interest?: number
  implied_volatility?: number
  underlying_asset?: { price?: number }
}

async function fetchOptionsSnapshot(ticker: string, apiKey: string): Promise<OptionContract[]> {
  const url = `${POLYGON_BASE}/v3/snapshot/options/${ticker}?limit=50&apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { results?: OptionContract[] }
  return data.results ?? []
}

/** Format a YYYY-MM-DD expiration as "M/D". */
function formatExpiry(iso: string): string {
  const parts = iso.split("-")
  if (parts.length !== 3) return iso
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  if (isNaN(month) || isNaN(day)) return iso
  return `${month}/${day}`
}

const MIN_DTE_MS = 14 * 24 * 60 * 60 * 1000

function distill(ticker: string, contracts: OptionContract[]): OptionsContext {
  let callVolume = 0
  let putVolume = 0
  let totalVolume = 0
  let totalOI = 0

  let underlyingPrice = 0

  // Volume/OI aggregates use the full chain, but the dominant expiry/strike must
  // skip front-week (0DTE/1DTE) contracts — those carry the most OI on any given
  // day and were anchoring the Signals Engine to 1-day expiries.
  const minExpiry = new Date(Date.now() + MIN_DTE_MS)
  const validContracts = contracts.filter((c) => {
    if (!c.details?.expiration_date) return false
    return new Date(c.details.expiration_date) >= minExpiry
  })
  const contractsForDominant = validContracts.length > 0 ? validContracts : contracts

  let topOIContract: OptionContract | null = null
  let topOI = -1

  for (const c of contracts) {
    const type = c.details?.contract_type
    const vol = c.day?.volume ?? 0
    const oi = c.open_interest ?? 0
    totalVolume += vol
    totalOI += oi
    if (type === "call") callVolume += vol
    else if (type === "put") putVolume += vol
    if (!underlyingPrice && c.underlying_asset?.price) underlyingPrice = c.underlying_asset.price
  }

  for (const c of contractsForDominant) {
    const oi = c.open_interest ?? 0
    if (oi > topOI) {
      topOI = oi
      topOIContract = c
    }
  }

  const callPutRatio = putVolume > 0 ? callVolume / putVolume : callVolume > 0 ? 5 : 1

  // Unusual activity: total traded volume outpaces resting OI by > 2x.
  const unusualActivity = totalOI > 0 && totalVolume > totalOI * 2

  const dominantExpiry = topOIContract?.details?.expiration_date
    ? formatExpiry(topOIContract.details.expiration_date)
    : ""
  const dominantStrike = topOIContract?.details?.strike_price ?? 0

  // IV rank proxy: nearest-ATM contract's IV scaled. Polygon gives no direct IVR.
  let atmIV = 0
  if (underlyingPrice > 0) {
    let bestDist = Infinity
    for (const c of contracts) {
      const strike = c.details?.strike_price
      const iv = c.implied_volatility
      if (strike == null || iv == null) continue
      const dist = Math.abs(strike - underlyingPrice)
      if (dist < bestDist) {
        bestDist = dist
        atmIV = iv
      }
    }
  }
  const ivRank = Math.min(100, Math.round(atmIV * 100 * 0.7))

  let bias: OptionsContext["bias"] = "neutral"
  if (callPutRatio > 1.5) bias = "bullish"
  else if (callPutRatio < 0.67) bias = "bearish"

  return { ticker, callPutRatio, unusualActivity, dominantExpiry, dominantStrike, ivRank, bias }
}

/**
 * Fetch options-flow context for the given tickers. Batched into groups of 10
 * with a 200ms delay between batches to respect Polygon rate limits. Tickers
 * that error or lack data are skipped.
 */
export async function fetchOptionsContext(tickers: string[]): Promise<OptionsContext[]> {
  const apiKey = resolvePolygonKey()
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")

  const out: OptionsContext[] = []
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE)
    const settled = await Promise.allSettled(
      batch.map(async (t) => distill(t, await fetchOptionsSnapshot(t, apiKey)))
    )
    for (const r of settled) {
      if (r.status === "fulfilled") out.push(r.value)
    }
    if (i + BATCH_SIZE < tickers.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }
  return out
}
