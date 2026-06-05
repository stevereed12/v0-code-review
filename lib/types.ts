// ─── WHITE 80 TYPES ─────────────────────────────────────────────────────────
// The shared agent/pipeline types now live in @white80/engine (the single source
// of truth shared by the web app and the automated routine). They are re-exported
// here so existing `@/lib/types` imports keep working unchanged. Only the
// web-app-only trade/tracker types are defined locally below.

export type {
  Signal,
  NewsItem,
  TickerNews,
  Brief,
  VibeCheck,
  CuratorPromotion,
  CuratorDemotion,
  CuratorState,
  ScoutResult,
  BuyHoldPick,
  LivePrice,
  PriceHistory,
  OptionsChainSummary,
  CapTier,
  Horizon,
} from "@white80/engine"

export { SEED_WATCHLIST, THEMES, SCOUT_THEMES, CAP_TIERS, HORIZONS } from "@white80/engine"

// ─── WEB-APP-ONLY TYPES (trade ingestion + signal tracking) ──────────────────
// These power the dashboard's trade-tracking features and are not part of the
// agent pipeline, so they stay in the web app.

export interface ExtractedTrade {
  ticker: string
  action: "BUY" | "SELL"
  quantity: number
  price: number
  total: number
  time?: string
  date: string
  contract?: string // For options: "AAPL $185 Call 5/23"
  isOptions: boolean
  matchStatus?: "SIGNAL" | "TOP_PLAY" | "OFF_SIGNAL" | "UNMATCHED"
  matchedSignal?: string // Description of what it matched
}

// Executed trade for P/L tracking
export interface ExecutedTrade {
  id: string
  ticker: string
  action: "BUY" | "SELL"
  quantity: number
  price: number
  total: number
  date: string
  time?: string
  isOptions: boolean
  contract?: string
  matchStatus?: "SIGNAL" | "TOP_PLAY" | "OFF_SIGNAL" | "UNMATCHED"
  matchedSignal?: string
  // P/L tracking (for closed positions)
  linkedTradeId?: string // Links buy to sell
  realizedPnL?: number
  pnlPercent?: number
}

// Clean signal tracking model
export interface TrackedSignal {
  id: string
  date: string // YYYY-MM-DD
  ticker: string
  source: "WATCHLIST" | "TOP_PLAY" | "TIER1" | "THESIS" | "BUY_HOLD" | "SCOUT" | "MANUAL"
  signalType: "BUY" | "SELL" | "FADE"
  play: string // e.g., "$185 calls exp 5/23" or "Buy shares"
  signalPrice: number // Price when signal was given
  conviction: "HIGH" | "MEDIUM" | "LOW"
  // Execution tracking
  took: boolean | null // null = not yet decided
  entryPrice?: number
  exitPrice?: number
  quantity?: number
  totalCost?: number
  totalProceeds?: number
  // Outcome
  outcome: "WIN" | "LOSS" | "EVEN" | "MISSED_WIN" | "GOOD_PASS" | "OPEN" | null
  pnlDollars?: number
  pnlPercent?: number
  // Meta
  notes?: string
  closedAt?: string
}

export interface TrackerLog {
  id: string
  ts: string
  ticker: string
  signal: string
  play: string
  price_at_signal: number
  target: number
  stop: number
  risk: string
  catalyst: string
  news_aware: boolean
  status: "PENDING" | "APPROVED" | "PASSED"
  outcome: "WIN" | "LOSS" | "EVEN" | null
  notes: string
}
