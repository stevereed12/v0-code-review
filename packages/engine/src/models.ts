// ─── MODEL ROUTING ───────────────────────────────────────────────────────────
// Per-agent model assignments for the Perplexity Agent API (OpenAI-SDK compatible).
// One key (PERPLEXITY_API_KEY) bills all calls. Sonar models have web search built
// in; the xai/google models get their context from prompts + Polygon market data.

export const MODELS = {
  TIER1_SCANNER: "xai/grok-4.20-reasoning",
  SCOUT: "xai/grok-4.20-reasoning",
  CURATOR: "perplexity/sonar-pro",
  WATCHLIST: "perplexity/sonar",
  DAILY_BRIEF: "google/gemini-3.1-pro-preview",
  VIBE_ENGINE: "perplexity/sonar-pro",
  SIGNALS_ENGINE: "xai/grok-4.3",
} as const
