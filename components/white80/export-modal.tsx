"use client"

import { useRef } from "react"
import { Download, Upload, X, FileSpreadsheet, FileText } from "lucide-react"
import type { TrackerLog, Brief, Signal, ScoutResult, BuyHoldPick, VibeCheck } from "@/lib/types"
import { 
  exportToJSON, 
  exportTrackerToCSV, 
  importFromJSON,
  exportBriefToCSV,
  exportSignalsToCSV,
  exportScoutToCSV,
  exportBuyHoldToCSV,
  exportVibeToCSV
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
  vibe?: VibeCheck | null
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
  vibe,
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
      vibe,
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

  const handleExportVibe = () => {
    if (vibe) {
      exportVibeToCSV(vibe)
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

  const hasResearchData = brief || (signals && signals.length > 0) || (scoutResults && scoutResults.length > 0) || (buyHoldPicks && buyHoldPicks.length > 0) || vibe

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141411] border border-[#262620] rounded-lg p-5 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-[#f4f0e6]">Export / Import Data</h2>
          <button onClick={onClose} className="text-[#6e6a5e] hover:text-[#f4f0e6] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Full Export */}
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3 p-3 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] rounded transition-all hover:bg-[#c8ff00]/20"
          >
            <Download className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export All (JSON)</div>
              <div className="text-xs text-[#c8ff00]/70">
                Everything: watchlist, signals, research, settings
              </div>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3 p-3 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] rounded transition-all hover:bg-[#c8ff00]/20"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <div className="text-left">
              <div className="font-mono text-sm">Export Tracker (CSV)</div>
              <div className="text-xs text-[#c8ff00]/70">
                Signal history for spreadsheets
              </div>
            </div>
          </button>

          {/* Research Data Exports */}
          {hasResearchData && (
            <>
              <div className="border-t border-[#262620] pt-3 mt-3">
                <div className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e] mb-2">RESEARCH DATA</div>
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
                  className="w-full flex items-center gap-3 p-3 bg-[#f4f0e6]/10 border border-[#f4f0e6] text-[#f4f0e6] rounded transition-all hover:bg-[#f4f0e6]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Tier 1 Signals (CSV)</div>
                    <div className="text-xs text-[#f4f0e6]/70">
                      {signals.length} watchlist signals
                    </div>
                  </div>
                </button>
              )}

              {scoutResults && scoutResults.length > 0 && (
                <button
                  onClick={handleExportScout}
                  className="w-full flex items-center gap-3 p-3 bg-[#f87171]/10 border border-[#f87171] text-[#f87171] rounded transition-all hover:bg-[#f87171]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Scout Ideas (CSV)</div>
                    <div className="text-xs text-[#f87171]/70">
                      {scoutResults.length} discovery picks
                    </div>
                  </div>
                </button>
              )}

              {buyHoldPicks && buyHoldPicks.length > 0 && (
                <button
                  onClick={handleExportBuyHold}
                  className="w-full flex items-center gap-3 p-3 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] rounded transition-all hover:bg-[#c8ff00]/20"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Buy & Hold (CSV)</div>
                    <div className="text-xs text-[#c8ff00]/70">
                      {buyHoldPicks.length} long-term picks
                    </div>
                  </div>
                </button>
              )}

              {vibe && (
                <button
                  onClick={handleExportVibe}
                  className="w-full flex items-center gap-3 p-3 bg-[#c8ff00]/10 border border-[#c8ff00] text-[#c8ff00] rounded transition-all hover:bg-[#c8ff00]/20"
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-mono text-sm">Export Vibe Check (CSV)</div>
                    <div className="text-xs text-[#c8ff00]/70">
                      Mood read, score {vibe.vibe_score}/100, drivers
                    </div>
                  </div>
                </button>
              )}
            </>
          )}

          {/* Import */}
          <div className="border-t border-[#262620] pt-3 mt-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 bg-[#262620] border border-[#6e6a5e] text-[#f4f0e6] rounded transition-all hover:bg-[#1e1e19]"
            >
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <div className="font-mono text-sm">Import from JSON</div>
                <div className="text-xs text-[#6e6a5e]">Restore from a previous export</div>
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

        <div className="mt-4 pt-3 border-t border-[#262620]">
          <p className="font-mono text-[9px] text-[#6e6a5e] tracking-wide">
            DATA: {watchlist.length} tickers • {trackerLog.length} tracked • {signals?.length || 0} signals • {brief ? "1 brief" : "no brief"}
          </p>
        </div>
      </div>
    </div>
  )
}
