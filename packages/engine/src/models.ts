// ─── MODEL ROUTING ───────────────────────────────────────────────────────────
// Sonar models (chat/completions endpoint): just "sonar" or "sonar-pro"
// Agent API models (v1/agent endpoint): "xai/...", "google/...", "anthropic/..."

export const MODELS = {
  TIER1_SCANNER:  "xai/grok-4.20-reasoning",
  SCOUT:          "xai/grok-4.20-reasoning",
  CURATOR:        "sonar",
  WATCHLIST:      "sonar",
  DAILY_BRIEF:    "anthropic/claude-sonnet-4-6",
  VIBE_ENGINE:    "sonar",
  SIGNALS_ENGINE: "xai/grok-4.3",
} as const

export const MAG_7 = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA"] as const
