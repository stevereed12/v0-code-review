"use client"

import { useState, useCallback, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { getStoredApiKey, getStoredPolygonKey } from "@/lib/api"
import { PolygonKeyModal } from "./polygon-key-modal"
import type { Tier1Signal } from "@/lib/tier1-types"

// ─── COLORS ──────────────────────────────────────────────────────────────────

const C = {
  accent: "#00e5ff",
  green: "#00ffaa",
  purple: "#a78bfa",
  orange: "#fb923c",
  red: "#f87171",
  yellow: "#facc15",
  muted: "#3d4f6b",
  card: "#0c1020",
  border: "#131c2e",
}

// ─── SIGNAL INDICATOR ────────────────────────────────────────────────────────

function SignalDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div 
      className="flex items-center gap-1.5"
      title={label}
    >
      <div 
        className={`w-2 h-2 rounded-full ${active ? "bg-[#00ffaa]" : "bg-[#3d4f6b]"}`}
      />
      <span className="font-mono text-[9px] text-[#3d4f6b] uppercase tracking-wider">
        {label.slice(0, 3)}
      </span>
    </div>
  )
}

// ─── SCORE BADGE ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 5 ? C.green : score >= 4 ? C.yellow : score >= 3 ? C.orange : C.muted
  return (
    <div 
      className="flex items-center justify-center w-10 h-10 rounded-lg font-mono text-lg font-bold"
      style={{ 
        background: `${color}15`, 
        border: `1px solid ${color}`,
        color 
      }}
    >
      {score}
    </div>
  )
}

// ─── TIER 1 RESULT CARD ──────────────────────────────────────────────────────

function Tier1Card({ 
  signal, 
  onPromote 
}: { 
  signal: Tier1Signal
  onPromote: (ticker: string) => void 
}) {
  const { ticker, name, sector, score, signals, price, changePercent, catalyst, thesis, suggestedPlay, reasoning, optionsData } = signal
  
  return (
    <Card className="bg-[#0c1020] border-[#131c2e] hover:border-[#00e5ff]/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Score */}
          <ScoreBadge score={score} />
          
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-base font-semibold text-[#d6dff0]">{ticker}</span>
                <span className="text-sm text-[#3d4f6b] truncate">{name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-sm text-[#d6dff0]">${price?.toFixed(2)}</span>
                <span 
                  className="font-mono text-xs"
                  style={{ color: changePercent >= 0 ? C.green : C.red }}
                >
                  {changePercent >= 0 ? "+" : ""}{changePercent?.toFixed(2)}%
                </span>
              </div>
            </div>
            
            {/* Reasoning blurb - Why this ticker */}
            {reasoning && (
              <p className="text-[13px] text-[#d6dff0]/90 mb-3 leading-relaxed capitalize">
                {reasoning}
              </p>
            )}
            
            {/* Signal dots */}
            <div className="flex flex-wrap gap-3 mb-3">
              <SignalDot active={signals.nearCatalyst?.active} label="Catalyst" />
              <SignalDot active={signals.consolidating?.active} label="Consolidating" />
              <SignalDot active={signals.aboveSma?.active} label="Above SMA" />
              <SignalDot active={signals.sectorStrong?.active} label="Sector" />
              <SignalDot active={signals.optionsHeat?.active} label="Options" />
              <SignalDot active={signals.volumeBuilding?.active} label="Volume" />
            </div>
            
            {/* Options Heat Info */}
            {optionsData && signals.optionsHeat?.active && (
              <div 
                className="mb-3 p-2 rounded text-xs flex items-center gap-4"
                style={{ background: `${C.orange}10`, border: `1px solid ${C.orange}30` }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[#fb923c] font-mono">C/P:</span>
                  <span className="text-[#d6dff0] font-mono">{optionsData.callPutRatio.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#fb923c] font-mono">ATM:</span>
                  <span className="text-[#d6dff0] font-mono">{optionsData.atmCallSkew.toFixed(0)}%</span>
                </div>
                {optionsData.unusualCallActivity && (
                  <span className="text-[#fb923c] text-[10px] font-mono uppercase tracking-wider">Unusual</span>
                )}
              </div>
            )}
            
            {/* Catalyst info */}
            {catalyst && (
              <div 
                className="mb-3 p-2 rounded text-xs"
                style={{ background: `${C.purple}10`, border: `1px solid ${C.purple}30` }}
              >
                <span className="text-[#a78bfa] font-mono uppercase tracking-wider">
                  {catalyst.type}
                </span>
                <span className="text-[#d6dff0] ml-2">
                  {catalyst.description} - {catalyst.daysUntil} days
                </span>
              </div>
            )}
            
            {/* Thesis (from Claude enrichment) */}
            {thesis && (
              <p className="text-sm text-[#d6dff0]/80 mb-2 leading-relaxed">{thesis}</p>
            )}
            
            {/* Suggested play */}
            {suggestedPlay && (
              <p className="text-sm font-medium" style={{ color: C.accent }}>{suggestedPlay}</p>
            )}
            
            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#131c2e]">
              <Badge variant="outline" className="font-mono text-[10px] text-[#3d4f6b] border-[#131c2e]">
                {sector}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 px-3 text-xs font-mono text-[#00e5ff] hover:bg-[#00e5ff]/10"
                onClick={() => onPromote(ticker)}
              >
                + WATCHLIST
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── MAIN SCANNER COMPONENT ──────────────────────────────────────────��───────

 interface Tier1ScannerProps {
  polygonKey?: string | null
  onPromoteToWatchlist: (ticker: string) => void
  }
  
  export function Tier1Scanner({ polygonKey, onPromoteToWatchlist }: Tier1ScannerProps) {
  const [results, setResults] = useState<Tier1Signal[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [scanStats, setScanStats] = useState<{ total: number; matches: number } | null>(null)
  const [minScore, setMinScore] = useState(2) // Start lower for wider net
  const [showPolygonKeyModal, setShowPolygonKeyModal] = useState(false)
  const [hasPolygonKey, setHasPolygonKey] = useState(() => !!polygonKey || !!getStoredPolygonKey())

  // Restore last scan from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("white80_last_tier1_scan")
      if (saved) {
        const parsed = JSON.parse(saved)
        setResults(parsed.results || [])
        setLastScan(parsed.lastScan || null)
        setScanStats(parsed.scanStats || null)
      }
    } catch {}
  }, [])

  // Save scan results to localStorage when they change
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem("white80_last_tier1_scan", JSON.stringify({ results, lastScan, scanStats }))
    }
  }, [results, lastScan, scanStats])

  const runScan = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLoadingPhase("Fetching market data from Polygon...")
    
    try {
      // Step 1: Run Polygon scan for technical signals
      // Use prop key first (from Supabase profile), fallback to localStorage
      const clientPolygonKey = polygonKey || getStoredPolygonKey()
      const scanRes = await fetch("/api/tier1-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          config: { 
            minScore: minScore - 1, // Allow one less since catalyst is pending
            maxResults: 50,
          },
          clientPolygonKey,
        }),
      })
      
      const scanJson = await scanRes.json()
      if (scanJson.error) throw new Error(scanJson.error)
      
      const rawResults: Tier1Signal[] = scanJson.data?.matches || []
      setScanStats({ 
        total: scanJson.data?.totalScanned || 0, 
        matches: rawResults.length 
      })
      
      if (rawResults.length === 0) {
        setResults([])
        setLastScan(new Date().toLocaleTimeString())
        setLoading(false)
        return
      }
      
      // Step 2: Get catalyst data from Claude
      setLoadingPhase("Scanning for upcoming catalysts...")
      
      const tickersForCatalyst = rawResults.slice(0, 30).map(r => r.ticker)
      const clientApiKey = getStoredApiKey()
      
      const catalystRes = await fetch("/api/catalysts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tickers: tickersForCatalyst,
          clientApiKey,
        }),
      })
      
      const catalystJson = await catalystRes.json()
      const catalystMap = catalystJson.data || {}
      
      // Step 3: Merge catalyst data and recalculate scores
      setLoadingPhase("Calculating final scores...")
      
      const enrichedResults = rawResults.map(result => {
        const catalyst = catalystMap[result.ticker]
        const hasCatalyst = catalyst?.hasCatalyst && 
          catalyst.daysUntil >= 7 && 
          catalyst.daysUntil <= 28
        
        // Update the nearCatalyst signal
        const updatedSignals = {
          ...result.signals,
          nearCatalyst: {
            active: hasCatalyst,
            value: catalyst?.daysUntil,
            detail: catalyst?.description || "No catalyst found",
          }
        }
        
        // Recalculate score
        const newScore = Object.values(updatedSignals).filter(s => s.active).length
        
        return {
          ...result,
          signals: updatedSignals,
          score: newScore,
          catalyst: hasCatalyst ? {
            type: catalyst.type as Tier1Signal["catalyst"]["type"],
            date: catalyst.date,
            daysUntil: catalyst.daysUntil,
            description: catalyst.description,
          } : undefined,
        }
      })
      
      // Filter by minimum score and sort
      const filtered = enrichedResults
        .filter(r => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, 25)
      
      setResults(filtered)
      setLastScan(new Date().toLocaleTimeString())
    } catch (err) {
      const message = (err as Error).message
      if (message === "POLYGON_KEY_REQUIRED" || message.includes("POLYGON_KEY_REQUIRED")) {
        setShowPolygonKeyModal(true)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
      setLoadingPhase("")
    }
  }, [minScore, polygonKey])
  
  return (
    <div className="space-y-4">
      {/* Polygon Key Modal */}
      {showPolygonKeyModal && (
        <PolygonKeyModal
          onKeySet={() => {
            setShowPolygonKeyModal(false)
            setHasPolygonKey(true)
          }}
          onClose={() => setShowPolygonKeyModal(false)}
        />
      )}

      {/* Polygon Key Status Banner */}
      {!hasPolygonKey && (
        <button
          onClick={() => setShowPolygonKeyModal(true)}
          className="w-full p-3 bg-[#fb923c]/10 border border-[#fb923c]/40 rounded flex items-center justify-center gap-2 text-[#fb923c] font-mono text-sm hover:bg-[#fb923c]/20 transition-colors"
        >
          <span>Polygon API Key Required</span>
          <span className="text-xs opacity-70">Click to add your key for market data</span>
        </button>
      )}

      {/* Header */}
      <Card className="bg-[#090c14] border-[#131c2e]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-serif text-[#d6dff0]">
                Tier 1 Alpha Scanner
              </CardTitle>
              <p className="text-xs text-[#3d4f6b] mt-1 font-mono tracking-wide">
                S&P 500 + NASDAQ 100 | 6-SIGNAL SCORING
              </p>
            </div>
            {lastScan && (
              <span className="text-xs text-[#3d4f6b] font-mono">
                Last scan: {lastScan}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Min score selector - now starts at 1 for maximum visibility */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#3d4f6b] font-mono">MIN SCORE:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <button
                    key={s}
                    onClick={() => setMinScore(s)}
                    className={`w-7 h-7 rounded font-mono text-sm transition-colors ${
                      minScore === s 
                        ? "bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]" 
                        : "bg-[#0c1020] text-[#3d4f6b] border border-[#131c2e] hover:border-[#3d4f6b]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-[#3d4f6b] ml-1">
                {minScore <= 2 ? "(wide net)" : minScore >= 5 ? "(very selective)" : "(balanced)"}
              </span>
            </div>
            
            {/* Scan button */}
            <Button
              onClick={runScan}
              disabled={loading}
              className="ml-auto bg-transparent border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/10 font-mono tracking-wider"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  SCANNING...
                </>
              ) : (
                "RUN SCAN"
              )}
            </Button>
          </div>
          
          {/* Loading phase indicator */}
          {loading && loadingPhase && (
            <div className="mb-4 p-3 rounded bg-[#00e5ff]/5 border border-[#00e5ff]/20">
              <p className="text-xs text-[#00e5ff] font-mono">{loadingPhase}</p>
            </div>
          )}
          
          {/* Stats */}
          {scanStats && !loading && (
            <div className="flex gap-6 mb-4">
              <div>
                <span className="text-xs text-[#3d4f6b] font-mono">SCANNED</span>
                <p className="text-lg font-mono text-[#d6dff0]">{scanStats.total}</p>
              </div>
              <div>
                <span className="text-xs text-[#3d4f6b] font-mono">MATCHES</span>
                <p className="text-lg font-mono text-[#00ffaa]">{results.length}</p>
              </div>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded bg-[#f87171]/10 border border-[#f87171]/40">
              <p className="text-xs text-[#f87171] font-mono">ERROR: {error}</p>
            </div>
          )}
          
          {/* Signal legend */}
          <div className="flex flex-wrap gap-4 p-3 rounded bg-[#0c1020] border border-[#131c2e]">
            <div className="text-[10px] text-[#3d4f6b] font-mono uppercase tracking-wider">
              SIGNALS:
            </div>
            {[
              { key: "CAT", label: "Near Catalyst (1-4 wks)" },
              { key: "CON", label: "Consolidating" },
              { key: "SMA", label: "Above 20-SMA" },
              { key: "SEC", label: "Sector Outperforming" },
              { key: "OPT", label: "Options Heat" },
              { key: "VOL", label: "Volume Building" },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00ffaa]" />
                <span className="text-[10px] text-[#3d4f6b]">{s.key}: {s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Results */}
      {!loading && results.length === 0 && lastScan && (
        <div className="text-center py-12">
          <p className="text-sm text-[#3d4f6b] font-mono">
            No setups found matching {minScore}+ signals.
          </p>
          <p className="text-xs text-[#3d4f6b] mt-2">
            Try lowering the minimum score or check back later.
          </p>
        </div>
      )}
      
      {!loading && results.length === 0 && !lastScan && (
        <div className="text-center py-12">
          <p className="text-sm text-[#3d4f6b] font-mono">
            Run a scan to find coiled-spring setups across 150+ names.
          </p>
          <p className="text-xs text-[#3d4f6b] mt-2">
            Scans S&P 500 + Nasdaq 100 for the 6-signal alpha pattern.
          </p>
        </div>
      )}
      
      <div className="grid gap-3">
        {results.map(signal => (
          <Tier1Card 
            key={signal.ticker} 
            signal={signal} 
            onPromote={onPromoteToWatchlist}
          />
        ))}
      </div>
    </div>
  )
}
