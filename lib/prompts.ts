// ─── CLAUDE PROMPT BUILDERS ─────────────────────────────────────────────────

import type { LivePrice } from "./types"
import { SCOUT_THEMES, CAP_TIERS, HORIZONS } from "./types"

import type { OptionsChainSummary } from "./types"

export function buildSignalPrompt(
  tickers: string[],
  newsContext: string | null = null,
  livePrices: Record<string, LivePrice> | null = null,
  optionsData: Record<string, OptionsChainSummary | null> | null = null
): string {
  const newsBlock = newsContext
    ? `

CRITICAL: The following recent news on these names MUST shape your plays. Don't ignore catalysts:

${newsContext}

If a name has bullish news → plays should lean long unless the price already gapped past your target. If bearish news → consider fades, puts, or skip the trade. If a known catalyst is approaching (earnings, FDA, Fed) → size accordingly and note it in the play.`
    : ""

  let priceBlock = ""
  if (livePrices && Object.keys(livePrices).length > 0) {
    const priceLines = tickers
      .map((t) => {
        const p = livePrices[t]
        if (!p) return `${t}: NO PRICE DATA`
        const pct = p.change_pct?.toFixed(2)
        const sign = p.change >= 0 ? "+" : ""
        const ageMin = p.age_seconds != null ? Math.floor(p.age_seconds / 60) : null
        const ageStr = ageMin != null ? `${ageMin}m ago` : "unknown age"
        return `${t}: $${p.price?.toFixed(2)} (${sign}${pct}% ${p.session}, ${ageStr}, prev close $${p.prev_close?.toFixed(2)}, regular session range $${p.day_low?.toFixed(2)}-$${p.day_high?.toFixed(2)})`
      })
      .join("\n")

    const sample = Object.values(livePrices)[0]
    const marketState = sample?.market_state || "UNKNOWN"
    const stateNote: Record<string, string> = {
      PRE: "PRE-MARKET ACTIVE — prices reflect pre-market trading. Regular session has not opened.",
      REGULAR: "REGULAR SESSION ACTIVE — these are live intraday prices.",
      POST: "POST-MARKET / AFTER-HOURS — prices reflect after-hours trading. Regular session has closed.",
      CLOSED: "MARKET CLOSED — prices are last available (could be after-hours or prior session close).",
      PREPRE: "OVERNIGHT — between post-market and pre-market.",
      POSTPOST: "OVERNIGHT — after post-market session ended.",
    }

    priceBlock = `

=== VERIFIED LIVE PRICES (use THESE, not search results) ===
Market State: ${marketState}
${stateNote[marketState] || `Market state: ${marketState}`}

${priceLines}
============================================================

Use the exact prices above. DO NOT search for prices — these are ground truth from Yahoo Finance.
The "session" tag (PRE/REGULAR/POST/LAST) tells you which session the price is from.
Tailor plays to current market state — e.g., during pre-market, suggest entries at the open or limit orders, not market orders.`
  }

  // Build options data block if available
  let optionsBlock = ""
  if (optionsData && Object.keys(optionsData).length > 0) {
    const optionsLines = tickers.map(t => {
      const opts = optionsData[t]
      if (!opts) return `${t}: No options data available`
      
      const hotCallStrikes = opts.hotStrikes
        .filter(s => s.type === "call")
        .slice(0, 3)
        .map(s => `$${s.strike} (${s.expiration}, vol: ${s.volume})`)
        .join(", ")
      
      const hotPutStrikes = opts.hotStrikes
        .filter(s => s.type === "put")
        .slice(0, 2)
        .map(s => `$${s.strike} (${s.expiration}, vol: ${s.volume})`)
        .join(", ")
      
      return `${t}: C/P ${opts.callPutRatio.toFixed(1)}x | ${opts.sentiment} | ATM skew: ${opts.atmSkew.toFixed(0)}%${opts.unusualActivity ? " | UNUSUAL ACTIVITY" : ""}
    Hot calls: ${hotCallStrikes || "none"}
    Hot puts: ${hotPutStrikes || "none"}
    Summary: ${opts.summary}`
    }).join("\n\n")

    optionsBlock = `

=== LIVE OPTIONS FLOW (from Polygon) ===
Use this data to inform your options plays. Favor strikes with actual volume.

${optionsLines}
========================================

When suggesting options plays:
- PREFER strikes listed in "Hot calls/puts" above — these have real volume
- Use the expiration dates shown — don't guess random Fridays
- If a ticker shows UNUSUAL ACTIVITY or BULLISH sentiment, lean into call plays
- If BEARISH sentiment, consider puts or smaller call positions
- C/P ratio > 2x = bullish flow, < 0.7x = bearish flow`
  }

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })

  return `You are White 80, a daily trading signal engine. 

TODAY IS: ${todayStr}, ${timeStr}

CRITICAL DATE VALIDATION:
- Use web search to verify CURRENT catalyst dates
- If an earnings date or event has ALREADY PASSED, do NOT mention it as upcoming
- Only reference catalysts that are ACTUALLY in the future from today's date
- When in doubt about a date, search to confirm before including it
${priceBlock}${optionsBlock}${newsBlock}

For each ticker (${tickers.join(", ")}), generate a trading signal using the verified prices and options data above. Use web search to:
1. VERIFY that any catalyst dates mentioned are actually in the future
2. Find recent technical setups and options unusual activity
3. Get current thematic context

Return a JSON array. No markdown, no backticks, just raw JSON:

[
{
"ticker": "NVDA",
"price": 123.45,
"change_pct": 1.2,
"signal": "BUY",
"play": "Buy $130 calls exp this Friday",
"thesis": "2-sentence conviction note - only mention FUTURE catalysts, not past ones",
"risk": "Medium",
"catalyst": "Only include if verified as FUTURE date, otherwise use 'none' or 'technical setup'",
"target": 145.00,
"stop": 118.00,
"news_aware": true
}
]

RULES:
- Set news_aware to true ONLY if your play directly factored in a verified recent news item
- Signal must be one of: BUY, SELL, HOLD, WATCH, FADE
- Risk must be one of: Low, Medium, High
- Use the exact price/change_pct from the verified prices above
- DO NOT reference past earnings or events as if they are upcoming
- Return the array for all ${tickers.length} tickers`
}

export function buildBriefPrompt(tickers: string[]): string {
  return `You are White 80's pre-market brief generator. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

Use web search to find:

- Overnight futures action (ES, NQ, RTY)
- Top market-moving news
- Today's earnings calendar
- Today's economic data releases (CPI, jobs, Fed speakers, etc.)
- Quick read on these names: ${tickers.join(", ")}

Return JSON, no markdown, no backticks:

{
"futures": "1-2 sentence read on overnight",
"headlines": ["headline 1", "headline 2", "headline 3"],
"earnings_today": ["TICKER1 (BMO/AMC)", "TICKER2 (BMO/AMC)"],
"econ_today": ["8:30 ET CPI", "2:00 ET FOMC minutes"],
"watchlist_take": "2-3 sentences on what's setting up across the watchlist",
"tone": "RISK-ON | RISK-OFF | NEUTRAL"
}`
}

export function buildNewsPrompt(tickers: string[]): string {
  return `You are White 80's news monitor. Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${new Date().toLocaleTimeString("en-US")}.

Use web search to find the most material news from the last 24 hours on each of these tickers: ${tickers.join(", ")}.

Focus on what actually moves price:

- Earnings, guidance, pre-announcements
- Analyst upgrades/downgrades with price targets
- M&A, partnerships, major contracts
- Regulatory (FDA, FTC, DOJ, SEC)
- Product launches/delays
- Insider buys/sells of size
- Macro events affecting the name (Fed, geopolitical, sector rotations)

Skip filler. If a ticker has no material news, mark it as "quiet."

CRITICAL OUTPUT RULES:

- Respond with ONLY raw JSON. No preamble. No "Based on..." No explanation.
- No markdown code fences. Your entire response must start with [ and end with ].

Schema:
[
{
"ticker": "NVDA",
"items": [
{
"headline": "1-line summary of the news",
"impact": "BULLISH | BEARISH | NEUTRAL",
"magnitude": "HIGH | MEDIUM | LOW",
"source": "publication name",
"age_hours": 6
}
],
"summary": "1 sentence on what the news flow means for this name today, or 'quiet' if nothing material"
}
]

Return one object per ticker, even if items is empty (use empty array and summary 'quiet').`
}

export function buildScoutPrompt(
  themes: string[],
  capTier: keyof typeof CAP_TIERS,
  horizon: keyof typeof HORIZONS,
  excludeTickers: string[] = []
): string {
  const themeLabels = themes.map((id) => SCOUT_THEMES.find((t) => t.id === id)?.label || id).join(", ")
  const tierInfo = CAP_TIERS[capTier]
  const horizonDesc = HORIZONS[horizon]
  const excludeLine = excludeTickers.length > 0 ? `\nEXCLUDE these (already on watchlist): ${excludeTickers.join(", ")}` : ""

  return `You are White 80's Scout — a discovery engine for high-conviction buy-and-hold opportunities outside the mega-cap mainstream.

DISCOVERY PARAMETERS:

- Themes: ${themeLabels}
- Cap tier: ${tierInfo.label} (${tierInfo.range}) — ${tierInfo.desc}
- Holding horizon: ${horizon} — ${horizonDesc}${excludeLine}

Your job: Use web search to find 5-8 lesser-known names that fit. NOT MAG7 / NOT mega-caps unless they have a small-cap-like setup. Look for:

- Real growth stories with verifiable revenue/customer traction
- Catalysts in the holding window (product launches, contracts, secular tailwinds, M&A optionality)
- Asymmetric upside (10x potential) with manageable downside
- Names retail isn't pumping yet OR names that have pulled back hard from highs but thesis is intact

AVOID:

- Pump-and-dump meme stocks
- Pre-revenue biotechs without near-term catalysts
- Reverse-merger SPACs with no real business
- Any name without verifiable revenue or strong audited financials

CRITICAL OUTPUT RULES:

- Respond with ONLY raw JSON. No preamble. No "Based on..." No explanation.
- No markdown code fences. Your entire response must start with [ and end with ].

Schema:
[
{
"ticker": "TICKER",
"name": "Company Name",
"market_cap": "$1.2B",
"sector": "AI Infrastructure",
"thesis": "2-3 sentence buy-and-hold thesis explaining the asymmetric setup",
"catalyst": "What's coming in the holding window that drives the thesis",
"upside_target": "Expected upside (e.g., '3-5x in 12mo')",
"downside_risk": "What kills the thesis",
"conviction": "HIGH | MEDIUM | SPECULATIVE",
"entry_strategy": "How to build the position (lump sum, DCA over X weeks, wait for pullback to $X)",
"why_now": "1 sentence on why this name surfaces NOW vs 3 months ago"
}
]

Conviction must be one of: HIGH, MEDIUM, SPECULATIVE.
Return 5-8 names, sorted by conviction (highest first).`
}

export function buildCuratorPrompt(currentList: string[]): string {
  return `You are White 80's watchlist curator. Maintain a dynamic, fluid watchlist of 8-15 tickers that earn attention based on what's actually setting up in the market right now.

Current watchlist: ${currentList.join(", ")}

Thematic gravity wells (names should pull toward these):

- AI / Compute infrastructure
- Semis
- Crypto-adjacent equities (MSTR, COIN, HOOD-style)
- Macro proxies (SPY, QQQ, IWM)

Use web search to identify:

1. Which current names are LOSING relevance (no news, sideways action, no setup) — candidates to demote
2. Which non-watchlist names are GAINING relevance (breakouts, news, flow, thematic fit) — candidates to promote
3. Final curated watchlist for today (8-15 tickers, prioritized)

CRITICAL OUTPUT RULES:

- Respond with ONLY raw JSON. No preamble. No "Based on..." No explanation before or after.
- No markdown code fences. No backticks.
- Your entire response must start with { and end with }.

Schema:
{
"promote": [
{"ticker": "TICKER", "reason": "1 sentence why this earned attention", "theme": "ai_compute"}
],
"demote": [
{"ticker": "TICKER", "reason": "1 sentence why this lost attention"}
],
"active_watchlist": ["TICKER1", "TICKER2"],
"summary": "2-3 sentences on the overall character of today's watchlist and why",
"regime": "TRENDING"
}

Theme must be one of: ai_compute, semis, crypto_adj, macro_proxy, other
Regime must be one of: TRENDING, CHOPPY, ROTATIONAL, RISK-OFF`
}
