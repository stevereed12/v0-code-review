import { NextRequest, NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

// Get Polygon API key from request or env
function getPolygonKey(request: NextRequest): string | null {
  const clientKey = request.nextUrl.searchParams.get("polygonKey")
  return clientKey || process.env.POLYGON_API_KEY || null
}

// Fetch chart data from Polygon
async function fetchFromPolygon(
  symbol: string,
  apiKey: string
): Promise<{ date: string; close: number }[] | null> {
  try {
    // Get 10 days of data to ensure we have 5 trading days
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 10)
    
    const fromStr = from.toISOString().split("T")[0]
    const toStr = to.toISOString().split("T")[0]
    
    const url = `${POLYGON_BASE}/v2/aggs/ticker/${symbol}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${apiKey}`
    
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      console.warn(`Polygon chart failed for ${symbol}: ${res.status}`)
      return null
    }

    const data = await res.json()
    const results = data?.results || []

    if (results.length === 0) return null

    // Take last 5 trading days
    const history = results.slice(-5).map((bar: { t: number; c: number }) => ({
      date: new Date(bar.t).toISOString().split("T")[0],
      close: bar.c,
    }))

    return history
  } catch (err) {
    console.warn(`Polygon chart error for ${symbol}:`, err)
    return null
  }
}

// Fallback to Yahoo
async function fetchFromYahoo(symbol: string): Promise<{ date: string; close: number }[] | null> {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; White80/1.0)",
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const result = data?.chart?.result?.[0]

    if (!result) return null

    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []

    const history = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      close: closes[i],
    })).filter((d: { close: number | null }) => d.close != null)

    return history
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol parameter required" }, { status: 400 })
  }

  const polygonKey = getPolygonKey(request)

  try {
    // Try Polygon first if key available
    let data = null
    let source = "unknown"
    
    if (polygonKey) {
      data = await fetchFromPolygon(symbol.toUpperCase(), polygonKey)
      if (data) source = "polygon"
    }
    
    // Fallback to Yahoo
    if (!data) {
      data = await fetchFromYahoo(symbol.toUpperCase())
      if (data) source = "yahoo"
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No chart data available" }, { status: 404 })
    }

    return NextResponse.json({ data, source })
  } catch (err) {
    console.error("Chart fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
