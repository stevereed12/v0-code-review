"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, TrendingUp, TrendingDown, Check, X, ChevronDown, ChevronRight, Upload, Trash2 } from "lucide-react"
import type { TrackedSignal, ExtractedTrade, Signal, Brief } from "@/lib/types"

interface SignalTrackerProps {
  signals: Signal[]
  brief: Brief | null
  onImportTrades?: (trades: ExtractedTrade[]) => void
}

const SOURCES = ["WATCHLIST", "TOP_PLAY", "TIER1", "THESIS", "BUY_HOLD", "SCOUT", "MANUAL"] as const

export function SignalTracker({ signals, brief }: SignalTrackerProps) {
  const [trackedSignals, setTrackedSignals] = useState<TrackedSignal[]>([])
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [showAddSignal, setShowAddSignal] = useState(false)
  const [newSignal, setNewSignal] = useState({
    ticker: "",
    source: "MANUAL" as TrackedSignal["source"],
    signalType: "BUY" as TrackedSignal["signalType"],
    play: "",
    signalPrice: 0,
    conviction: "MEDIUM" as TrackedSignal["conviction"],
  })

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("white80_tracked_signals")
    if (saved) {
      setTrackedSignals(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (trackedSignals.length > 0) {
      localStorage.setItem("white80_tracked_signals", JSON.stringify(trackedSignals))
    }
  }, [trackedSignals])

  // Expand today's date by default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setExpandedDates(new Set([today]))
  }, [])

  // Auto-import Top Plays from brief when generated
  useEffect(() => {
    if (!brief?.top_plays || brief.top_plays.length === 0) return
    
    const today = new Date().toISOString().split("T")[0]
    
    setTrackedSignals(prev => {
      // Check which top plays are already logged today (by ticker + date)
      const existingToday = new Set(
        prev
          .filter(s => s.date === today && s.source === "TOP_PLAY")
          .map(s => s.ticker)
      )
      
      // Only add new ones
      const newSignals: TrackedSignal[] = brief.top_plays
        .filter(play => !existingToday.has(play.ticker))
        .map(play => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date: today,
          ticker: play.ticker,
          source: "TOP_PLAY" as const,
          signalType: play.action as "BUY" | "SELL" | "FADE",
          play: play.play,
          signalPrice: 0, // We don't have exact price from brief
          conviction: play.conviction,
          took: null,
          outcome: null,
          notes: play.thesis,
        }))
      
      if (newSignals.length === 0) return prev
      return [...newSignals, ...prev]
    })
  }, [brief?.top_plays])

  // Group signals by date
  const signalsByDate = useMemo(() => {
    const grouped: Record<string, TrackedSignal[]> = {}
    trackedSignals.forEach(sig => {
      if (!grouped[sig.date]) grouped[sig.date] = []
      grouped[sig.date].push(sig)
    })
    // Sort dates descending (newest first)
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
  }, [trackedSignals])

  // Calculate metrics
  const metrics = useMemo(() => {
    const decided = trackedSignals.filter(s => s.outcome !== null && s.outcome !== "OPEN")
    const took = trackedSignals.filter(s => s.took === true)
    const passed = trackedSignals.filter(s => s.took === false)
    
    const wins = decided.filter(s => s.outcome === "WIN").length
    const losses = decided.filter(s => s.outcome === "LOSS").length
    const missedWins = decided.filter(s => s.outcome === "MISSED_WIN").length
    const goodPasses = decided.filter(s => s.outcome === "GOOD_PASS").length
    
    const totalPnL = took.reduce((sum, s) => sum + (s.pnlDollars || 0), 0)
    const winPnL = took.filter(s => s.outcome === "WIN").reduce((sum, s) => sum + (s.pnlDollars || 0), 0)
    const lossPnL = took.filter(s => s.outcome === "LOSS").reduce((sum, s) => sum + (s.pnlDollars || 0), 0)
    
    return {
      total: trackedSignals.length,
      took: took.length,
      passed: passed.length,
      open: trackedSignals.filter(s => s.outcome === "OPEN").length,
      wins,
      losses,
      missedWins,
      goodPasses,
      winRate: wins + losses > 0 ? (wins / (wins + losses) * 100).toFixed(1) : "—",
      signalQuality: missedWins + goodPasses > 0 
        ? ((missedWins / (missedWins + goodPasses)) * 100).toFixed(1) 
        : "—",
      totalPnL,
      avgWin: wins > 0 ? winPnL / wins : 0,
      avgLoss: losses > 0 ? Math.abs(lossPnL) / losses : 0,
    }
  }, [trackedSignals])

  const addSignal = () => {
    const today = new Date().toISOString().split("T")[0]
    const signal: TrackedSignal = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      ticker: newSignal.ticker.toUpperCase(),
      source: newSignal.source,
      signalType: newSignal.signalType,
      play: newSignal.play,
      signalPrice: newSignal.signalPrice,
      conviction: newSignal.conviction,
      took: null,
      outcome: null,
    }
    setTrackedSignals(prev => [signal, ...prev])
    setNewSignal({
      ticker: "",
      source: "MANUAL",
      signalType: "BUY",
      play: "",
      signalPrice: 0,
      conviction: "MEDIUM",
    })
    setShowAddSignal(false)
  }

  const updateSignal = (id: string, updates: Partial<TrackedSignal>) => {
    setTrackedSignals(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const deleteSignal = (id: string) => {
    setTrackedSignals(prev => prev.filter(s => s.id !== id))
  }

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  // Import signals from watchlist
  const importFromWatchlist = () => {
    const today = new Date().toISOString().split("T")[0]
    const newSignals: TrackedSignal[] = signals.map(s => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      ticker: s.ticker,
      source: "WATCHLIST" as const,
      signalType: s.signal === "FADE" ? "FADE" as const : s.signal === "SELL" ? "SELL" as const : "BUY" as const,
      play: s.play,
      signalPrice: s.price,
      conviction: s.risk === "Low" ? "HIGH" as const : s.risk === "High" ? "LOW" as const : "MEDIUM" as const,
      took: null,
      outcome: null,
    }))
    setTrackedSignals(prev => [...newSignals, ...prev])
  }

  // Import from Top Plays
  const importFromTopPlays = () => {
    if (!brief?.top_plays) return
    const today = new Date().toISOString().split("T")[0]
    const newSignals: TrackedSignal[] = brief.top_plays.map(p => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      ticker: p.ticker,
      source: "TOP_PLAY" as const,
      signalType: p.action === "FADE" ? "FADE" as const : p.action === "SELL" ? "SELL" as const : "BUY" as const,
      play: p.play,
      signalPrice: 0, // Would need to fetch
      conviction: p.conviction,
      took: null,
      outcome: null,
    }))
    setTrackedSignals(prev => [...newSignals, ...prev])
  }

  return (
    <div className="space-y-4">
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard label="TOTAL SIGNALS" value={metrics.total} />
        <MetricCard label="TOOK" value={metrics.took} color="#00e5ff" />
        <MetricCard label="PASSED" value={metrics.passed} color="#3d4f6b" />
        <MetricCard label="OPEN" value={metrics.open} color="#fbbf24" />
        <MetricCard label="WIN RATE" value={`${metrics.winRate}%`} color="#00ffaa" />
        <MetricCard 
          label="TOTAL P/L" 
          value={`$${metrics.totalPnL.toFixed(0)}`} 
          color={metrics.totalPnL >= 0 ? "#00ffaa" : "#f87171"} 
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="WINS" value={metrics.wins} color="#00ffaa" small />
        <MetricCard label="LOSSES" value={metrics.losses} color="#f87171" small />
        <MetricCard label="MISSED WINS" value={metrics.missedWins} color="#fb923c" small />
        <MetricCard label="GOOD PASSES" value={metrics.goodPasses} color="#00e5ff" small />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddSignal(!showAddSignal)}
          className="bg-[#0c1020] border-[#131c2e] text-[#00e5ff] hover:bg-[#131c2e] font-mono text-[10px]"
        >
          <Plus className="w-3 h-3 mr-1" /> ADD SIGNAL
        </Button>
        {signals.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={importFromWatchlist}
            className="bg-[#0c1020] border-[#131c2e] text-[#00ffaa] hover:bg-[#131c2e] font-mono text-[10px]"
          >
            <Upload className="w-3 h-3 mr-1" /> IMPORT WATCHLIST ({signals.length})
          </Button>
        )}
        {brief?.top_plays && brief.top_plays.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={importFromTopPlays}
            className="bg-[#0c1020] border-[#131c2e] text-[#fb923c] hover:bg-[#131c2e] font-mono text-[10px]"
          >
            <Upload className="w-3 h-3 mr-1" /> IMPORT TOP PLAYS ({brief.top_plays.length})
          </Button>
        )}
      </div>

      {/* Add Signal Form */}
      {showAddSignal && (
        <Card className="bg-[#0c1020] border-[#131c2e]">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">TICKER</label>
                <Input
                  value={newSignal.ticker}
                  onChange={e => setNewSignal(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                  className="bg-[#090c14] border-[#131c2e] text-white font-mono text-sm h-8"
                  placeholder="AAPL"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">SOURCE</label>
                <select
                  value={newSignal.source}
                  onChange={e => setNewSignal(p => ({ ...p, source: e.target.value as TrackedSignal["source"] }))}
                  className="w-full bg-[#090c14] border border-[#131c2e] rounded text-white font-mono text-xs h-8 px-2"
                >
                  {SOURCES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">TYPE</label>
                <select
                  value={newSignal.signalType}
                  onChange={e => setNewSignal(p => ({ ...p, signalType: e.target.value as TrackedSignal["signalType"] }))}
                  className="w-full bg-[#090c14] border border-[#131c2e] rounded text-white font-mono text-xs h-8 px-2"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                  <option value="FADE">FADE</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">CONVICTION</label>
                <select
                  value={newSignal.conviction}
                  onChange={e => setNewSignal(p => ({ ...p, conviction: e.target.value as TrackedSignal["conviction"] }))}
                  className="w-full bg-[#090c14] border border-[#131c2e] rounded text-white font-mono text-xs h-8 px-2"
                >
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">PLAY</label>
                <Input
                  value={newSignal.play}
                  onChange={e => setNewSignal(p => ({ ...p, play: e.target.value }))}
                  className="bg-[#090c14] border-[#131c2e] text-white font-mono text-xs h-8"
                  placeholder="$185 calls exp 5/23"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">SIGNAL PRICE</label>
                <Input
                  type="number"
                  value={newSignal.signalPrice || ""}
                  onChange={e => setNewSignal(p => ({ ...p, signalPrice: parseFloat(e.target.value) || 0 }))}
                  className="bg-[#090c14] border-[#131c2e] text-white font-mono text-xs h-8"
                  placeholder="185.50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addSignal}
                disabled={!newSignal.ticker}
                className="bg-[#00ffaa]/20 text-[#00ffaa] hover:bg-[#00ffaa]/30 font-mono text-[10px]"
              >
                ADD
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddSignal(false)}
                className="text-[#3d4f6b] hover:text-white font-mono text-[10px]"
              >
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signals by Date */}
      <div className="space-y-2">
        {signalsByDate.map(([date, daySignals]) => (
          <div key={date} className="bg-[#0c1020] border border-[#131c2e] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleDate(date)}
              className="w-full flex items-center justify-between p-3 hover:bg-[#131c2e]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedDates.has(date) ? (
                  <ChevronDown className="w-4 h-4 text-[#3d4f6b]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#3d4f6b]" />
                )}
                <span className="font-mono text-sm text-white">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", { 
                    weekday: "short", month: "short", day: "numeric" 
                  })}
                </span>
                <span className="font-mono text-[10px] text-[#3d4f6b]">
                  {daySignals.length} signal{daySignals.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2">
                {daySignals.filter(s => s.outcome === "WIN").length > 0 && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00ffaa]/15 text-[#00ffaa]">
                    {daySignals.filter(s => s.outcome === "WIN").length}W
                  </span>
                )}
                {daySignals.filter(s => s.outcome === "LOSS").length > 0 && (
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#f87171]/15 text-[#f87171]">
                    {daySignals.filter(s => s.outcome === "LOSS").length}L
                  </span>
                )}
              </div>
            </button>

            {expandedDates.has(date) && (
              <div className="border-t border-[#131c2e] p-3 space-y-2">
                {daySignals.map(signal => (
                  <SignalRow
                    key={signal.id}
                    signal={signal}
                    onUpdate={updateSignal}
                    onDelete={deleteSignal}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {trackedSignals.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-10 h-10 text-[#3d4f6b] mx-auto mb-3" />
            <p className="text-[#3d4f6b] font-mono text-sm">No signals tracked yet</p>
            <p className="text-[#3d4f6b]/60 font-mono text-xs mt-1">
              Add signals manually or import from Watchlist / Top Plays
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, color = "#d6dff0", small = false }: { 
  label: string
  value: string | number
  color?: string
  small?: boolean
}) {
  return (
    <div className={`bg-[#0c1020] border border-[#131c2e] rounded p-${small ? "2" : "3"} text-center`}>
      <div 
        className={`font-mono font-bold ${small ? "text-lg" : "text-xl"}`}
        style={{ color }}
      >
        {value}
      </div>
      <div className={`font-mono ${small ? "text-[8px]" : "text-[9px]"} tracking-wider text-[#3d4f6b]`}>
        {label}
      </div>
    </div>
  )
}

function SignalRow({ signal, onUpdate, onDelete }: {
  signal: TrackedSignal
  onUpdate: (id: string, updates: Partial<TrackedSignal>) => void
  onDelete: (id: string) => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const [entryPrice, setEntryPrice] = useState(signal.entryPrice?.toString() || "")
  const [exitPrice, setExitPrice] = useState(signal.exitPrice?.toString() || "")
  const [quantity, setQuantity] = useState(signal.quantity?.toString() || "")

  const handleTook = (took: boolean) => {
    onUpdate(signal.id, { took, outcome: took ? "OPEN" : null })
  }

  const handleOutcome = (outcome: TrackedSignal["outcome"]) => {
    let pnlDollars: number | undefined
    let pnlPercent: number | undefined

    if (signal.took && outcome === "WIN" || outcome === "LOSS") {
      const entry = parseFloat(entryPrice) || signal.signalPrice
      const exit = parseFloat(exitPrice) || 0
      const qty = parseFloat(quantity) || 1
      
      if (entry && exit) {
        pnlDollars = (exit - entry) * qty
        pnlPercent = ((exit - entry) / entry) * 100
      }
    }

    onUpdate(signal.id, { 
      outcome, 
      entryPrice: parseFloat(entryPrice) || undefined,
      exitPrice: parseFloat(exitPrice) || undefined,
      quantity: parseFloat(quantity) || undefined,
      pnlDollars,
      pnlPercent,
      closedAt: outcome !== "OPEN" ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div className="bg-[#090c14] border border-[#131c2e] rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">{signal.ticker}</span>
          <span className={`font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded ${
            signal.signalType === "BUY" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
            signal.signalType === "SELL" ? "bg-[#f87171]/15 text-[#f87171]" :
            "bg-[#fb923c]/15 text-[#fb923c]"
          }`}>
            {signal.signalType}
          </span>
          <span className="font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-[#3d4f6b]/20 text-[#3d4f6b]">
            {signal.source.replace("_", " ")}
          </span>
          <span className={`font-mono text-[9px] tracking-wider ${
            signal.conviction === "HIGH" ? "text-[#00ffaa]" :
            signal.conviction === "MEDIUM" ? "text-[#fbbf24]" :
            "text-[#3d4f6b]"
          }`}>
            {signal.conviction}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Outcome Badge */}
          {signal.outcome && signal.outcome !== "OPEN" && (
            <span className={`font-mono text-[9px] tracking-wider px-2 py-0.5 rounded ${
              signal.outcome === "WIN" ? "bg-[#00ffaa]/15 text-[#00ffaa]" :
              signal.outcome === "LOSS" ? "bg-[#f87171]/15 text-[#f87171]" :
              signal.outcome === "EVEN" ? "bg-[#3d4f6b]/15 text-[#3d4f6b]" :
              signal.outcome === "MISSED_WIN" ? "bg-[#fb923c]/15 text-[#fb923c]" :
              "bg-[#00e5ff]/15 text-[#00e5ff]"
            }`}>
              {signal.outcome.replace("_", " ")}
              {signal.pnlDollars !== undefined && signal.pnlDollars !== 0 && (
                <span className="ml-1">${signal.pnlDollars.toFixed(0)}</span>
              )}
            </span>
          )}
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[#3d4f6b] hover:text-white transition-colors"
          >
            {showDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => onDelete(signal.id)}
            className="text-[#3d4f6b] hover:text-[#f87171] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Play Info */}
      <div className="text-[11px] text-[#00e5ff] font-mono mb-2">{signal.play}</div>
      
      {/* Decision Row */}
      {signal.took === null && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleTook(true)}
            className="flex items-center gap-1 font-mono text-[9px] tracking-wider px-2 py-1 rounded bg-[#00ffaa]/10 text-[#00ffaa] hover:bg-[#00ffaa]/20 transition-colors"
          >
            <Check className="w-3 h-3" /> TOOK IT
          </button>
          <button
            onClick={() => handleTook(false)}
            className="flex items-center gap-1 font-mono text-[9px] tracking-wider px-2 py-1 rounded bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 transition-colors"
          >
            <X className="w-3 h-3" /> PASSED
          </button>
        </div>
      )}

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-[#131c2e] space-y-3">
          {signal.took === true && signal.outcome === "OPEN" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-mono text-[8px] text-[#3d4f6b]">ENTRY $</label>
                  <Input
                    type="number"
                    value={entryPrice}
                    onChange={e => setEntryPrice(e.target.value)}
                    className="bg-[#0c1020] border-[#131c2e] text-white font-mono text-xs h-7"
                    placeholder={signal.signalPrice.toString()}
                  />
                </div>
                <div>
                  <label className="font-mono text-[8px] text-[#3d4f6b]">EXIT $</label>
                  <Input
                    type="number"
                    value={exitPrice}
                    onChange={e => setExitPrice(e.target.value)}
                    className="bg-[#0c1020] border-[#131c2e] text-white font-mono text-xs h-7"
                  />
                </div>
                <div>
                  <label className="font-mono text-[8px] text-[#3d4f6b]">QTY</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="bg-[#0c1020] border-[#131c2e] text-white font-mono text-xs h-7"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOutcome("WIN")}
                  className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#00ffaa]/10 text-[#00ffaa] hover:bg-[#00ffaa]/20"
                >
                  WIN
                </button>
                <button
                  onClick={() => handleOutcome("LOSS")}
                  className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20"
                >
                  LOSS
                </button>
                <button
                  onClick={() => handleOutcome("EVEN")}
                  className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#3d4f6b]/10 text-[#3d4f6b] hover:bg-[#3d4f6b]/20"
                >
                  EVEN
                </button>
              </div>
            </>
          )}

          {signal.took === false && !signal.outcome && (
            <div className="flex gap-2">
              <button
                onClick={() => handleOutcome("MISSED_WIN")}
                className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#fb923c]/10 text-[#fb923c] hover:bg-[#fb923c]/20"
              >
                WOULD HAVE WON
              </button>
              <button
                onClick={() => handleOutcome("GOOD_PASS")}
                className="font-mono text-[9px] tracking-wider px-3 py-1 rounded bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff]/20"
              >
                GOOD PASS
              </button>
            </div>
          )}

          {/* Undo decision */}
          {signal.took !== null && (
            <button
              onClick={() => onUpdate(signal.id, { took: null, outcome: null, pnlDollars: undefined, pnlPercent: undefined })}
              className="font-mono text-[8px] text-[#3d4f6b] hover:text-white"
            >
              UNDO DECISION
            </button>
          )}
        </div>
      )}
    </div>
  )
}
