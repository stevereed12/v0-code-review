// ─── MODEL ROUTING ───────────────────────────────────────────────────────────
// All models are via the Perplexity Agent API (base URL: https://api.perplexity.ai/v1/agent).
// Model IDs must match exactly — see https://docs.perplexity.ai/docs/agent-api/models
//
// Daily Brief uses claude-sonnet-4-6 — six validated issues were written on Claude,
// voice is locked to it.

export const MODELS = {
  TIER1_SCANNER:  "xai/grok-4.20-reasoning",
  SCOUT:          "xai/grok-4.20-reasoning",
  CURATOR:        "perplexity/sonar",        // search-grounded, live web context
  WATCHLIST:      "perplexity/sonar",        // news retrieval per ticker
  DAILY_BRIEF:    "anthropic/claude-sonnet-4-6",
  VIBE_ENGINE:    "perplexity/sonar",        // live sentiment + social pulse
  SIGNALS_ENGINE: "xai/grok-4.3",
} as const

export const MAG_7 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"] as const
