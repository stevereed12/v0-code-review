import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol parameter required" }, { status: 400 })
  }

  // Get 5 days of 1-day interval data for sparkline
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; White80/1.0)",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!res.ok) {
      throw new Error(`Yahoo API returned ${res.status}`)
    }

    const data = await res.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return NextResponse.json({ error: "No chart data returned" }, { status: 404 })
    }

    const timestamps = result.timestamp || []
    const closes = result.indicators?.quote?.[0]?.close || []

    const history = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString().split("T")[0],
      close: closes[i],
    })).filter((d: { close: number | null }) => d.close != null)

    return NextResponse.json({ data: history })
  } catch (err) {
    console.error("Chart fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
