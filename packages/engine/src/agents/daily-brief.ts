// ─── DAILY BRIEF AGENT ───────────────────────────────────────────────────────
// Ported VERBATIM from the web app's app/api/brief/route.ts. The Polygon market
// data gathering, market-context injection, Claude call (web search, strict JSON
// system prompt, max_uses 10), JSON cleaning, and strike-price correction are all
// preserved exactly. Only the Next.js request/response wrapper is replaced with a
// plain function signature.

import type { Brief, LivePrice } from "../types"
import { buildBriefPrompt } from "../prompts"
import { askModel, resolvePolygonKey } from "../model"
import { MODELS } from "../models"

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

export interface DailyBriefOptions {
  tickers?: string[]
  polygonKey?: string
  /** Pre-market snapshot context prepended to the prompt so the narrative accounts for overnight action. */
  premarketContext?: string | null
  /**
   * Authoritative live prices for the signal-ticker universe (from Polygon, fetched
   * once in the pipeline). Injected as a hard constraint so the brief never quotes a
   * stale training-data price for any of these names.
   */
  livePrices?: Record<string, LivePrice> | null
}

/**
 * Daily Brief agent. Returns the parsed Brief object.
 * Throws on model error (matching the original route's error semantics).
 */
export async function runDailyBrief(opts: DailyBriefOptions): Promise<Brief> {
  const polygonKey = resolvePolygonKey(opts.polygonKey)
  const tickers = opts.tickers ?? []

  // ── Step 1: Pull Polygon market data if key available ──
  let marketContext = ""

  // Hoisted to function scope so Step 4 (strike validation) can reuse them
  let sectorData: MarketSnapshot[] = []
  let mostActive: MarketSnapshot[] = []
  let indexData: MarketSnapshot[] = []
  let movers: { gainers: MarketSnapshot[]; losers: MarketSnapshot[] } = { gainers: [], losers: [] }

  if (polygonKey) {
    try {
      ;[sectorData, movers, mostActive, indexData] = await Promise.all([
        getSnapshots(SECTOR_ETFS, polygonKey),
        getTopMovers(polygonKey),
        getMostActive(polygonKey),
        getSnapshots(INDEX_ETFS, polygonKey),
      ])

      // Format market data as context for Claude
      const formatSnapshot = (s: MarketSnapshot) =>
        `${s.ticker}: $${s.price.toFixed(2)} (${s.change_pct >= 0 ? "+" : ""}${s.change_pct.toFixed(2)}%) vol:${(s.volume / 1_000_000).toFixed(1)}M`

      marketContext = `
═══ LIVE POLYGON MARKET DATA (use these EXACT prices for strike calculations) ═══

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

*** USE THESE PRICES FOR STRIKE CALCULATIONS ***
When suggesting options plays for ANY ticker listed above, use the price shown.
For tickers NOT listed, you MUST search for the current price first.

Example: If the data shows "NVDA: $132.50 (+2.15%)" then NVDA calls should be $130, $135, or $140 - NOT $180 or $200.

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
  const basePrompt = buildBriefPrompt(tickers)
  const withMarket = basePrompt.replace(
    "Use web search to get CURRENT real-time data",
    `Use web search to get CURRENT real-time data\n\n${marketContext}`
  )
  // Authoritative live prices for the signal-ticker universe — injected as a hard
  // constraint so Claude never quotes a stale training-data price for these names.
  let livePriceBlock = ""
  if (opts.livePrices && Object.keys(opts.livePrices).length > 0) {
    const lines = Object.entries(opts.livePrices)
      .filter(([, p]) => p && p.price > 0)
      .map(([ticker, p]) => {
        const sign = p.change_pct >= 0 ? "+" : ""
        return `${ticker}: $${p.price.toFixed(2)} (${sign}${p.change_pct.toFixed(2)}%)`
      })
      .join("\n")
    if (lines) {
      livePriceBlock = `LIVE MARKET DATA (authoritative, do not deviate):
These are ground-truth Polygon prices for the tracked tickers. When you mention any
of these names, use the EXACT price shown here — never a price from your training
data, and never a number from a stale search result.

${lines}
`
    }
  }

  const premarket = opts.premarketContext?.trim()
  const preParts = [livePriceBlock.trim(), premarket].filter(Boolean)
  const fullPrompt = preParts.length > 0 ? `${preParts.join("\n\n")}\n\n${withMarket}` : withMarket

  // ── Step 3: Call the model with strict-JSON system prompt ──
  // gemini gets its market data from the injected Polygon context + the prompt's
  // web-search instruction; extractJSON handles fences/citations/prose trimming.
  const parsed = (await askModel<Record<string, unknown>>(
    MODELS.DAILY_BRIEF,
    "You are a JSON API. You MUST respond with valid JSON only. No prose, no explanations, no markdown. Your entire response must be parseable JSON starting with { and ending with }. Never start with phrases like 'Based on' or 'Here is' - output raw JSON immediately.\n\nCOHERENCE RULE: The Tier 1 plays listed in this brief represent the highest-conviction bullish positions for today. Your narrative MUST align with and support these plays — do not contradict them with bearish commentary, fade signals, or put recommendations for the same tickers. If you see a tension between the Tier 1 plays and broader market conditions, acknowledge the risk briefly but maintain the bullish framing for Tier 1 names.",
    fullPrompt
  )) as Record<string, any>

  // ── Step 4: Validate and fix strike prices using Polygon data ──
  if (parsed.top_plays && Array.isArray(parsed.top_plays) && polygonKey) {
    // Get unique tickers from top plays
    const topPlayTickers = [...new Set(parsed.top_plays.map((p: { ticker: string }) => p.ticker))] as string[]

    // Fetch current prices for these tickers
    const tickerPrices: Record<string, number> = {}

    // First check if we already have prices from the market context
    const allMarketTickers = [...indexData, ...sectorData, ...movers.gainers, ...movers.losers, ...mostActive]
    for (const item of allMarketTickers) {
      if (item.price) {
        tickerPrices[item.ticker] = item.price
      }
    }

    // Authoritative live prices win over the snapshot-derived values above.
    if (opts.livePrices) {
      for (const [ticker, p] of Object.entries(opts.livePrices)) {
        if (p && p.price > 0) tickerPrices[ticker.toUpperCase()] = p.price
      }
    }

    // Fetch any missing prices
    const missingTickers = topPlayTickers.filter(t => !tickerPrices[t])
    if (missingTickers.length > 0) {
      try {
        const pricePromises = missingTickers.map(async (ticker: string) => {
          const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${polygonKey}`
          const res = await fetch(url)
          const data = (await res.json()) as { results?: Array<{ c: number }> }
          if (data.results?.[0]?.c) {
            return { ticker, price: data.results[0].c }
          }
          return null
        })
        const results = await Promise.all(pricePromises)
        for (const r of results) {
          if (r) tickerPrices[r.ticker] = r.price
        }
      } catch (e) {
        console.error("Failed to fetch missing prices:", e)
      }
    }

    // Now validate and fix strike prices
    for (const play of parsed.top_plays) {
      const currentPrice = tickerPrices[play.ticker]
      if (!currentPrice) continue

      // Extract strike from play string (e.g., "Buy $185 calls exp Jun 6")
      const strikeMatch = play.play?.match(/\$(\d+(?:\.\d+)?)\s*(calls?|puts?)/i)
      if (!strikeMatch) continue

      const strike = parseFloat(strikeMatch[1])
      const optionType = strikeMatch[2].toLowerCase()

      // Check if strike is reasonable (within 20% of current price)
      const percentDiff = Math.abs((strike - currentPrice) / currentPrice) * 100

      if (percentDiff > 20) {
        // Strike is too far from current price - fix it
        const roundTo = currentPrice > 100 ? 5 : currentPrice > 50 ? 2.5 : 1
        let newStrike: number

        if (optionType.includes('call')) {
          // For calls, round up to nearest increment
          newStrike = Math.ceil(currentPrice / roundTo) * roundTo
        } else {
          // For puts, round down to nearest increment
          newStrike = Math.floor(currentPrice / roundTo) * roundTo
        }

        // Replace the strike in the play string
        play.play = play.play.replace(/\$\d+(?:\.\d+)?/, `$${newStrike}`)

        // Add a note that we corrected it
        console.log(`Corrected ${play.ticker} strike: $${strike} -> $${newStrike} (current price: $${currentPrice.toFixed(2)})`)
      }
    }
  }

  return parsed as Brief
}
