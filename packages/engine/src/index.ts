// ─── @white80/engine PUBLIC API ──────────────────────────────────────────────
// One source of truth for the seven-agent pipeline. The web app and the routine
// both import from here.

// Full pipeline
export { runPipeline } from "./pipeline"

// Individual agents
export { runCurator } from "./agents/curator"
export type { CuratorOptions } from "./agents/curator"
export { runTier1Scan } from "./agents/tier1-scanner"
export type { Tier1ScanOptions } from "./agents/tier1-scanner"
export { runWatchlist } from "./agents/watchlist"
export type { WatchlistOptions } from "./agents/watchlist"
export { runSignals } from "./agents/signals-engine"
export type { SignalsOptions } from "./agents/signals-engine"
export { runScout } from "./agents/scout"
export type { ScoutOptions } from "./agents/scout"
export { runDailyBrief } from "./agents/daily-brief"
export type { DailyBriefOptions } from "./agents/daily-brief"
export { runVibe } from "./agents/vibe-engine"
export type { VibeOptions } from "./agents/vibe-engine"

// Model helpers (shared Perplexity Agent API client + key resolution)
export { askModel, extractJSON, resolvePolygonKey } from "./model"
export { MODELS } from "./models"

// Prompt builders (verbatim)
export {
  buildSignalPrompt,
  buildBriefPrompt,
  buildVibePrompt,
  buildNewsPrompt,
  buildScoutPrompt,
  buildCuratorPrompt,
  buildQuickThesisPrompt,
  buildBuyHoldPrompt,
} from "./prompts"

// All types & constants
export * from "./types"

export { fetchMacroPulse } from "./macro"

// Intraday alert scanner
export { scanUniverse, ALERT_UNIVERSE } from "./agents/alert-scanner"
export type { ScoredTicker, ScanOptions } from "./agents/alert-scanner"

// Pre-market scanner (8:00 AM ET)
export { runPremarketScan } from "./agents/premarket-scanner"
export type { PremarketSnapshot, OvernightGapper, EarningsReaction } from "./agents/premarket-scanner"

// Options flow context for the Signals Engine
export { fetchOptionsContext } from "./agents/options-context"
export type { OptionsContext } from "./agents/options-context"
