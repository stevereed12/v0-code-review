"use client"

import { useRef } from "react"
import { Download, Upload, X, FileSpreadsheet, FileText } from "lucide-react"
import type { TrackerLog, Brief, Signal, ScoutResult, BuyHoldPick } from "@/lib/types"
import { 
  exportToJSON, 
  exportTrackerToCSV, 
  importFromJSON,
  exportBriefToCSV,
  exportSignalsToCSV,
  exportScoutToCSV,
  exportBuyHoldToCSV
} from "@/lib/export"

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
  // Research data
  brief?: Brief | null
  signals?: Signal[]
  scoutResults?: ScoutResult[]
  buyHoldPicks?: BuyHoldPick[]
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
  brief,
  signals,
  scoutResults,
  buyHoldPicks,
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
      brief,
      signals,
      scoutResults,
      buyHoldPicks,
    })
  }

  const handleExportCSV = () => {
    exportTrackerToCSV(trackerLog)
  }

  const handleExportBrief = () => {
    if (brief) {
      exportBriefToCSV(brief)
    }
  }

  const handleExportSignals = () => {
    if (signals && signals.length > 0) {
      const date = new Date().toISOString().split("T")[0]
      exportSignalsToCSV(signals, date)
    }
  }

  const handleExportScout = () => {
    if (scoutResults && scoutResults.length > 0) {
      const date = new Date().toISOString().split("T")[0]
      exportScoutToCSV(scoutResults, date)
    }
  }

  const handleExportBuyHold = () => {
    if (buyHoldPicks && buyHoldPicks.length > 0) {
      const date = new Date().toISOString().split("T")[0]
      exportBuyHoldToCSV(buyHoldPicks, date)
    }
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

  const hasResearchData = brief || (signals && signals.length > 0) || (scoutResults && scoutResults.length > 0) || (buyHoldPicks && buyHoldPicks.length > 0)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#d6dff0]">Export / Import Data</h2>
          <button onClick={onClose} className="text-[#3d4f6b] hover:text-[#d6dff0] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Full Export */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-3 bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] rounded transition-all hover:bg-[#00e5ff]/20"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export All (JSON)</div>
              <div className="text-xs text-[#00e5ff]/70">
                Everything: watchlist, signals, research, settings
              </div>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-3 bg-[#00ffaa]/10 border border-[#00ffaa] text-[#00ffaa] rounded transition-all hover:bg-[#00ffaa]/20"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export Tracker (CSV)</div>
              <div className="text-xs text-[#00ffaa]/70">
                Signal history for spreadsheets
              </div>
            </div>
          </button>

          {/* Research Data Exports */}
          {hasResearchData && (
            <>
              <div className="border-t border-[#131c2e] pt-3 mt-3">
                <div className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b] mb-2">RESEARCH DATA</div>
              </div>

              {brief && (
                <button
                  onClick={handleExportBrief}
                  className="w-full flex items-center gap-3 p-3 bg-[#fb923c]/10 border border-[#fb923c] text-[#fb923c] rounded transition-all hover:bg-[#fb923c]/20"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Brief (CSV)</div>
                    <div className="text-xs text-[#fb923c]/70">
                      Top plays, macro pulse, catalysts
                    </div>
                  </div>
                </button>
              )}

              {signals && signals.length > 0 && (
                <button
                  onClick={handleExportSignals}
                  className="w-full flex items-center gap-3 p-3 bg-[#a78bfa]/10 border border-[#a78bfa] text-[#a78bfa] rounded transition-all hover:bg-[#a78bfa]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Tier 1 Signals (CSV)</div>
                    <div className="text-xs text-[#a78bfa]/70">
                      {signals.length} watchlist signals
                    </div>
                  </div>
                </button>
              )}

              {scoutResults && scoutResults.length > 0 && (
                <button
                  onClick={handleExportScout}
                  className="w-full flex items-center gap-3 p-3 bg-[#f472b6]/10 border border-[#f472b6] text-[#f472b6] rounded transition-all hover:bg-[#f472b6]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Scout Ideas (CSV)</div>
                    <div className="text-xs text-[#f472b6]/70">
                      {scoutResults.length} discovery picks
                    </div>
                  </div>
                </button>
              )}

              {buyHoldPicks && buyHoldPicks.length > 0 && (
                <button
                  onClick={handleExportBuyHold}
                  className="w-full flex items-center gap-3 p-3 bg-[#4ade80]/10 border border-[#4ade80] text-[#4ade80] rounded transition-all hover:bg-[#4ade80]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Buy & Hold (CSV)</div>
                    <div className="text-xs text-[#4ade80]/70">
                      {buyHoldPicks.length} long-term picks
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          {/* Import */}
          <div className="border-t border-[#131c2e] pt-3 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-[#131c2e] border border-[#3d4f6b] text-[#d6dff0] rounded transition-all hover:bg-[#1a2438]"
            >
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <div className="font-mono text-sm">Import from JSON</div>
                <div className="text-xs text-[#3d4f6b]">Restore from a previous export</div>
              </div>
            </button>
          </div>
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
            DATA: {watchlist.length} tickers • {trackerLog.length} tracked • {signals?.length || 0} signals • {brief ? "1 brief" : "no brief"}
          </p>
        </div>
      </div>
    </div>
  )
}
