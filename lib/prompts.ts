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

  const now = new Date()
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })

  // Calculate valid options expiration dates (Fridays)
  const getNextFridays = (count: number): string[] => {
    const fridays: string[] = []
    const d = new Date(now)
    // Move to next day to avoid suggesting today if it's Friday afternoon
    d.setDate(d.getDate() + 1)
    while (fridays.length < count) {
      if (d.getDay() === 5) { // Friday
        fridays.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
      }
      d.setDate(d.getDate() + 1)
    }
    return fridays
  }
  
  // Get 3rd Friday of next 2 months for monthly expirations
  const getMonthlyExpirations = (): string[] => {
    const monthlies: string[] = []
    for (let m = 0; m < 2; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1)
      let fridayCount = 0
      while (fridayCount < 3) {
        if (d.getDay() === 5) fridayCount++
        if (fridayCount < 3) d.setDate(d.getDate() + 1)
      }
      if (d > now) {
        monthlies.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
      }
    }
    return monthlies
  }
  
  const weeklyExps = getNextFridays(4) // Next 4 Fridays
  const monthlyExps = getMonthlyExpirations()

  return `You are White 80, a daily trading signal engine. 

TODAY IS: ${todayStr}, ${timeStr}

VALID OPTIONS EXPIRATION DATES (use ONLY these):
Weekly: ${weeklyExps.join(", ")}
Monthly (3rd Friday): ${monthlyExps.join(", ")}

CRITICAL RULES:
- ONLY use expiration dates from the list above - these are real market dates
- EARNINGS DATES: You MUST web search "[TICKER] earnings date" for EACH ticker and use the EXACT date from official sources (Yahoo Finance, Nasdaq, company IR page). Do NOT guess or use stale data.
- If you cannot verify an earnings date with high confidence, write "earnings date unconfirmed" 
- If an earnings date or event has ALREADY PASSED, do NOT mention it as upcoming
${priceBlock}${optionsBlock}${newsBlock}

For each ticker (${tickers.join(", ")}), generate a trading signal. You MUST:
1. Web search "[TICKER] earnings date 2026" to get the EXACT confirmed earnings date
2. Web search for recent news, technical setups, and options activity
3. Cross-reference any catalyst dates against today's date (${todayStr})
4. If a date cannot be verified, do NOT include it - say "technical setup" instead

OUTPUT FORMATTING - EXTREMELY IMPORTANT:
- Return ONLY clean JSON array - no markdown, no backticks
- NO citation markup - no <cite>, </cite>, [cite], cite index, or reference markers
- NO [1], [2], [3] or any superscript/bracket references
- Write plain English only - strip ALL formatting artifacts from search results

Return a JSON array:

[
{
"ticker": "NVDA",
"price": 123.45,
"change_pct": 1.2,
"signal": "BUY",
"play": "Buy $130 calls exp ${weeklyExps[0]}",
"thesis": "2-sentence conviction note - only mention VERIFIED future catalysts",
"risk": "Medium",
"catalyst": "ONLY include earnings/events you verified via web search with exact date. If unverified, use 'technical setup' or 'sector momentum'",
"target": 145.00,
"stop": 118.00,
"news_aware": true
}
]

RULES:
- EXPIRATION DATES must be from the valid list above (${weeklyExps.join(", ")}, ${monthlyExps.join(", ")})
- Signal must be one of: BUY, SELL, HOLD, WATCH, FADE
- Risk must be one of: Low, Medium, High
- Use the exact price/change_pct from the verified prices above
- Set news_aware to true ONLY if your play directly factored in a verified recent news item
- DO NOT reference past earnings or events as if they are upcoming
- Return the array for all ${tickers.length} tickers`
}

export function buildBriefPrompt(tickers: string[]): string {
  const now = new Date()
  const etHour = parseInt(now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }))
  
  // Determine if we're in after-hours (after 4pm ET) or pre-market (before 9:30am ET)
  const isAfterHours = etHour >= 16 || etHour < 4 // 4pm-4am ET
  
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
  
  // Calculate tomorrow's date
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
  
  const sessionDate = isAfterHours ? tomorrowStr : todayStr
  const sessionLabel = isAfterHours ? "Post-Close" : "Pre-Open"

  return `You are White 80, a professional trading desk briefing system.

CURRENT TIME: ${now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET
GENERATING BRIEF FOR: ${sessionDate} | ${sessionLabel}

CRITICAL RULES:
- Be specific with exact numbers, prices, and percentages
- Write dense, factual prose like a Bloomberg terminal brief
- Use web search to get CURRENT real-time data

OUTPUT FORMATTING - EXTREMELY IMPORTANT:
- Return ONLY clean JSON - no markdown, no backticks
- NO citation markup of any kind: no <cite>, no </cite>, no [cite], no cite index
- NO reference markers like [1], [2], [3], (1), (2), or superscripts
- Write plain English text only - you MUST strip ALL formatting artifacts from your search results before outputting
- Every text field must be clean readable prose with zero markup

Use web search to gather ALL of the following:

MACRO PULSE DATA (get exact current levels):
- SPY: current/pre-market price and % change from prior close
- QQQ: current/pre-market price and % change
- VIX: current level and direction
- DXY (Dollar Index): current level
- 10Y Treasury yield: current level
- WTI Crude: current price and % change
- Gold spot: current price

TOP CATALYSTS (the 2-4 biggest stories moving markets):
- What is THE dominant narrative right now?
- Major earnings that reported/are reporting
- Economic data releases with times
- Geopolitical or Fed-related developments

SECTOR ROTATION:
- Which sectors are LEADING and by how much
- Which sectors are LAGGING and why
- Notable individual stock movers with % changes

WHITE 80 TOP PLAYS (5-10 highest conviction setups across the ENTIRE market):
- Search for unusual options activity, technical breakouts, earnings setups, and catalyst-driven plays
- These should NOT be limited to the user's watchlist - scan the whole market
- Each play needs: ticker, direction (BUY/SELL/FADE), specific options play with valid expiration, conviction level, catalyst, and 1-sentence thesis
- Prioritize: unusual options volume, earnings gap setups, technical breakouts at key levels, sector momentum leaders
- Be specific: "$185 calls exp May 23" not "calls"
- Only include plays where the risk/reward is clearly asymmetric

VERDICT:
- Overall market stance: RISK-ON, RISK-OFF, or NEUTRAL
- 2-3 sentence explanation of WHY and what to watch

Return JSON only. No markdown, no backticks, no citations:

{
  "session_date": "${sessionDate}",
  "session_label": "${sessionLabel}",
  "macro_pulse": {
    "spy": { "price": 525.50, "change_pct": 0.45, "context": "closing Wednesday at $523.15" },
    "qqq": { "price": 445.20, "change_pct": 0.62, "context": "off Wednesday close" },
    "vix": { "level": 14.25, "direction": "down", "context": "trending lower as risk appetite returns" },
    "dxy": { "level": 104.25, "context": "flat on session" },
    "ten_year": { "yield": 4.35, "context": "holding steady, not climbing" },
    "wti": { "price": 78.50, "change_pct": -2.1, "context": "down on supply news" },
    "gold": { "price": 2350, "context": "catching bid on geopolitical uncertainty" }
  },
  "catalysts": [
    {
      "title": "FED MINUTES RELEASE",
      "body": "2-4 sentences explaining this catalyst, what happened or is expected, and market reaction. Be specific with numbers and names."
    },
    {
      "title": "NVDA EARNINGS BEAT",
      "body": "Detailed explanation of the catalyst..."
    }
  ],
  "sector_rotation": {
    "leading": [
      { "sector": "Technology", "change_pct": 1.8, "detail": "Semis leading with NVDA +4%, AMD +3%" },
      { "sector": "Consumer Discretionary", "change_pct": 1.2, "detail": "AMZN, TSLA strength" }
    ],
    "lagging": [
      { "sector": "Energy", "change_pct": -2.1, "detail": "Crude weakness dragging XOM, CVX" },
      { "sector": "Utilities", "change_pct": -0.5, "detail": "Rate-sensitive names under pressure" }
    ]
  },
  "verdict": {
    "tone": "RISK-ON",
    "summary": "2-3 sentences explaining the overall market stance. What's driving sentiment, what's the path of least resistance, what could change the picture. Be specific and actionable."
  },
  "top_plays": [
    {
      "ticker": "NVDA",
      "action": "BUY",
      "play": "Buy $135 calls exp May 23",
      "conviction": "HIGH",
      "catalyst": "Earnings momentum + AI capex cycle",
      "thesis": "One sentence on why this is the play right now"
    },
    {
      "ticker": "COIN",
      "action": "FADE",
      "play": "Buy $220 puts exp May 23",
      "conviction": "MEDIUM",
      "catalyst": "Crypto rotation fading",
      "thesis": "One sentence thesis"
    }
  ],
  "watchlist_tickers": ${JSON.stringify(tickers)}
}

IMPORTANT: 
- "tone" must be exactly: "RISK-ON", "RISK-OFF", or "NEUTRAL"
- All prices and percentages must be real numbers from your search, not placeholders
- Catalysts should be the ACTUAL major stories moving markets today, not generic examples`
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

// ─── QUICK THESIS ─────────────────────────────────────────────────────────────

export interface QuickThesis {
  ticker: string
  name: string
  price: number
  sector: string
  market_cap: string
  thesis: string
  bull_case: string
  bear_case: string
  catalysts: Array<{ event: string; date: string; impact: "HIGH" | "MEDIUM" | "LOW" }>
  technicals: {
    trend: "UPTREND" | "DOWNTREND" | "SIDEWAYS"
    support: number
    resistance: number
    rsi_read: string
  }
  options_take: {
    sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"
    suggested_play: string
    reasoning: string
  }
  verdict: {
    action: "BUY" | "SELL" | "HOLD" | "WATCH" | "AVOID"
    conviction: "HIGH" | "MEDIUM" | "LOW"
    timeframe: string
    summary: string
  }
}

export function buildQuickThesisPrompt(ticker: string, currentPrice?: number): string {
  const now = new Date()
  const todayStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  // Calculate valid expiration dates
  const getNextFridays = (count: number): string[] => {
    const fridays: string[] = []
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    while (fridays.length < count) {
      if (d.getDay() === 5) {
        fridays.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
      }
      d.setDate(d.getDate() + 1)
    }
    return fridays
  }
  const weeklyExps = getNextFridays(4)

  const priceContext = currentPrice ? `Current price: $${currentPrice.toFixed(2)}` : "Look up current price via web search"

  return `You are White 80's deep research engine. Generate a comprehensive thesis for ${ticker}.

TODAY: ${todayStr}
${priceContext}
VALID OPTIONS EXPIRATIONS: ${weeklyExps.join(", ")}

Use web search extensively to gather:

1. COMPANY FUNDAMENTALS
   - What does this company do? Revenue, growth rate, profitability
   - Market cap, sector, competitive position
   - Recent earnings results and guidance

2. UPCOMING CATALYSTS
   - Earnings date (VERIFY via web search - must be exact)
   - Product launches, conferences, FDA dates, contract announcements
   - Any macro events that affect this name

3. TECHNICAL SETUP
   - Current trend (use 20/50 day MAs as reference)
   - Key support and resistance levels
   - RSI/momentum read

4. OPTIONS FLOW
   - Is there unusual activity?
   - What are smart money positioning toward?
   - Suggested play using ONLY the valid expirations listed above

5. BULL/BEAR CASES
   - What goes right? What's the upside scenario?
   - What goes wrong? What's the risk?

6. VERDICT
   - Should someone buy, sell, hold, watch, or avoid?
   - What conviction level and timeframe?

CRITICAL RULES:
- Web search for EVERY data point - do not guess dates or prices
- Be specific with numbers: "$185 support" not "support nearby"
- Options plays MUST use expirations from: ${weeklyExps.join(", ")}
- If you cannot verify a catalyst date, say "unconfirmed"

OUTPUT FORMATTING - EXTREMELY IMPORTANT:
- Return ONLY clean JSON - no markdown, no backticks
- NO citation markup of any kind - no <cite>, no </cite>, no [cite], no (cite), no cite index
- NO reference markers like [1], [2], [3] or superscript numbers
- Write plain English text only - strip ALL formatting artifacts from your search results
- If your search tool adds citations, you MUST remove them before outputting

Return JSON only:

{
  "ticker": "${ticker}",
  "name": "Full Company Name",
  "price": 123.45,
  "sector": "Technology",
  "market_cap": "$2.1T",
  "thesis": "2-3 sentence core investment thesis - why this name matters now",
  "bull_case": "2-3 sentences on upside scenario",
  "bear_case": "2-3 sentences on downside risks",
  "catalysts": [
    { "event": "Q2 Earnings", "date": "May 28", "impact": "HIGH" },
    { "event": "Product Launch", "date": "June 10", "impact": "MEDIUM" }
  ],
  "technicals": {
    "trend": "UPTREND",
    "support": 180.00,
    "resistance": 195.00,
    "rsi_read": "Neutral at 52, room to run"
  },
  "options_take": {
    "sentiment": "BULLISH",
    "suggested_play": "Buy $190 calls exp ${weeklyExps[1]}",
    "reasoning": "1-2 sentences on why this play makes sense given the setup"
  },
  "verdict": {
    "action": "BUY",
    "conviction": "HIGH",
    "timeframe": "2-4 weeks into earnings",
    "summary": "2-3 sentences summarizing the overall take and what you'd do"
  }
}`
}
