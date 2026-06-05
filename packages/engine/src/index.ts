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

// Claude helpers (shared client + key resolution)
export { askClaude, extractJSON, resolveAnthropicKey, resolvePolygonKey } from "./claude"
export { CLAUDE_MODEL } from "./ai-config"

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
