import { NextRequest, NextResponse } from "next/server"

// ─── POLYGON API HELPER ──────────────────────────────────────────────────────

const POLYGON_BASE = "https://api.polygon.io"

function getApiKey(): string | null {
  return process.env.POLYGON_API_KEY || null
}

async function polygonFetch(endpoint: string): Promise<unknown> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error("POLYGON_API_KEY not configured")
  
  const url = `${POLYGON_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 60 } })
  
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Polygon API error ${res.status}: ${text.slice(0, 200)}`)
  }
  
  return res.json()
}

// ─── GET QUOTE ───────────────────────────────────────────────────────────────

async function getQuote(ticker: string) {
  const data = await polygonFetch(`/v2/aggs/ticker/${ticker}/prev`) as {
    results?: Array<{ c: number; o: number; h: number; l: number; v: number; vw: number }>
  }
  
  const result = data.results?.[0]
  if (!result) return null
  
  return {
    ticker,
    close: result.c,
    open: result.o,
    high: result.h,
    low: result.l,
    volume: result.v,
    vwap: result.vw,
  }
}

// ─── GET DAILY BARS (for technicals) ─────────────────────────────────────────

async function getDailyBars(ticker: string, days = 50) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days - 10) // Extra buffer for weekends
  
  const fromStr = from.toISOString().split("T")[0]
  const toStr = to.toISOString().split("T")[0]
  
  const data = await polygonFetch(
    `/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc`
  ) as { results?: Array<{ c: number; v: number; h: number; l: number; t: number }> }
  
  return data.results || []
}

// ─── GET TICKER DETAILS ──────────────────────────────────────────────────────

async function getTickerDetails(ticker: string) {
  const data = await polygonFetch(`/v3/reference/tickers/${ticker}`) as {
    results?: { name: string; sic_description?: string; market_cap?: number }
  }
  return data.results || null
}

// ─── CALCULATE TECHNICALS ────────────────────────────────────────────────────

function calculateTechnicals(bars: Array<{ c: number; v: number; h: number; l: number }>) {
  if (bars.length < 20) return null
  
  const closes = bars.map(b => b.c)
  const volumes = bars.map(b => b.v)
  const highs = bars.map(b => b.h)
  const lows = bars.map(b => b.l)
  
  // SMA calculations
  const sma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const sma50 = closes.length >= 50 
    ? closes.slice(-50).reduce((a, b) => a + b, 0) / 50 
    : sma20
  
  // ATR (14-day)
  const atrPeriod = Math.min(14, bars.length - 1)
  let atrSum = 0
  for (let i = bars.length - atrPeriod; i < bars.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    )
    atrSum += tr
  }
  const atr14 = atrSum / atrPeriod
  
  // Volume analysis
  const avgVolume20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const currentVolume = volumes[volumes.length - 1]
  const volumeRatio = currentVolume / avgVolume20
  
  // Price vs SMA
  const currentPrice = closes[closes.length - 1]
  const priceVsSma20 = ((currentPrice - sma20) / sma20) * 100
  
  // Consolidation score (tighter range = higher score)
  // Look at last 10 days range vs ATR
  const recent10Highs = highs.slice(-10)
  const recent10Lows = lows.slice(-10)
  const rangeHigh = Math.max(...recent10Highs)
  const rangeLow = Math.min(...recent10Lows)
  const rangePercent = ((rangeHigh - rangeLow) / currentPrice) * 100
  // Lower range = higher consolidation score
  const consolidationScore = Math.max(0, Math.min(100, 100 - (rangePercent * 10)))
  
  return {
    sma20,
    sma50,
    atr14,
    avgVolume20,
    currentVolume,
    volumeRatio,
    priceVsSma20,
    consolidationScore,
    currentPrice,
  }
}

// ─── GET OPTIONS FLOW ────────────────────────────────────────────────────────

async function getOptionsFlow(ticker: string) {
  try {
    // Get options contracts
    const data = await polygonFetch(
      `/v3/reference/options/contracts?underlying_ticker=${ticker}&expired=false&limit=100`
    ) as { results?: Array<{ contract_type: string; expiration_date: string; open_interest: number }> }
    
    const contracts = data.results || []
    
    let totalCalls = 0
    let totalPuts = 0
    let nearTermCalls = 0
    
    const now = new Date()
    const in21Days = new Date()
    in21Days.setDate(now.getDate() + 21)
    
    for (const contract of contracts) {
      const expDate = new Date(contract.expiration_date)
      const oi = contract.open_interest || 0
      
      if (contract.contract_type === "call") {
        totalCalls += oi
        if (expDate <= in21Days && expDate >= now) {
          nearTermCalls += oi
        }
      } else {
        totalPuts += oi
      }
    }
    
    const callPutRatio = totalPuts > 0 ? totalCalls / totalPuts : totalCalls > 0 ? 10 : 1
    
    return {
      ticker,
      totalCallVolume: totalCalls,
      totalPutVolume: totalPuts,
      callPutRatio,
      unusualActivity: callPutRatio > 2,
      nearTermCalls,
    }
  } catch {
    // Options data might not be available for all tickers
    return null
  }
}

// ─── API ROUTES ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const ticker = searchParams.get("ticker")
  
  if (!getApiKey()) {
    return NextResponse.json({ error: "POLYGON_API_KEY not configured" }, { status: 500 })
  }
  
  try {
    switch (action) {
      case "quote": {
        if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })
        const quote = await getQuote(ticker)
        return NextResponse.json({ data: quote })
      }
      
      case "technicals": {
        if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })
        const bars = await getDailyBars(ticker, 50)
        const technicals = calculateTechnicals(bars)
        return NextResponse.json({ data: technicals })
      }
      
      case "options": {
        if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })
        const flow = await getOptionsFlow(ticker)
        return NextResponse.json({ data: flow })
      }
      
      case "details": {
        if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })
        const details = await getTickerDetails(ticker)
        return NextResponse.json({ data: details })
      }
      
      case "bars": {
        if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })
        const days = parseInt(searchParams.get("days") || "50")
        const bars = await getDailyBars(ticker, days)
        return NextResponse.json({ data: bars })
      }
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (err) {
    console.error("Polygon API error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
