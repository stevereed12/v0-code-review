// ─── MACRO DATA FETCHER ───────────────────────────────────────────────────────
// Fetches live prices for the ticker strip (SPY, QQQ, VIX, WTI, 10Y, DXY, GOLD)
// directly from Polygon. These are injected as hard ground-truth into the pipeline
// output — no LLM is asked to guess these prices.
//
// Polygon supports stocks/ETFs/options — NOT CBOE indices, treasury yields, forex,
// or futures. Every macro reading therefore uses a NYSE/Nasdaq-listed ETF proxy off
// the standard stocks snapshot endpoint:
//   SPY, QQQ:   direct
//   VIX:        VIXY (ProShares VIX Short-Term Futures ETF)
//   DXY:        UUP  (Invesco DB US Dollar Index Bullish ETF)
//   10Y yield:  TLT  (iShares 20+ Year Treasury ETF — inverse to yields)
//   WTI oil:    USO  (United States Oil Fund ETF)
//   Gold:       GLD  (SPDR Gold Shares ETF — tracks ~1/10th of gold spot)
// Endpoint: /v2/snapshot/locale/us/markets/stocks/tickers/{ticker}

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
  // All proxies are NYSE/Nasdaq ETFs on the standard stocks snapshot endpoint —
  // Polygon does not carry CBOE indices, treasury yields, forex, or futures.
  const [spy, qqq, vixy, uup, tlt, uso, gld] = await Promise.all([
    getStockSnapshot("SPY", polygonKey),
    getStockSnapshot("QQQ", polygonKey),
    getStockSnapshot("VIXY", polygonKey),           // VIX proxy
    getStockSnapshot("UUP", polygonKey),            // Dollar index proxy
    getStockSnapshot("TLT", polygonKey),            // 10Y yield proxy (inverse)
    getStockSnapshot("USO", polygonKey),            // WTI crude proxy
    getStockSnapshot("GLD", polygonKey),            // Gold proxy
  ])

  // 10Y yield — Polygon has no treasury yields. TLT (long-bond ETF) is an inverse
  // proxy: its price moves opposite to yields. We surface TLT's price/change so the
  // strip still shows a real number, with the inverse relationship noted in context.
  const tltPrice = tlt?.price || 0
  const tltChange = tlt?.change_pct || 0

  // Gold — GLD tracks ~1/10th of gold spot; scale up to approximate the spot price.
  const goldPrice = gld ? gld.price * 10 : 0
  const goldChange = gld?.change_pct || 0

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
      level:     vixy?.price || 0,
      direction: direction(vixy?.change_pct || 0),
      context:   vixy ? `VIXY ${ctx(vixy.price, vixy.change_pct)}` : "unavailable",
    },
    dxy: {
      level:      uup?.price || 0,
      change_pct: uup?.change_pct || 0,
      context:    uup ? `UUP ${ctx(uup.price, uup.change_pct)}` : "unavailable",
    },
    ten_year: {
      yield:      parseFloat(tltPrice.toFixed(2)),
      change_pct: tltChange,
      context:    tltPrice > 0 ? `TLT ${ctx(tltPrice, tltChange)} (inverse to 10Y yield)` : "unavailable",
    },
    wti: {
      price:      uso?.price || 0,
      change_pct: uso?.change_pct || 0,
      context:    uso ? `USO ${ctx(uso.price, uso.change_pct)}` : "unavailable",
    },
    gold: {
      price:      parseFloat(goldPrice.toFixed(2)),
      change_pct: parseFloat(goldChange.toFixed(3)),
      context:    goldPrice > 0 ? `GLD-implied ${ctx(goldPrice, goldChange)}` : "unavailable",
    },
  }
}
