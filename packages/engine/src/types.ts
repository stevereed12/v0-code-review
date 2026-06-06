// ─── WHITE 80 TYPES ─────────────────────────────────────────────────────────
// Copied VERBATIM from the web app's lib/types.ts and lib/tier1-types.ts.
// Six issues of validated output depend on these shapes — do not alter.

export interface Signal {
  ticker: string
  price: number
  change_pct: number
  signal: "BUY" | "SELL" | "HOLD" | "WATCH" | "FADE"
  play: string
  thesis: string
  risk: "Low" | "Medium" | "High"
  catalyst: string
  target: number
  stop: number
  news_aware: boolean
}

export interface NewsItem {
  headline: string
  impact: "BULLISH" | "BEARISH" | "NEUTRAL"
  magnitude: "HIGH" | "MEDIUM" | "LOW"
  source: string
  age_hours: number
}

export interface TickerNews {
  ticker: string
  items: NewsItem[]
  summary: string
}

export interface Brief {
  session_date: string
  session_label: string // "Pre-Open" or "Post-Close"
  macro_pulse: {
    spy: { price: number; change_pct: number; context: string }
    qqq: { price: number; change_pct: number; context: string }
    vix: { level: number; direction: string; context: string }
    dxy: { level: number; context: string }
    ten_year: { yield: number; context: string }
    wti: { price: number; change_pct: number; context: string }
    gold: { price: number; context: string }
  }
  catalysts: Array<{
    title: string
    body: string
  }>
  sector_rotation: {
    leading: Array<{ sector: string; change_pct: number; detail: string }>
    lagging: Array<{ sector: string; change_pct: number; detail: string }>
  }
  verdict: {
    tone: "RISK-ON" | "RISK-OFF" | "NEUTRAL"
    summary: string
  }
  top_plays: Array<{
    ticker: string
    action: "BUY" | "SELL" | "FADE"
    play: string
    conviction: "HIGH" | "MEDIUM" | "LOW"
    catalyst: string
    thesis: string
  }>
}

export interface VibeCheck {
  session_date: string
  session_time: string
  vibe_score: number // 0-100: 0 = max fear/capitulation, 50 = neutral, 100 = max greed/euphoria
  mood: string // short label e.g. "RISK-ON RALLY", "JITTERY", "EUPHORIC", "GRINDING", "RISK-OFF"
  temperature: "FREEZING" | "COLD" | "COOL" | "WARM" | "HOT" | "ON FIRE"
  headline: string // playful one-liner capturing the day's energy
  read: string // a paragraph: playful but actionable read of the market mood
  drivers: Array<{
    label: string
    detail: string
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
  }>
  hot_sectors: Array<{ sector: string; vibe: string; change_pct: number }>
  cold_sectors: Array<{ sector: string; vibe: string; change_pct: number }>
  buzzing_tickers: Array<{ ticker: string; why: string; vibe: "BULLISH" | "BEARISH" | "MIXED" }>
  social_pulse: string // what retail / social / fintwit is feeling right now
  contrarian_note: string // the "but watch out" angle - what the crowd might be getting wrong
  play_it: string // how to translate the vibe into action, kept playful but real
}

export interface CuratorPromotion {
  ticker: string
  reason: string
  theme: string
}

export interface CuratorDemotion {
  ticker: string
  reason: string
}

export interface CuratorState {
  promote: CuratorPromotion[]
  demote: CuratorDemotion[]
  active_watchlist: string[]
  summary: string
  regime: "TRENDING" | "CHOPPY" | "ROTATIONAL" | "RISK-OFF"
}

export interface ScoutResult {
  ticker: string
  name: string
  market_cap: string
  sector: string
  thesis: string
  catalyst: string
  upside_target: string
  downside_risk: string
  conviction: "HIGH" | "MEDIUM" | "SPECULATIVE"
  entry_strategy: string
  why_now: string
}

export interface BuyHoldPick {
  ticker: string
  name: string
  sector: string
  market_cap: string
  current_price: number
  why_now: string
  entry_zone: { low: number; high: number }
  fair_value: number
  risk_level: "LOW" | "MEDIUM" | "HIGH"
  time_horizon: string
  conviction: "HIGH" | "MEDIUM" | "LOW"
  thesis: string
  bull_case: string
  bear_case: string
}

export interface LivePrice {
  price: number
  change: number
  change_pct: number
  prev_close: number
  day_high: number
  day_low: number
  volume: number
  market_state: string
  session: string
  ts: number
  age_seconds: number | null
  name: string
}

export interface PriceHistory {
  date: string
  close: number
}

export interface OptionsChainSummary {
  ticker: string
  currentPrice: number
  callPutRatio: number
  totalCallVolume: number
  totalPutVolume: number
  totalCallOI: number
  totalPutOI: number
  atmCallsVolume: number
  atmPutsVolume: number
  atmSkew: number
  hotStrikes: Array<{
    strike: number
    expiration: string
    type: "call" | "put"
    volume: number
    openInterest: number
    unusual: boolean
    reason: string
  }>
  unusualActivity: boolean
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"
  summary: string
}

// ─── CONSTANTS (verbatim) ────────────────────────────────────────────────────

export const SEED_WATCHLIST: string[] = [] // Start empty - user builds their own watchlist

export const THEMES = [
  { id: "ai_compute", label: "AI / Compute", weight: 1.0 },
  { id: "semis", label: "Semis", weight: 1.0 },
  { id: "crypto_adj", label: "Crypto-Adjacent", weight: 0.9 },
  { id: "macro_proxy", label: "Macro Proxies (SPY/QQQ)", weight: 0.7 },
] as const

export const SCOUT_THEMES = [
  { id: "ai_infra", label: "AI Infrastructure" },
  { id: "ai_apps", label: "AI Applications" },
  { id: "energy_transition", label: "Energy Transition" },
  { id: "nuclear_uranium", label: "Nuclear / Uranium" },
  { id: "biotech", label: "Biotech Catalysts" },
  { id: "defense", label: "Defense / Aerospace" },
  { id: "fintech", label: "Fintech / Payments" },
  { id: "crypto_picks", label: "Crypto Plays" },
  { id: "robotics", label: "Robotics / Automation" },
  { id: "rare_earth", label: "Rare Earth / Critical Minerals" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "space", label: "Space / Satellites" },
] as const

export const CAP_TIERS = {
  micro: { label: "Micro-Cap", range: "$50M - $300M", desc: "highest risk/reward" },
  small: { label: "Small-Cap", range: "$300M - $2B", desc: "high upside, less coverage" },
  mid: { label: "Mid-Cap", range: "$2B - $10B", desc: "balanced growth" },
  mixed: { label: "Mixed", range: "$50M - $10B", desc: "anywhere with conviction" },
} as const

export const HORIZONS = {
  "1-3mo": "Short swing (catalysts in next 3 months)",
  "3-6mo": "Medium hold (build-out / earnings cycles)",
  "6-12mo": "Long buy-and-hold (story stocks, secular themes)",
  "12mo+": "LEAPS / multi-year (asymmetric long-term bets)",
} as const

export type CapTier = keyof typeof CAP_TIERS
export type Horizon = keyof typeof HORIZONS

// ─── TIER 1 ALPHA SCREENER TYPES (verbatim from lib/tier1-types.ts) ──────────

export interface Tier1Signal {
  ticker: string
  name: string
  sector: string
  score: number // 0-6 composite score
  signals: {
    nearCatalyst: SignalResult // Earnings/FDA/event in 1-3 weeks
    consolidating: SignalResult // Low volatility squeeze
    aboveSma: SignalResult // Price > 20-day SMA
    sectorStrong: SignalResult // Sector outperforming SPY
    optionsHeat: SignalResult // Unusual call activity
    volumeBuilding: SignalResult // Volume trend increasing
  }
  catalyst?: {
    type: "earnings" | "fda" | "conference" | "product" | "other"
    date: string
    daysUntil: number
    description: string
  }
  price: number
  changePercent: number
  suggestedPlay?: string
  thesis?: string
  reasoning?: string // Auto-generated blurb explaining why this ticker is flagged
  optionsData?: {
    callPutRatio: number
    atmCallSkew: number
    unusualCallActivity: boolean
  }
}

export interface SignalResult {
  active: boolean
  value?: number
  detail?: string
}

export interface ScanResult {
  timestamp: string
  totalScanned: number
  matches: Tier1Signal[]
  errors: string[]
}

// Sector ETF mappings for relative strength
export const SECTOR_ETFS: Record<string, string> = {
  Technology: "XLK",
  Healthcare: "XLV",
  Financials: "XLF",
  "Consumer Discretionary": "XLY",
  "Consumer Staples": "XLP",
  Energy: "XLE",
  Industrials: "XLI",
  Materials: "XLB",
  Utilities: "XLU",
  "Real Estate": "XLRE",
  "Communication Services": "XLC",
}

export interface ScanConfig {
  minScore: number // Minimum composite score to include
  maxResults: number // Cap results
  includeOptionsData: boolean // Options API calls are expensive
  catalystWindowDays: [number, number] // e.g., [7, 21] for 1-3 weeks
}

export const DEFAULT_SCAN_CONFIG: ScanConfig = {
  minScore: 3, // Lower default to show more opportunities
  maxResults: 12, // Top 12 highest conviction only
  includeOptionsData: true,
  catalystWindowDays: [7, 28], // Expand window to 4 weeks
}

// ─── PIPELINE AGGREGATE TYPES (new) ──────────────────────────────────────────

export interface PipelineOptions {
  /** Polygon API key. Falls back to process.env.POLYGON_API_KEY. */
  polygonKey?: string
  /**
   * Starting watchlist handed to the Curator. If omitted, the Curator runs with
   * an empty list and builds one from scratch (its prompt supports this).
   */
  watchlist?: string[]
  /** Scout discovery themes (SCOUT_THEMES ids). Defaults to a sensible AI/semis mix. */
  scoutThemes?: string[]
  scoutCapTier?: CapTier
  scoutHorizon?: Horizon
  /** Limit the Tier 1 scan universe (defaults to the full built-in universe). */
  tier1Tickers?: string[]
}

/** The single object the full pipeline assembles from all seven agents. */
export interface BriefOutput {
  generated_at: string
  macro_pulse?: import("./macro").MacroPulse
  session_date: string
  curator: CuratorState
  watchlist: string[]
  tier1: Tier1Signal[]
  news: TickerNews[]
  signals: Signal[]
  scout: ScoutResult[]
  brief: Brief
  vibe: VibeCheck
}
