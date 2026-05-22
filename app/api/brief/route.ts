import { NextRequest, NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

// ─── SECTOR ETFS ─────────────────────────────────────────────────────────────
const SECTOR_ETFS = ["XLK", "XLF", "XLE", "XLV", "XLI", "XLY", "XLP", "XLU", "XLRE", "XLB", "XLC"]
const INDEX_ETFS = ["SPY", "QQQ", "IWM", "DIA"]

async function polygonFetch(endpoint: string, apiKey: string): Promise<unknown> {
  const url = `${POLYGON_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

// ─── MARKET DATA GATHERING ───────────────────────────────────────────────────

interface MarketSnapshot {
  ticker: string
  price: number
  change_pct: number
  volume: number
  prev_close: number
}

async function getSnapshots(tickers: string[], apiKey: string): Promise<MarketSnapshot[]> {
  const results: MarketSnapshot[] = []
  
  // Batch fetch via snapshot endpoint
  const data = await polygonFetch(`/v2/snapshot/locale/us/markets/stocks/tickers`, apiKey) as {
    tickers?: Array<{
      ticker: string
      todaysChange: number
      todaysChangePerc: number
      day?: { c: number; v: number; o: number; h: number; l: number }
      prevDay?: { c: number }
      lastTrade?: { p: number; t: number }
      lastQuote?: { P: number; p: number }
      min?: { c: number }
    }>
  }
  
  if (data?.tickers) {
    const tickerSet = new Set(tickers.map(t => t.toUpperCase()))
    for (const t of data.tickers) {
      if (tickerSet.has(t.ticker)) {
        // Priority: lastTrade > lastQuote > min.c > day.c > prevDay.c
        const livePrice = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
        const prevClose = t.prevDay?.c || 0
        const changePct = prevClose > 0 ? ((livePrice - prevClose) / prevClose) * 100 : t.todaysChangePerc || 0
        
        results.push({
          ticker: t.ticker,
          price: livePrice,
          change_pct: changePct,
          volume: t.day?.v || 0,
          prev_close: prevClose,
        })
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
    const d = data as { tickers?: Array<{
      ticker: string; todaysChangePerc: number
      day?: { c: number; v: number }; prevDay?: { c: number }
      lastTrade?: { p: number }; lastQuote?: { P: number; p: number }; min?: { c: number }
    }> }
    if (!d?.tickers) return []
    return d.tickers.slice(0, 10).map(t => {
      const livePrice = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
      const prevClose = t.prevDay?.c || 0
      const changePct = prevClose > 0 ? ((livePrice - prevClose) / prevClose) * 100 : t.todaysChangePerc || 0
      return {
        ticker: t.ticker,
        price: livePrice,
        change_pct: changePct,
        volume: t.day?.v || 0,
        prev_close: prevClose,
      }
    })
  }
  
  return {
    gainers: mapTickers(gainersData),
    losers: mapTickers(losersData),
  }
}

async function getMostActive(apiKey: string): Promise<MarketSnapshot[]> {
  // Use snapshot and sort by volume
  const data = await polygonFetch(`/v2/snapshot/locale/us/markets/stocks/tickers`, apiKey) as {
    tickers?: Array<{
      ticker: string; todaysChangePerc: number
      day?: { c: number; v: number }; prevDay?: { c: number }
      lastTrade?: { p: number }; lastQuote?: { P: number; p: number }; min?: { c: number }
    }>
  }
  
  if (!data?.tickers) return []
  
  return data.tickers
    .filter(t => t.day?.v && t.day.v > 0)
    .sort((a, b) => (b.day?.v || 0) - (a.day?.v || 0))
    .slice(0, 20)
    .map(t => {
      const livePrice = t.lastTrade?.p || t.lastQuote?.P || t.lastQuote?.p || t.min?.c || t.day?.c || t.prevDay?.c || 0
      const prevClose = t.prevDay?.c || 0
      const changePct = prevClose > 0 ? ((livePrice - prevClose) / prevClose) * 100 : t.todaysChangePerc || 0
      return {
        ticker: t.ticker,
        price: livePrice,
        change_pct: changePct,
        volume: t.day?.v || 0,
        prev_close: prevClose,
      }
    })
}

// ─── ROUTE HANDLER ───────────────────────────────────────────────────────────

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
        const [sectorData, movers, mostActive, indexData] = await Promise.all([
          getSnapshots(SECTOR_ETFS, polygonKey),
          getTopMovers(polygonKey),
          getMostActive(polygonKey),
          getSnapshots(INDEX_ETFS, polygonKey),
        ])

        // Format market data as context for Claude
        const formatSnapshot = (s: MarketSnapshot) => 
          `${s.ticker}: $${s.price.toFixed(2)} (${s.change_pct >= 0 ? "+" : ""}${s.change_pct.toFixed(2)}%) vol:${(s.volume / 1_000_000).toFixed(1)}M`

        marketContext = `
═══ LIVE POLYGON MARKET DATA ═══

INDEX PERFORMANCE:
${indexData.map(formatSnapshot).join("\n")}

SECTOR ETF PERFORMANCE:
${sectorData.map(formatSnapshot).join("\n")}

TOP GAINERS (biggest movers up):
${movers.gainers.map(formatSnapshot).join("\n")}

TOP LOSERS (biggest movers down):
${movers.losers.map(formatSnapshot).join("\n")}

MOST ACTIVE BY VOLUME (where the action is):
${mostActive.map(formatSnapshot).join("\n")}

═══ END POLYGON DATA ═══

IMPORTANT FOR TOP PLAYS:
- Use this data as your STARTING POINT for Top Plays, but DO NOT just list the top gainers/losers
- Look for ASYMMETRIC setups: names with unusual volume + a catalyst + favorable technical setup
- Cross-reference with web search for WHY these names are moving
- Your Top Plays use a DIFFERENT LENS than Tier 1: think catalyst-driven, flow-driven, event-driven
- A stock up 8% on no news is NOT a Top Play. A stock up 3% on an FDA approval with calls sweeping IS.
- OVERLAP IS OK: If a ticker appears in both Tier 1 AND your Top Plays, that is CONVERGENCE - two independent methodologies agreeing is a stronger signal, not a duplicate. Do NOT suppress a play just because it might also show up in a technical scan.
`
      } catch (polyErr) {
        console.error("Polygon data fetch failed, continuing with web search only:", polyErr)
        marketContext = "\nNote: Polygon market data unavailable. Rely on web search for market data.\n"
      }
    } else {
      marketContext = "\nNote: No Polygon API key provided. Rely on web search for market data.\n"
    }

    // ── Step 2: Build prompt with market data injected ──
    const { buildBriefPrompt } = await import("@/lib/prompts")
    const basePrompt = buildBriefPrompt(tickers)
    const fullPrompt = basePrompt.replace(
      "Use web search to get CURRENT real-time data",
      `Use web search to get CURRENT real-time data\n\n${marketContext}`
    )

    // ── Step 3: Call Claude with system prompt for strict JSON ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: "You are a JSON API. You MUST respond with valid JSON only. No prose, no explanations, no markdown. Your entire response must be parseable JSON starting with { and ending with }. Never start with phrases like 'Based on' or 'Here is' - output raw JSON immediately.",
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 10 }],
        messages: [{ role: "user", content: fullPrompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `Claude API error: ${errText.slice(0, 200)}` }, { status: 500 })
    }

    const result = await response.json()
    
    // Extract text from response
    let text = ""
    for (const block of result.content || []) {
      if (block.type === "text") text += block.text
    }
    
    // Clean and parse JSON
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    // Strip citation markup
    text = text.replace(/<\/?cite[^>]*>/g, "").replace(/\[\d+\]/g, "")
    // Remove any prose prefix before JSON (e.g., "Based on my search, here is the data:")
    const jsonStart = text.indexOf("{")
    if (jsonStart > 0) {
      text = text.slice(jsonStart)
    }
    // Remove any prose suffix after JSON
    const jsonEnd = text.lastIndexOf("}")
    if (jsonEnd !== -1 && jsonEnd < text.length - 1) {
      text = text.slice(0, jsonEnd + 1)
    }
    
    const parsed = JSON.parse(text)
    
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Brief generation error:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate brief" },
      { status: 500 }
    )
  }
}
