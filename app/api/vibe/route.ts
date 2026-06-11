import { NextRequest, NextResponse } from "next/server"
import { CLAUDE_MODEL } from "@/lib/ai-config"

const POLYGON_BASE = "https://api.polygon.io"

const SECTOR_ETFS = ["XLK", "XLF", "XLE", "XLV", "XLI", "XLY", "XLP", "XLU", "XLRE", "XLB", "XLC"]
const INDEX_ETFS = ["SPY", "QQQ", "IWM", "DIA"]

async function polygonFetch(endpoint: string, apiKey: string): Promise<unknown> {
  const url = `${POLYGON_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

interface MarketSnapshot {
  ticker: string
  price: number
  change_pct: number
  volume: number
  prev_close: number
}

async function getSnapshots(tickers: string[], apiKey: string): Promise<MarketSnapshot[]> {
  const results: MarketSnapshot[] = []
  const data = (await polygonFetch(`/v2/snapshot/locale/us/markets/stocks/tickers`, apiKey)) as {
    tickers?: Array<{
      ticker: string
      todaysChangePerc: number
      day?: { c: number; v: number }
      prevDay?: { c: number }
      lastTrade?: { p: number }
      lastQuote?: { P: number; p: number }
      min?: { c: number }
    }>
  }

  if (data?.tickers) {
    const tickerSet = new Set(tickers.map((t) => t.toUpperCase()))
    for (const t of data.tickers) {
      if (tickerSet.has(t.ticker)) {
        const livePrice = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
        const prevClose = t.prevDay?.c || 0
        const changePct = prevClose > 0 ? ((livePrice - prevClose) / prevClose) * 100 : t.todaysChangePerc || 0
        results.push({ ticker: t.ticker, price: livePrice, change_pct: changePct, volume: t.day?.v || 0, prev_close: prevClose })
      }
    }
  }
  return results
}

async function getTopMovers(apiKey: string): Promise<{ gainers: MarketSnapshot[]; losers: MarketSnapshot[] }> {
  const [gainersData, losersData] = await Promise.all([
    polygonFetch(`/v2/snapshot/locale/us/markets/stocks/gainers`, apiKey),
    polygonFetch(`/v2/snapshot/locale/us/markets/stocks/losers`, apiKey),
  ])

  const mapTickers = (data: unknown): MarketSnapshot[] => {
    const d = data as {
      tickers?: Array<{
        ticker: string
        todaysChangePerc: number
        day?: { c: number; v: number }
        prevDay?: { c: number }
        lastTrade?: { p: number }
        lastQuote?: { P: number; p: number }
        min?: { c: number }
      }>
    }
    if (!d?.tickers) return []
    return d.tickers.slice(0, 10).map((t) => {
      const livePrice = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
      const prevClose = t.prevDay?.c || 0
      const changePct = prevClose > 0 ? ((livePrice - prevClose) / prevClose) * 100 : t.todaysChangePerc || 0
      return { ticker: t.ticker, price: livePrice, change_pct: changePct, volume: t.day?.v || 0, prev_close: prevClose }
    })
  }

  return { gainers: mapTickers(gainersData), losers: mapTickers(losersData) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tickers = [], apiKey, polygonKey } = body

    if (!apiKey) {
      return NextResponse.json({ error: "Anthropic API key required" }, { status: 400 })
    }

    // ── Step 1: Pull Polygon market data if key available ──
    let marketContext = ""

    if (polygonKey) {
      try {
        const [sectorData, movers, indexData] = await Promise.all([
          getSnapshots(SECTOR_ETFS, polygonKey),
          getTopMovers(polygonKey),
          getSnapshots(INDEX_ETFS, polygonKey),
        ])

        const formatSnapshot = (s: MarketSnapshot) =>
          `${s.ticker}: $${s.price.toFixed(2)} (${s.change_pct >= 0 ? "+" : ""}${s.change_pct.toFixed(2)}%) vol:${(s.volume / 1_000_000).toFixed(1)}M`

        marketContext = `
═══ LIVE POLYGON MARKET DATA (use this as the factual backbone of your vibe read) ═══

INDEX PERFORMANCE:
${indexData.map(formatSnapshot).join("\n")}

SECTOR ETF PERFORMANCE:
${sectorData.map(formatSnapshot).join("\n")}

TODAY'S BIGGEST WINNERS (where the euphoria is):
${movers.gainers.map(formatSnapshot).join("\n")}

TODAY'S BIGGEST LOSERS (where the pain is):
${movers.losers.map(formatSnapshot).join("\n")}

═══ END POLYGON DATA ═══

Use this hard data to anchor the vibe — index breadth, sector heat/cold, and the extremes of the movers tell you the emotional temperature. Cross-reference with web search for WHY and for the social/sentiment layer.
`
      } catch (polyErr) {
        console.error("Polygon data fetch failed, continuing with web search only:", polyErr)
        marketContext = "\nNote: Polygon market data unavailable. Rely on web search for market data.\n"
      }
    } else {
      marketContext = "\nNote: No Polygon API key provided. Rely on web search for market data.\n"
    }

    // ── Step 2: Build prompt with market data injected ──
    const { buildVibePrompt } = await import("@/lib/prompts")
    const basePrompt = buildVibePrompt(tickers)
    const fullPrompt = basePrompt.replace(
      "Use web search for current price action",
      `${marketContext}\n\nUse web search for current price action`
    )

    // ── Step 3: Call Claude with web search, strict JSON ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 5000,
        system:
          "You are a JSON API. You MUST respond with valid JSON only. No prose, no explanations, no markdown. Your entire response must be parseable JSON starting with { and ending with }. Never start with phrases like 'Based on' or 'Here is' - output raw JSON immediately.",
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
        messages: [{ role: "user", content: fullPrompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      if (response.status === 429) {
        return NextResponse.json({ 
          error: "Rate limit reached on your Anthropic API key. Please wait a minute and try again, or upgrade your Anthropic plan for higher limits." 
        }, { status: 429 })
      }
      return NextResponse.json({ error: `Claude API error: ${errText.slice(0, 200)}` }, { status: 500 })
    }

    const result = await response.json()

    let text = ""
    for (const block of result.content || []) {
      if (block.type === "text") text += block.text
    }

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    text = text.replace(/<\/?cite[^>]*>/g, "").replace(/\[\d+\]/g, "")
    const jsonStart = text.indexOf("{")
    if (jsonStart > 0) text = text.slice(jsonStart)
    const jsonEnd = text.lastIndexOf("}")
    if (jsonEnd !== -1 && jsonEnd < text.length - 1) text = text.slice(0, jsonEnd + 1)

    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Vibe check error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Vibe check failed" }, { status: 500 })
  }
}
