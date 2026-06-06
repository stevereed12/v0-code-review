// ─── INTRADAY ALERT RUNNER ───────────────────────────────────────────────────
// Hourly during market hours: score the full universe, dedup against prior scans
// and the morning brief, and email anything that crosses threshold.
//
// Thresholds:
//   • Brief tickers (already in today's brief): alert only if score >= 90.
//   • Everyone else: alert if score >= 65 OR delta > 20 from last scan.

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { scanUniverse, type ScoredTicker } from "@white80/engine"
import { sendAlertEmail, type AlertResult } from "./send-alert-email"

const STATE_PATH = "/tmp/white80-alert-state.json"
const BRIEF_TICKERS_PATH = "/tmp/white80-brief-tickers.json"

const BRIEF_ALERT_MIN = 90
const GENERAL_ALERT_MIN = 65
const DELTA_TRIGGER = 20

interface AlertState {
  lastScan: Record<string, number>
  briefTickers: string[]
  alertedToday: Record<string, number>
}

interface DatedState extends AlertState {
  day: string // YYYY-MM-DD in ET — used to reset alertedToday daily
}

function etDay(): string {
  // en-CA gives YYYY-MM-DD.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })
}

/** Minutes since ET midnight, for market-hours gating. */
function etMinutesNow(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0")
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0")
  return hour * 60 + minute
}

/** Mon–Fri, 9:30 AM–4:00 PM ET. */
function isMarketHours(): boolean {
  const dow = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  })
  if (dow === "Sat" || dow === "Sun") return false
  const m = etMinutesNow()
  return m >= 9 * 60 + 30 && m <= 16 * 60
}

function loadBriefTickers(): string[] {
  try {
    if (!existsSync(BRIEF_TICKERS_PATH)) return []
    const parsed = JSON.parse(readFileSync(BRIEF_TICKERS_PATH, "utf8"))
    if (Array.isArray(parsed)) return parsed.map((t) => String(t).toUpperCase())
  } catch {
    /* ignore — treat as empty */
  }
  return []
}

function loadState(): DatedState {
  const empty: DatedState = { day: etDay(), lastScan: {}, briefTickers: [], alertedToday: {} }
  try {
    if (!existsSync(STATE_PATH)) return empty
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8")) as Partial<DatedState>
    const state: DatedState = {
      day: parsed.day || etDay(),
      lastScan: parsed.lastScan || {},
      briefTickers: parsed.briefTickers || [],
      alertedToday: parsed.alertedToday || {},
    }
    // New trading day → reset per-day alert counts.
    if (state.day !== etDay()) {
      state.day = etDay()
      state.alertedToday = {}
    }
    return state
  } catch {
    return empty
  }
}

function saveState(state: DatedState): void {
  try {
    writeFileSync(STATE_PATH, JSON.stringify(state))
  } catch {
    /* non-fatal */
  }
}

function qualifies(s: ScoredTicker, briefSet: Set<string>, lastScan: Record<string, number>): {
  hit: boolean
  delta: number
} {
  const prev = lastScan[s.ticker] ?? 0
  const delta = s.score - prev
  if (briefSet.has(s.ticker)) {
    return { hit: s.score >= BRIEF_ALERT_MIN, delta }
  }
  return { hit: s.score >= GENERAL_ALERT_MIN || delta > DELTA_TRIGGER, delta }
}

/**
 * Run one intraday alert scan. Skips outside market hours. Scores the universe,
 * applies dedup thresholds, emails qualifying tickers, and persists state.
 * Returns the number of tickers alerted on.
 */
export async function runAlertScan(): Promise<number> {
  if (!isMarketHours()) {
    console.log("[alerts] Outside market hours (9:30 AM–4:00 PM ET) — skipping.")
    return 0
  }

  const state = loadState()
  const briefTickers = loadBriefTickers()
  if (briefTickers.length > 0) state.briefTickers = briefTickers
  const briefSet = new Set(state.briefTickers)

  console.log(`[alerts] Scanning universe (brief tickers: ${state.briefTickers.length})…`)
  const scored = await scanUniverse({})
  console.log(`[alerts] Scored ${scored.length} tickers.`)

  const alerts: AlertResult[] = []
  for (const s of scored) {
    const { hit, delta } = qualifies(s, briefSet, state.lastScan)
    if (hit) {
      alerts.push({
        ticker: s.ticker,
        score: s.score,
        delta,
        topDrivers: s.topDrivers,
        price: s.price,
        change: s.change,
      })
      state.alertedToday[s.ticker] = (state.alertedToday[s.ticker] ?? 0) + 1
    }
  }

  // Persist this scan's scores for next run's delta comparison.
  const nextLastScan: Record<string, number> = {}
  for (const s of scored) nextLastScan[s.ticker] = s.score
  state.lastScan = nextLastScan

  if (alerts.length > 0) {
    alerts.sort((a, b) => b.score - a.score)
    try {
      const id = await sendAlertEmail(alerts)
      console.log(`[alerts] Emailed ${alerts.length} alert(s) (id=${id}).`)
    } catch (err) {
      console.error("[alerts] Email failed:", err)
    }
  } else {
    console.log("[alerts] No tickers crossed threshold.")
  }

  saveState(state)
  return alerts.length
}

// Allow `node dist/run-alerts.js` to run a single scan.
if (require.main === module) {
  runAlertScan()
    .then((n) => {
      console.log(`[alerts] Done. ${n} alert(s).`)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[alerts] FAILED:", err)
      process.exit(1)
    })
}
