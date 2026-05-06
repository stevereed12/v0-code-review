// ─── WHITE 80 TYPES ─────────────────────────────────────────────────────────

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
  futures: string
  headlines: string[]
  earnings_today: string[]
  econ_today: string[]
  watchlist_take: string
  tone: "RISK-ON" | "RISK-OFF" | "NEUTRAL"
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

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const SEED_WATCHLIST = ["NVDA", "SPY", "AMZN", "HOOD", "META", "PLTR", "MSTR", "TSM"]

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
