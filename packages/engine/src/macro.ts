// ─── MACRO DATA FETCHER ───────────────────────────────────────────────────────
// Fetches live prices for the ticker strip (SPY, QQQ, VIX, WTI, 10Y, DXY, GOLD)
// directly from Polygon. These are injected as hard ground-truth into the pipeline
// output — no LLM is asked to guess these prices.
//
// Polygon endpoints used:
//   Stocks (SPY, QQQ):          /v2/snapshot/locale/us/markets/stocks/tickers/{ticker}
//   Indices (VIX, DXY):         /v3/snapshot?ticker.any_of=I:VIX,I:DXY
//   Forex/Commodities (WTI):    /v2/snapshot/locale/global/markets/forex/tickers/C:USDWTI
//   Bonds (10Y yield):          /v2/snapshot/locale/global/markets/bonds  (if available)
//                                fallback: /v3/snapshot?ticker.any_of=I:TNX
//   Gold:                       /v2/snapshot/locale/global/markets/forex/tickers/C:XAUUSD
//                                fallback: check GLD ETF

const POLYGON_BASE = "https://api.polygon.io"

async function pFetch(path: string, key: string): Promise<unknown> {
  try {
    const sep = path.includes("?") ? "&" : "?"
    const res = await fetch(`${POLYGON_BASE}${path}${sep}apiKey=${key}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getStockSnapshot(ticker: string, key: string): Promise<{ price: number; change_pct: number } | null> {
  const data = await pFetch(`/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`, key) as {
    ticker?: {
      lastTrade?: { p: number }
      lastQuote?: { P: number; p: number }
      min?: { c: number }
      day?: { c: number }
      prevDay?: { c: number }
      todaysChangePerc?: number
    }
  } | null
  if (!data?.ticker) return null
  const t = data.ticker
  const price = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
  const prev = t.prevDay?.c || 0
  const change_pct = prev > 0 ? ((price - prev) / prev) * 100 : t.todaysChangePerc || 0
  if (!price) return null
  return { price, change_pct }
}

async function getIndexSnapshot(polygonTicker: string, key: string): Promise<{ price: number; change_pct: number } | null> {
  // Polygon index tickers use "I:" prefix
  const data = await pFetch(`/v3/snapshot?ticker.any_of=${polygonTicker}`, key) as {
    results?: Array<{ value?: number; session?: { change_percent?: number; close?: number; previous_close?: number } }>
  } | null
  if (!data?.results?.[0]) return null
  const r = data.results[0]
  const price = r.value || r.session?.close || 0
  const prev = r.session?.previous_close || 0
  const change_pct = r.session?.change_percent || (prev > 0 ? ((price - prev) / prev) * 100 : 0)
  if (!price) return null
  return { price, change_pct }
}

async function getForexSnapshot(polygonTicker: string, key: string): Promise<{ price: number; change_pct: number } | null> {
  const data = await pFetch(`/v2/snapshot/locale/global/markets/forex/tickers/${polygonTicker}`, key) as {
    ticker?: {
      day?: { c: number; o: number }
      lastQuote?: { a: number; b: number }
      prevDay?: { c: number }
      todaysChangePerc?: number
    }
  } | null
  if (!data?.ticker) return null
  const t = data.ticker
  const price = t.lastQuote?.a || t.day?.c || 0
  const prev = t.prevDay?.c || 0
  const change_pct = prev > 0 ? ((price - prev) / prev) * 100 : t.todaysChangePerc || 0
  if (!price) return null
  return { price, change_pct }
}

export interface MacroPulse {
  spy:      { price: number; change_pct: number; context: string }
  qqq:      { price: number; change_pct: number; context: string }
  vix:      { level: number; direction: string; context: string }
  dxy:      { level: number; change_pct: number; context: string }
  ten_year: { yield: number; change_pct: number; context: string }
  wti:      { price: number; change_pct: number; context: string }
  gold:     { price: number; change_pct: number; context: string }
}

function direction(change: number): string {
  if (change > 0.5) return "UP"
  if (change < -0.5) return "DOWN"
  return "FLAT"
}

function ctx(price: number, change: number, unit = "$"): string {
  const sign = change >= 0 ? "+" : ""
  return `${unit}${price.toFixed(2)} (${sign}${change.toFixed(2)}%)`
}

/**
 * Fetch all ticker-strip macro data from Polygon.
 * Falls back gracefully — if a specific endpoint fails, that field gets
 * a placeholder rather than crashing the whole pipeline.
 */
export async function fetchMacroPulse(polygonKey: string): Promise<MacroPulse> {
  const [spy, qqq, vix, dxy, tnx, wti, gold, gld] = await Promise.all([
    getStockSnapshot("SPY", polygonKey),
    getStockSnapshot("QQQ", polygonKey),
    getIndexSnapshot("I:VIX", polygonKey),
    getIndexSnapshot("I:DXY", polygonKey),
    getIndexSnapshot("I:TNX", polygonKey),          // 10Y yield index
    getForexSnapshot("C:USDWTI", polygonKey),       // WTI crude
    getForexSnapshot("C:XAUUSD", polygonKey),       // Gold spot
    getStockSnapshot("GLD", polygonKey),            // Gold ETF fallback
  ])

  // 10Y yield — TNX index quotes in 10ths of a percent (e.g. 44.5 = 4.45%)
  const tenYearRaw = tnx?.price || 0
  const tenYearYield = tenYearRaw > 20 ? tenYearRaw / 10 : tenYearRaw  // normalize
  const tenYearChange = tnx?.change_pct || 0

  // Gold — prefer spot, fall back to GLD ETF * ~9.6 (GLD ≈ 1/10 oz)
  const goldPrice = gold?.price || (gld ? gld.price * 9.6 : 0)
  const goldChange = gold?.change_pct || gld?.change_pct || 0

  return {
    spy: {
      price:      spy?.price || 0,
      change_pct: spy?.change_pct || 0,
      context:    spy ? ctx(spy.price, spy.change_pct) : "unavailable",
    },
    qqq: {
      price:      qqq?.price || 0,
      change_pct: qqq?.change_pct || 0,
      context:    qqq ? ctx(qqq.price, qqq.change_pct) : "unavailable",
    },
    vix: {
      level:     vix?.price || 0,
      direction: direction(vix?.change_pct || 0),
      context:   vix ? `${vix.price.toFixed(2)} (${direction(vix.change_pct || 0)})` : "unavailable",
    },
    dxy: {
      level:      dxy?.price || 0,
      change_pct: dxy?.change_pct || 0,
      context:    dxy ? ctx(dxy.price, dxy.change_pct) : "unavailable",
    },
    ten_year: {
      yield:      parseFloat(tenYearYield.toFixed(3)),
      change_pct: tenYearChange,
      context:    tenYearYield > 0 ? `${tenYearYield.toFixed(2)}% (${tenYearChange >= 0 ? "+" : ""}${tenYearChange.toFixed(2)}%)` : "unavailable",
    },
    wti: {
      price:      wti?.price || 0,
      change_pct: wti?.change_pct || 0,
      context:    wti ? ctx(wti.price, wti.change_pct) : "unavailable",
    },
    gold: {
      price:      parseFloat(goldPrice.toFixed(2)),
      change_pct: parseFloat(goldChange.toFixed(3)),
      context:    goldPrice > 0 ? ctx(goldPrice, goldChange) : "unavailable",
    },
  }
}
