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
  const now = new Date()
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }))
  
  // Determine if we're in after-hours (after 4pm ET) or pre-market (before 9:30am ET)
  const isAfterHours = etHour >= 16 || etHour < 4 // 4pm-4am ET
  const isPreMarket = etHour >= 4 && etHour < 9 // 4am-9:30am ET
  
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })
  
  // Calculate tomorrow's date
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })
  
  // After hours: brief is for TOMORROW, include today's recap
  if (isAfterHours) {
    return `You are White 80, a professional trading desk briefing system.

CURRENT TIME: ${now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} ET
BRIEF IS FOR: ${tomorrowStr} (tomorrow's session)

The regular session has CLOSED. Generate a comprehensive brief for TOMORROW.

CRITICAL FORMATTING RULES:
- Write in plain English - NO citations, NO "[cite-index]", NO reference markers
- Be specific with numbers: "S&P closed up 0.4% at 5,250" not "indices were higher"
- Name specific stocks when discussing movers
- Include actual percentages, price levels, and data points
- Write like a Bloomberg terminal brief - factual, dense, actionable

Use web search to gather:

TODAY'S SESSION RECAP:
- Exact closing levels and % changes for SPY, QQQ, IWM
- Which sectors led (XLK, XLF, XLE, etc.) and which lagged
- Notable individual stock movers with % changes
- Any after-hours earnings reactions with specific moves

TOMORROW'S SETUP:
- Current futures levels and direction (ES, NQ, RTY)  
- Tomorrow's earnings: list actual tickers reporting BMO/AMC
- Economic calendar: specific times and releases
- Overnight developments from Asia/Europe if notable
- Setup analysis for: ${tickers.join(", ")}

Return JSON only. No markdown, no backticks, no citations:

{
"session_date": "${tomorrowStr}",
"todays_close": "3-4 detailed sentences: SPY closed at X (+Y%), QQQ at X (+Y%). Tech led with semis up Z%, financials lagged. Notable movers: TICKER +X%, TICKER -Y%. After hours: TICKER earnings beat/miss, stock +/-X%.",
"futures": "ES trading at X (+Y pts), NQ at X, indicating [gap up/down/flat] open. Overnight sentiment driven by [specific catalyst].",
"headlines": ["Specific headline with details - not vague summaries", "Another concrete headline", "Third headline with actual news", "Fourth headline"],
"earnings_today": ["AAPL (AMC) - expecting X EPS", "MSFT (BMO) - focus on cloud growth"],
"econ_today": ["8:30 ET - Initial Jobless Claims (est: 220K)", "10:00 ET - Existing Home Sales"],
"watchlist_take": "3-4 sentences analyzing YOUR watchlist tickers specifically. NVDA holding above X support, watching Y level. AAPL consolidating near highs ahead of earnings. META showing relative strength vs QQQ.",
"tone": "RISK-ON"
}

TONE must be exactly one of: RISK-ON, RISK-OFF, NEUTRAL
Base tone on: futures direction, VIX level, sector rotation, and overall sentiment.`
  }
  
  // Pre-market or during regular hours: brief is for TODAY
  return `You are White 80, a professional trading desk briefing system.

CURRENT TIME: ${now.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })} ET
BRIEF IS FOR: ${todayStr} (today's session)

CRITICAL FORMATTING RULES:
- Write in plain English - NO citations, NO "[cite-index]", NO reference markers
- Be specific with numbers: "ES up 12 points to 5,280" not "futures are higher"  
- Name specific stocks and sectors when discussing movers
- Include actual percentages, price levels, and times
- Write like a Bloomberg terminal brief - factual, dense, actionable

Use web search to gather:

PRE-MARKET DATA:
- Current futures levels: ES, NQ, RTY with points and %
- VIX level and direction
- Notable pre-market movers with specific % changes
- Overnight action in Europe/Asia if significant

TODAY'S CATALYSTS:
- Earnings reporting today: actual ticker symbols, BMO vs AMC
- Economic releases: exact times ET and what's expected
- Fed speakers or other scheduled events
- Any breaking news moving markets

WATCHLIST ANALYSIS for: ${tickers.join(", ")}

Return JSON only. No markdown, no backticks, no citations:

{
"session_date": "${todayStr}",
"futures": "ES at 5,280 (+15 pts, +0.3%), NQ +0.4%, RTY flat. VIX at 14.2, down from yesterday. Tone is [bullish/cautious/mixed] ahead of [specific catalyst].",
"headlines": ["Specific headline - Company X beats earnings, guides higher", "Concrete news item with details", "Third headline with actual information", "Fourth headline"],
"earnings_today": ["NVDA (AMC) - AI demand focus, est $5.50 EPS", "WMT (BMO) - consumer spending read"],
"econ_today": ["8:30 ET - CPI m/m (est: +0.2%, prior: +0.3%)", "2:00 ET - FOMC Minutes"],
"watchlist_take": "3-4 sentences on YOUR specific watchlist. AAPL gapping up 1.2% pre-market on supplier news, resistance at $185. NVDA flat ahead of earnings, key level is $900. TSLA weak, testing $170 support after downgrade.",
"tone": "RISK-ON"
}

TONE must be exactly one of: RISK-ON, RISK-OFF, NEUTRAL
Base tone on: futures direction, VIX level, breadth expectations, key catalysts.`
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
