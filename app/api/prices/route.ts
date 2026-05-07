import { NextRequest, NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

// Get Polygon API key from request or env
function getPolygonKey(request: NextRequest): string | null {
  const clientKey = request.nextUrl.searchParams.get("polygonKey")
  return clientKey || process.env.POLYGON_API_KEY || null
}

// Fetch price from Polygon
async function fetchFromPolygon(
  symbol: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  try {
    // Get previous day's data for accurate prev_close
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Snapshot endpoint gives us the latest price + prev day data
    const snapshotUrl = `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${apiKey}`
    
    const res = await fetch(snapshotUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store", // Always fetch fresh prices
    })

    if (!res.ok) {
      console.warn(`Polygon snapshot failed for ${symbol}: ${res.status}`)
      return null
    }

    const data = await res.json()
    const ticker = data?.ticker

    if (!ticker) return null

    const day = ticker.day || {}
    const prevDay = ticker.prevDay || {}
    const lastQuote = ticker.lastQuote || {}
    const lastTrade = ticker.lastTrade || {}
    
    // Determine current price and session
    const price = lastTrade.p || day.c || prevDay.c
    const prevClose = prevDay.c || day.o
    const change = price - prevClose
    const changePct = prevClose ? (change / prevClose) * 100 : 0
    
    // Determine market state based on timestamp
    const now = new Date()
    const hour = now.getUTCHours() - 5 // EST offset (approximate)
    let marketState = "CLOSED"
    let session = "LAST"
    
    if (hour >= 4 && hour < 9.5) {
      marketState = "PRE"
      session = "PRE"
    } else if (hour >= 9.5 && hour < 16) {
      marketState = "REGULAR"
      session = "REGULAR"
    } else if (hour >= 16 && hour < 20) {
      marketState = "POST"
      session = "POST"
    }

    const ts = lastTrade.t ? Math.floor(lastTrade.t / 1000000000) : Math.floor(Date.now() / 1000)
    const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000 - ts))

    return {
      price,
      change,
      change_pct: changePct,
      prev_close: prevClose,
      day_high: day.h || prevDay.h,
      day_low: day.l || prevDay.l,
      volume: day.v || 0,
      market_state: marketState,
      session,
      ts,
      age_seconds: ageSeconds,
      name: symbol,
      source: "polygon",
      bid: lastQuote.p,
      ask: lastQuote.P,
    }
  } catch (err) {
    console.warn(`Polygon error for ${symbol}:`, err)
    return null
  }
}

// Fallback to Yahoo if Polygon unavailable
async function fetchFromYahoo(symbol: string): Promise<Record<string, unknown> | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=true`
  
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store", // Always fetch fresh prices
    })

    if (!res.ok) return null

    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    const timestamps = result.timestamp || []
    
    const lastIdx = timestamps.length - 1
    const lastTs = timestamps[lastIdx] || meta.regularMarketTime
    
    const marketState = meta.marketState || "CLOSED"
    let price = meta.regularMarketPrice
    let change = 0
    let changePct = 0
    let session = "REGULAR"
    
    const prevClose = meta.previousClose || meta.chartPreviousClose
    
    if (meta.postMarketPrice && (marketState === "POST" || marketState === "POSTPOST" || marketState === "CLOSED")) {
      price = meta.postMarketPrice
      change = meta.postMarketChange || (price - prevClose)
      changePct = meta.postMarketChangePercent || ((change / prevClose) * 100)
      session = "POST"
    } else if (meta.preMarketPrice && (marketState === "PRE" || marketState === "PREPRE")) {
      price = meta.preMarketPrice
      change = meta.preMarketChange || (price - prevClose)
      changePct = meta.preMarketChangePercent || ((change / prevClose) * 100)
      session = "PRE"
    } else {
      price = meta.regularMarketPrice
      change = (price || 0) - (prevClose || 0)
      changePct = prevClose ? (change / prevClose) * 100 : 0
      session = marketState === "REGULAR" ? "REGULAR" : "LAST"
    }

    const dayHigh = quote?.high ? Math.max(...quote.high.filter((v: number | null) => v !== null)) : meta.regularMarketDayHigh
    const dayLow = quote?.low ? Math.min(...quote.low.filter((v: number | null) => v !== null && v > 0)) : meta.regularMarketDayLow

    const ageSeconds = lastTs > 0 ? Math.max(0, Math.floor(Date.now() / 1000 - lastTs)) : null

    return {
      price: price ?? prevClose,
      change,
      change_pct: changePct,
      prev_close: prevClose,
      day_high: dayHigh,
      day_low: dayLow,
      volume: meta.regularMarketVolume,
      market_state: marketState,
      session,
      ts: lastTs,
      age_seconds: ageSeconds,
      name: meta.shortName || meta.longName || symbol,
      source: "yahoo",
    }
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get("symbols")

  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 })
  }

  const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase())
  const polygonKey = getPolygonKey(request)
  
  try {
    // Fetch all symbols in parallel
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        // Try Polygon first if key available, then fallback to Yahoo
        let data = null
        if (polygonKey) {
          data = await fetchFromPolygon(symbol, polygonKey)
        }
        if (!data) {
          data = await fetchFromYahoo(symbol)
        }
        return { symbol, data }
      })
    )

    const map: Record<string, unknown> = {}
    let successCount = 0
    let polygonCount = 0
    let yahooCount = 0
    
    for (const { symbol, data } of results) {
      if (data) {
        map[symbol] = data
        successCount++
        if ((data as { source?: string }).source === "polygon") polygonCount++
        else yahooCount++
      }
    }

    if (successCount === 0) {
      return NextResponse.json({ error: "No price data available" }, { status: 404 })
    }

    return NextResponse.json({ 
      data: map,
      meta: {
        total: successCount,
        polygon: polygonCount,
        yahoo: yahooCount,
      }
    })
  } catch (err) {
    console.error("Price fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
