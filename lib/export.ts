// ─── DATA EXPORT/IMPORT ─────────────────────────────────────────────────────

import type { TrackerLog } from "./types"

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
