import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get("symbols")

  if (!symbols) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 })
  }

  const fields =
    "regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketTime,marketState,shortName,longName,preMarketPrice,preMarketChange,preMarketChangePercent,preMarketTime,postMarketPrice,postMarketChange,postMarketChangePercent,postMarketTime"

  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=${fields}`

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; White80/1.0)",
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    })

    if (!res.ok) {
      throw new Error(`Yahoo API returned ${res.status}`)
    }

    const data = await res.json()
    const quotes = data?.quoteResponse?.result || []

    if (quotes.length === 0) {
      return NextResponse.json({ error: "No quotes returned" }, { status: 404 })
    }

    const map: Record<string, unknown> = {}
    for (const q of quotes) {
      const state = q.marketState
      const reg = q.regularMarketTime || 0
      const pre = q.preMarketTime || 0
      const post = q.postMarketTime || 0

      let price, change, changePct, session, ts

      if (post > 0 && post >= reg && post >= pre && q.postMarketPrice != null) {
        price = q.postMarketPrice
        change = q.postMarketChange
        changePct = q.postMarketChangePercent
        session = "POST"
        ts = post
      } else if (pre > 0 && pre >= reg && q.preMarketPrice != null) {
        price = q.preMarketPrice
        change = q.preMarketChange
        changePct = q.preMarketChangePercent
        session = "PRE"
        ts = pre
      } else if (q.regularMarketPrice != null) {
        price = q.regularMarketPrice
        change = q.regularMarketChange
        changePct = q.regularMarketChangePercent
        session = state === "REGULAR" ? "REGULAR" : "LAST"
        ts = reg
      } else {
        price = q.regularMarketPreviousClose
        change = 0
        changePct = 0
        session = "PREV_CLOSE"
        ts = reg
      }

      const ageSeconds = ts > 0 ? Math.max(0, Math.floor(Date.now() / 1000 - ts)) : null

      map[q.symbol] = {
        price,
        change,
        change_pct: changePct,
        prev_close: q.regularMarketPreviousClose,
        day_high: q.regularMarketDayHigh,
        day_low: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        market_state: state,
        session,
        ts,
        age_seconds: ageSeconds,
        name: q.shortName || q.longName,
      }
    }

    return NextResponse.json({ data: map })
  } catch (err) {
    console.error("Price fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
