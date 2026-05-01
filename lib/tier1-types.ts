// ─── TIER 1 ALPHA SCREENER TYPES ─────────────────────────────────────────────

export interface Tier1Signal {
  ticker: string
  name: string
  sector: string
  score: number // 0-6 composite score
  signals: {
    nearCatalyst: SignalResult      // Earnings/FDA/event in 1-3 weeks
    consolidating: SignalResult     // Low volatility squeeze
    aboveSma: SignalResult          // Price > 20-day SMA
    sectorStrong: SignalResult      // Sector outperforming SPY
    optionsHeat: SignalResult       // Unusual call activity
    volumeBuilding: SignalResult    // Volume trend increasing
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

export interface PolygonQuote {
  ticker: string
  close: number
  open: number
  high: number
  low: number
  volume: number
  vwap: number
  prevClose: number
  change: number
  changePercent: number
}

export interface PolygonAgg {
  c: number  // close
  h: number  // high
  l: number  // low
  o: number  // open
  v: number  // volume
  vw: number // vwap
  t: number  // timestamp
  n: number  // number of trades
}

export interface OptionsFlow {
  ticker: string
  totalCallVolume: number
  totalPutVolume: number
  callPutRatio: number
  unusualActivity: boolean
  nearTermCalls: number // Calls expiring in 7-21 days
}

export interface TechnicalData {
  sma20: number
  sma50: number
  atr14: number
  avgVolume20: number
  currentVolume: number
  volumeRatio: number
  priceVsSma20: number // % above/below
  consolidationScore: number // 0-100, higher = tighter range
}

// S&P 500 + Nasdaq 100 universe (deduplicated)
export const SCAN_UNIVERSE = {
  // Will be populated dynamically or from a static list
  sp500: [] as string[],
  nasdaq100: [] as string[],
}

// Sector ETF mappings for relative strength
export const SECTOR_ETFS: Record<string, string> = {
  "Technology": "XLK",
  "Healthcare": "XLV", 
  "Financials": "XLF",
  "Consumer Discretionary": "XLY",
  "Consumer Staples": "XLP",
  "Energy": "XLE",
  "Industrials": "XLI",
  "Materials": "XLB",
  "Utilities": "XLU",
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
  maxResults: 50, // Show more results
  includeOptionsData: true,
  catalystWindowDays: [7, 28], // Expand window to 4 weeks
}
