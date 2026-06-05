// ─── MODEL ROUTING ───────────────────────────────────────────────────────────
// Per-agent model assignments for the Perplexity Agent API (OpenAI-SDK compatible).
// One key (PERPLEXITY_API_KEY) bills all calls. Sonar models have web search built
// in; the xai/google models get their context from prompts + Polygon market data.
//
// Daily Brief uses claude-sonnet-4-6 via the Perplexity API — it produced all six
// validated issues and the voice is locked to Claude.

export const MODELS = {
  TIER1_SCANNER:  "xai/grok-4.20-reasoning",
  SCOUT:          "xai/grok-4.20-reasoning",
  CURATOR:        "perplexity/sonar-pro",
  WATCHLIST:      "perplexity/sonar",
  DAILY_BRIEF:    "claude-sonnet-4-6",
  VIBE_ENGINE:    "perplexity/sonar-pro",
  SIGNALS_ENGINE: "xai/grok-4.3",
} as const

// ─── MAG 7 ───────────────────────────────────────────────────────────────────
// Always included in Signals regardless of Tier 1 / Curator output.
export const MAG_7 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"] as const
