"use client"

import { useRef } from "react"
import { Download, Upload, X } from "lucide-react"
import type { TrackerLog } from "@/lib/types"
import { exportToJSON, exportTrackerToCSV, importFromJSON } from "@/lib/export"

interface ExportModalProps {
  open: boolean
  onClose: () => void
  watchlist: string[]
  pinnedTickers: string[]
  blockedTickers: string[]
  trackerLog: TrackerLog[]
  scoutThemes: string[]
  scoutCapTier: string
  scoutHorizon: string
  onImport: (data: {
    watchlist: string[]
    pinnedTickers: string[]
    blockedTickers: string[]
    trackerLog: TrackerLog[]
    scoutThemes: string[]
    scoutCapTier: string
    scoutHorizon: string
  }) => void
}

export function ExportModal({
  open,
  onClose,
  watchlist,
  pinnedTickers,
  blockedTickers,
  trackerLog,
  scoutThemes,
  scoutCapTier,
  scoutHorizon,
  onImport,
}: ExportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleExportJSON = () => {
    exportToJSON({
      version: "1.0",
      exportedAt: new Date().toISOString(),
      watchlist,
      pinnedTickers,
      blockedTickers,
      trackerLog,
      scoutThemes,
      scoutCapTier,
      scoutHorizon,
    })
  }

  const handleExportCSV = () => {
    exportTrackerToCSV(trackerLog)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await importFromJSON(file)
      onImport({
        watchlist: data.watchlist,
        pinnedTickers: data.pinnedTickers,
        blockedTickers: data.blockedTickers,
        trackerLog: data.trackerLog,
        scoutThemes: data.scoutThemes,
        scoutCapTier: data.scoutCapTier,
        scoutHorizon: data.scoutHorizon,
      })
      onClose()
    } catch {
      alert("Failed to import file. Please check the file format.")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-5 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#d6dff0]">Export / Import Data</h2>
          <button onClick={onClose} className="text-[#3d4f6b] hover:text-[#d6dff0] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-3 bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] rounded transition-all hover:bg-[#00e5ff]/20"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export All (JSON)</div>
              <div className="text-xs text-[#00e5ff]/70">
                Watchlist, tracker history, settings
              </div>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-3 bg-[#00ffaa]/10 border border-[#00ffaa] text-[#00ffaa] rounded transition-all hover:bg-[#00ffaa]/20"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export Tracker (CSV)</div>
              <div className="text-xs text-[#00ffaa]/70">
                Signal history for spreadsheets
              </div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 p-3 bg-[#a78bfa]/10 border border-[#a78bfa] text-[#a78bfa] rounded transition-all hover:bg-[#a78bfa]/20"
          >
            <Upload className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Import from JSON</div>
              <div className="text-xs text-[#a78bfa]/70">Restore from a previous export</div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-[#131c2e]">
          <p className="font-mono text-[9px] text-[#3d4f6b] tracking-wide">
            DATA SUMMARY: {watchlist.length} tickers - {trackerLog.length} tracked signals
          </p>
        </div>
      </div>
    </div>
  )
}
