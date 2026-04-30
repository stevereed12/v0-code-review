import { NextRequest, NextResponse } from "next/server"

// Use the chart API (v8) which is more reliable than quote API (v7)
// Fetch each symbol individually and extract latest price
async function fetchPriceFromChart(symbol: string): Promise<Record<string, unknown> | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d&includePrePost=true`
  
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 30 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null

    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    const timestamps = result.timestamp || []
    
    // Get the most recent data point
    const lastIdx = timestamps.length - 1
    const lastTs = timestamps[lastIdx] || meta.regularMarketTime
    
    // Determine which price to use based on market state
    const marketState = meta.marketState || "CLOSED"
    let price = meta.regularMarketPrice
    let change = 0
    let changePct = 0
    let session = "REGULAR"
    
    const prevClose = meta.previousClose || meta.chartPreviousClose
    
    // Use post-market price if available and market is closed/post
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

    // Get day high/low from quote data
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
  
  try {
    // Fetch all symbols in parallel using the chart API
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const data = await fetchPriceFromChart(symbol)
        return { symbol, data }
      })
    )

    const map: Record<string, unknown> = {}
    let successCount = 0
    
    for (const { symbol, data } of results) {
      if (data) {
        map[symbol] = data
        successCount++
      }
    }

    if (successCount === 0) {
      return NextResponse.json({ error: "No price data available" }, { status: 404 })
    }

    return NextResponse.json({ data: map })
  } catch (err) {
    console.error("Price fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
