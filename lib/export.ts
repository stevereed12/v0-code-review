// ─── DATA EXPORT/IMPORT ─────────────────────────────────────────────────────

import type { TrackerLog, Brief, ScoutResult, BuyHoldPick, Signal } from "./types"

interface ExportData {
  version: string
  exportedAt: string
  watchlist: string[]
  pinnedTickers: string[]
  blockedTickers: string[]
  trackerLog: TrackerLog[]
  scoutThemes: string[]
  scoutCapTier: string
  scoutHorizon: string
  // New: research data
  brief?: Brief | null
  signals?: Signal[]
  scoutResults?: ScoutResult[]
  buyHoldPicks?: BuyHoldPick[]
  thesisHistory?: Array<{
    ticker: string
    date: string
    thesis: string
    catalyst: string
    conviction: string
  }>
}

export function exportToJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `white80-export-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportTrackerToCSV(trackerLog: TrackerLog[]): void {
  const headers = [
    "Date",
    "Ticker",
    "Signal",
    "Play",
    "Price at Signal",
    "Target",
    "Stop",
    "Risk",
    "Catalyst",
    "News Aware",
    "Status",
    "Outcome",
    "Notes",
  ]

  const rows = trackerLog.map((log) => [
    new Date(log.ts).toLocaleDateString(),
    log.ticker,
    log.signal,
    `"${log.play.replace(/"/g, '""')}"`,
    log.price_at_signal?.toFixed(2) || "",
    log.target?.toFixed(2) || "",
    log.stop?.toFixed(2) || "",
    log.risk,
    log.catalyst || "",
    log.news_aware ? "Yes" : "No",
    log.status,
    log.outcome || "",
    `"${(log.notes || "").replace(/"/g, '""')}"`,
  ])

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `white80-tracker-${new Date().toISOString().split("T")[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromJSON(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.version || !data.watchlist) {
          throw new Error("Invalid export file format")
        }
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

// ─── BRIEF / RESEARCH EXPORTS ────────────────────────────────────────────────

export function exportBriefToCSV(brief: Brief): void {
  const rows: string[][] = []
  
  // Header info
  rows.push(["WHITE 80 BRIEF EXPORT"])
  rows.push(["Date", brief.session_date])
  rows.push(["Session", brief.session_label])
  rows.push(["Market Tone", brief.verdict.tone])
  rows.push([])
  
  // Macro Pulse
  rows.push(["MACRO PULSE"])
  rows.push(["Index", "Price", "Change %", "Context"])
  rows.push(["SPY", brief.macro_pulse.spy.price.toString(), `${brief.macro_pulse.spy.change_pct}%`, brief.macro_pulse.spy.context])
  rows.push(["QQQ", brief.macro_pulse.qqq.price.toString(), `${brief.macro_pulse.qqq.change_pct}%`, brief.macro_pulse.qqq.context])
  rows.push(["VIX", brief.macro_pulse.vix.level.toString(), brief.macro_pulse.vix.direction, brief.macro_pulse.vix.context])
  rows.push(["DXY", brief.macro_pulse.dxy.level.toString(), "", brief.macro_pulse.dxy.context])
  rows.push(["10Y Yield", `${brief.macro_pulse.ten_year.yield}%`, "", brief.macro_pulse.ten_year.context])
  rows.push(["WTI Oil", brief.macro_pulse.wti.price.toString(), `${brief.macro_pulse.wti.change_pct}%`, brief.macro_pulse.wti.context])
  rows.push(["Gold", brief.macro_pulse.gold.price.toString(), "", brief.macro_pulse.gold.context])
  rows.push([])
  
  // Top Plays
  rows.push(["TOP PLAYS"])
  rows.push(["Ticker", "Action", "Play", "Conviction", "Catalyst", "Thesis"])
  brief.top_plays.forEach(play => {
    rows.push([
      play.ticker,
      play.action,
      `"${play.play.replace(/"/g, '""')}"`,
      play.conviction,
      `"${play.catalyst.replace(/"/g, '""')}"`,
      `"${play.thesis.replace(/"/g, '""')}"`
    ])
  })
  rows.push([])
  
  // Catalysts
  rows.push(["CATALYSTS"])
  rows.push(["Title", "Details"])
  brief.catalysts.forEach(cat => {
    rows.push([`"${cat.title.replace(/"/g, '""')}"`, `"${cat.body.replace(/"/g, '""')}"`])
  })
  rows.push([])
  
  // Sector Rotation
  rows.push(["SECTOR ROTATION - LEADING"])
  rows.push(["Sector", "Change %", "Detail"])
  brief.sector_rotation.leading.forEach(s => {
    rows.push([s.sector, `${s.change_pct}%`, `"${s.detail.replace(/"/g, '""')}"`])
  })
  rows.push([])
  rows.push(["SECTOR ROTATION - LAGGING"])
  brief.sector_rotation.lagging.forEach(s => {
    rows.push([s.sector, `${s.change_pct}%`, `"${s.detail.replace(/"/g, '""')}"`])
  })
  rows.push([])
  
  // Verdict
  rows.push(["VERDICT"])
  rows.push([`"${brief.verdict.summary.replace(/"/g, '""')}"`])
  
  const csv = rows.map(r => r.join(",")).join("\n")
  downloadFile(csv, `white80-brief-${brief.session_date}.csv`, "text/csv")
}

export function exportSignalsToCSV(signals: Signal[], date: string): void {
  const headers = ["Ticker", "Signal", "Price", "Change %", "Play", "Thesis", "Target", "Stop", "Risk", "Catalyst", "News Aware"]
  
  const rows = signals.map(s => [
    s.ticker,
    s.signal,
    s.price.toFixed(2),
    `${s.change_pct.toFixed(2)}%`,
    `"${s.play.replace(/"/g, '""')}"`,
    `"${s.thesis.replace(/"/g, '""')}"`,
    s.target.toFixed(2),
    s.stop.toFixed(2),
    s.risk,
    `"${s.catalyst.replace(/"/g, '""')}"`,
    s.news_aware ? "Yes" : "No"
  ])
  
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  downloadFile(csv, `white80-signals-${date}.csv`, "text/csv")
}

export function exportScoutToCSV(results: ScoutResult[], date: string): void {
  const headers = ["Ticker", "Name", "Sector", "Market Cap", "Conviction", "Thesis", "Catalyst", "Upside Target", "Downside Risk", "Entry Strategy", "Why Now"]
  
  const rows = results.map(r => [
    r.ticker,
    r.name,
    r.sector,
    r.market_cap,
    r.conviction,
    `"${r.thesis.replace(/"/g, '""')}"`,
    `"${r.catalyst.replace(/"/g, '""')}"`,
    r.upside_target,
    r.downside_risk,
    `"${r.entry_strategy.replace(/"/g, '""')}"`,
    `"${r.why_now.replace(/"/g, '""')}"`
  ])
  
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  downloadFile(csv, `white80-scout-${date}.csv`, "text/csv")
}

export function exportBuyHoldToCSV(picks: BuyHoldPick[], date: string): void {
  const headers = ["Ticker", "Name", "Sector", "Market Cap", "Price", "Fair Value", "Entry Low", "Entry High", "Conviction", "Risk", "Horizon", "Thesis", "Bull Case", "Bear Case", "Why Now"]
  
  const rows = picks.map(p => [
    p.ticker,
    p.name,
    p.sector,
    p.market_cap,
    p.current_price.toFixed(2),
    p.fair_value.toFixed(2),
    p.entry_zone.low.toFixed(2),
    p.entry_zone.high.toFixed(2),
    p.conviction,
    p.risk_level,
    p.time_horizon,
    `"${p.thesis.replace(/"/g, '""')}"`,
    `"${p.bull_case.replace(/"/g, '""')}"`,
    `"${p.bear_case.replace(/"/g, '""')}"`,
    `"${p.why_now.replace(/"/g, '""')}"`
  ])
  
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  downloadFile(csv, `white80-buyhold-${date}.csv`, "text/csv")
}

// Helper to download files
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
