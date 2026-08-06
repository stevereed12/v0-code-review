import { NextRequest, NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

// Get Polygon API key from request or env
function getPolygonKey(request: NextRequest): string | null {
  const clientKey = request.nextUrl.searchParams.get("polygonKey")
  return clientKey || process.env.POLYGON_API_KEY || null
}

// Determine US market state using real Eastern Time (handles DST correctly)
function getMarketState(): { marketState: string; session: string } {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
  const weekday = get("weekday")
  const hour = parseInt(get("hour"), 10)
  const minute = parseInt(get("minute"), 10)
  const minutes = hour * 60 + minute

  // Weekend = closed
  if (weekday === "Sat" || weekday === "Sun") {
    return { marketState: "CLOSED", session: "LAST" }
  }

  // 4:00 (240) pre | 9:30 (570) regular | 16:00 (960) post | 20:00 (1200) closed
  if (minutes >= 240 && minutes < 570) return { marketState: "PRE", session: "PRE" }
  if (minutes >= 570 && minutes < 960) return { marketState: "REGULAR", session: "REGULAR" }
  if (minutes >= 960 && minutes < 1200) return { marketState: "POST", session: "POST" }
  return { marketState: "CLOSED", session: "LAST" }
}

// Fetch price from Polygon
async function fetchFromPolygon(
  symbol: string,
  apiKey: string
): Promise<Record<string, unknown> | null> {
  try {
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
    const min = ticker.min || {}

    // Freshest-first price cascade: last trade > quote midpoint/ask > latest
    // minute bar > daily aggregate > previous close. Free-tier snapshots often
    // omit lastTrade/lastQuote, so min.c is the freshest available there.
    const quoteMid = lastQuote.P && lastQuote.p ? (lastQuote.P + lastQuote.p) / 2 : lastQuote.P || lastQuote.p
    const price = lastTrade.p || quoteMid || min.c || day.c || prevDay.c
    const prevClose = prevDay.c || day.o
    const change = price - prevClose
    const changePct = prevClose ? (change / prevClose) * 100 : 0

    // Real Eastern Time market state (DST-safe)
    const { marketState, session } = getMarketState()

    // Best available data timestamp: lastTrade.t (ns) > lastQuote.t (ns) > min.t (ms)
    let ts: number
    if (lastTrade.t) ts = Math.floor(lastTrade.t / 1_000_000_000)
    else if (lastQuote.t) ts = Math.floor(lastQuote.t / 1_000_000_000)
    else if (min.t) ts = Math.floor(min.t / 1000)
    else ts = 0
    const ageSeconds = ts > 0 ? Math.max(0, Math.floor(Date.now() / 1000 - ts)) : null

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
    // Max acceptable data age during live sessions before cross-checking Yahoo.
    // Polygon free tier is 15-min delayed; anything older means we got a stale
    // aggregate (e.g. yesterday's close) instead of a live-ish quote.
    const STALE_THRESHOLD_SECONDS = 20 * 60
    const { marketState } = getMarketState()
    const isLiveSession = marketState === "PRE" || marketState === "REGULAR" || marketState === "POST"

    // Fetch all symbols in parallel
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        // Try Polygon first if key available, then fallback to Yahoo
        let data: Record<string, unknown> | null = null
        if (polygonKey) {
          data = await fetchFromPolygon(symbol, polygonKey)
        }
        if (!data) {
          data = await fetchFromYahoo(symbol)
        } else if (isLiveSession) {
          // Freshness cross-check: if Polygon data is stale (or has no
          // timestamp) during a live session, compare against Yahoo and keep
          // whichever quote is fresher.
          const age = data.age_seconds as number | null
          if (age === null || age > STALE_THRESHOLD_SECONDS) {
            const yahoo = await fetchFromYahoo(symbol)
            const yahooAge = yahoo?.age_seconds as number | null | undefined
            if (yahoo && typeof yahooAge === "number" && (age === null || yahooAge < age)) {
              data = yahoo
            }
          }
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
