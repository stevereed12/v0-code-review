"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { askClaude, ApiKeyRequiredError, fetchLivePrices } from "@/lib/api"
import { buildQuickThesisPrompt, type QuickThesis } from "@/lib/prompts"
import { Search, TrendingUp, TrendingDown, Minus, Target, Shield, Zap, Plus } from "lucide-react"

const C = {
  accent: "#00e5ff",
  green: "#00ffaa",
  red: "#f87171",
  orange: "#fb923c",
  purple: "#a78bfa",
  yellow: "#facc15",
}

interface QuickThesisProps {
  onAddToWatchlist?: (ticker: string) => void
  onApiKeyRequired?: () => void
}

export function QuickThesisSearch({ onAddToWatchlist, onApiKeyRequired }: QuickThesisProps) {
  const [ticker, setTicker] = useState("")
  const [loading, setLoading] = useState(false)
  const [thesis, setThesis] = useState<QuickThesis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runThesis = async () => {
    if (!ticker.trim()) return
    
    const symbol = ticker.trim().toUpperCase()
    setLoading(true)
    setError(null)
    setThesis(null)

    try {
      // Try to get current price first
      let currentPrice: number | undefined
      try {
        const prices = await fetchLivePrices([symbol])
        currentPrice = prices[symbol]?.price
      } catch {
        // Continue without price - prompt will search for it
      }

      const result = await askClaude<QuickThesis>(buildQuickThesisPrompt(symbol, currentPrice))
      setThesis(result)
    } catch (err) {
      if (err instanceof ApiKeyRequiredError) {
        onApiKeyRequired?.()
      } else {
        setError(err instanceof Error ? err.message : "Failed to generate thesis")
      }
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY": return C.green
      case "SELL": return C.red
      case "HOLD": return C.yellow
      case "WATCH": return C.accent
      case "AVOID": return C.red
      default: return C.accent
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UPTREND": return <TrendingUp className="w-4 h-4 text-[#00ffaa]" />
      case "DOWNTREND": return <TrendingDown className="w-4 h-4 text-[#f87171]" />
      default: return <Minus className="w-4 h-4 text-[#facc15]" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3d4f6b]" />
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && runThesis()}
            placeholder="Enter ticker symbol (e.g., NVDA)"
            className="pl-10 bg-[#0c1020] border-[#131c2e] text-[#d6dff0] font-mono placeholder:text-[#3d4f6b]"
          />
        </div>
        <Button
          onClick={runThesis}
          disabled={loading || !ticker.trim()}
          className="bg-[#00e5ff]/10 border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff]/20 font-mono"
        >
          {loading ? "ANALYZING..." : "GET THESIS"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/40 rounded p-3 text-sm text-[#f87171]">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
          <div className="mt-3 font-mono text-xs text-[#3d4f6b]">
            Running deep research on {ticker}...
          </div>
        </div>
      )}

      {/* Results */}
      {thesis && !loading && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-[#d6dff0]">{thesis.ticker}</span>
                <span className="text-[#3d4f6b]">{thesis.name}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-[#d6dff0] font-mono">${thesis.price?.toFixed(2)}</span>
                <span className="text-[#3d4f6b]">{thesis.sector}</span>
                <span className="text-[#3d4f6b]">{thesis.market_cap}</span>
              </div>
            </div>
            {onAddToWatchlist && (
              <Button
                onClick={() => onAddToWatchlist(thesis.ticker)}
                size="sm"
                variant="outline"
                className="border-[#00ffaa]/40 text-[#00ffaa] hover:bg-[#00ffaa]/10"
              >
                <Plus className="w-4 h-4 mr-1" /> Add to Watchlist
              </Button>
            )}
          </div>

          {/* Verdict Banner */}
          <div
            className="rounded-lg p-4"
            style={{
              background: `linear-gradient(135deg, ${getActionColor(thesis.verdict.action)}15 0%, transparent 100%)`,
              border: `1px solid ${getActionColor(thesis.verdict.action)}40`,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className="font-mono text-sm font-bold px-3 py-1 rounded"
                style={{
                  color: getActionColor(thesis.verdict.action),
                  background: `${getActionColor(thesis.verdict.action)}20`,
                }}
              >
                {thesis.verdict.action}
              </span>
              <span className="text-xs text-[#3d4f6b] font-mono">
                {thesis.verdict.conviction} CONVICTION | {thesis.verdict.timeframe}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-[#d6dff0]">{thesis.verdict.summary}</p>
          </div>

          {/* Core Thesis */}
          <Card className="bg-[#0c1020] border-[#131c2e]">
            <CardContent className="p-4">
              <div className="font-mono text-[10px] tracking-[2px] text-[#00e5ff] mb-2">THESIS</div>
              <p className="text-[14px] leading-relaxed text-[#d6dff0]">{thesis.thesis}</p>
            </CardContent>
          </Card>

          {/* Bull / Bear Cases */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0c1020] border-[#131c2e]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#00ffaa]" />
                  <span className="font-mono text-[10px] tracking-[2px] text-[#00ffaa]">BULL CASE</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#d6dff0]">{thesis.bull_case}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#0c1020] border-[#131c2e]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-[#f87171]" />
                  <span className="font-mono text-[10px] tracking-[2px] text-[#f87171]">BEAR CASE</span>
                </div>
                <p className="text-[13px] leading-relaxed text-[#d6dff0]">{thesis.bear_case}</p>
              </CardContent>
            </Card>
          </div>

          {/* Catalysts */}
          {thesis.catalysts && thesis.catalysts.length > 0 && (
            <Card className="bg-[#0c1020] border-[#131c2e]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[#fb923c]" />
                  <span className="font-mono text-[10px] tracking-[2px] text-[#fb923c]">UPCOMING CATALYSTS</span>
                </div>
                <div className="space-y-2">
                  {thesis.catalysts.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#090c14] rounded px-3 py-2">
                      <span className="text-[13px] text-[#d6dff0]">{cat.event}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-[#3d4f6b]">{cat.date}</span>
                        <span
                          className="font-mono text-[9px] px-2 py-0.5 rounded"
                          style={{
                            color: cat.impact === "HIGH" ? C.red : cat.impact === "MEDIUM" ? C.orange : C.accent,
                            background: cat.impact === "HIGH" ? `${C.red}20` : cat.impact === "MEDIUM" ? `${C.orange}20` : `${C.accent}20`,
                          }}
                        >
                          {cat.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technicals & Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technicals */}
            <Card className="bg-[#0c1020] border-[#131c2e]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-[#a78bfa]" />
                  <span className="font-mono text-[10px] tracking-[2px] text-[#a78bfa]">TECHNICALS</span>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#3d4f6b]">Trend</span>
                    <span className="flex items-center gap-1.5 text-[#d6dff0]">
                      {getTrendIcon(thesis.technicals.trend)}
                      {thesis.technicals.trend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3d4f6b]">Support</span>
                    <span className="text-[#00ffaa] font-mono">${thesis.technicals.support?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#3d4f6b]">Resistance</span>
                    <span className="text-[#f87171] font-mono">${thesis.technicals.resistance?.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#131c2e]">
                    <span className="text-[#3d4f6b] text-[11px]">RSI: </span>
                    <span className="text-[#d6dff0] text-[12px]">{thesis.technicals.rsi_read}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options Take */}
            <Card className="bg-[#0c1020] border-[#131c2e]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-[#facc15]" />
                  <span className="font-mono text-[10px] tracking-[2px] text-[#facc15]">OPTIONS TAKE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded"
                      style={{
                        color: thesis.options_take.sentiment === "BULLISH" ? C.green : thesis.options_take.sentiment === "BEARISH" ? C.red : C.yellow,
                        background: thesis.options_take.sentiment === "BULLISH" ? `${C.green}20` : thesis.options_take.sentiment === "BEARISH" ? `${C.red}20` : `${C.yellow}20`,
                      }}
                    >
                      {thesis.options_take.sentiment}
                    </span>
                  </div>
                  <div className="bg-[#090c14] rounded px-3 py-2">
                    <div className="font-mono text-[12px] text-[#00e5ff] mb-1">{thesis.options_take.suggested_play}</div>
                    <div className="text-[11px] text-[#3d4f6b]">{thesis.options_take.reasoning}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!thesis && !loading && !error && (
        <div className="text-center py-12 text-[#3d4f6b]">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="font-mono text-sm">Enter any ticker to get a full thesis</div>
          <div className="text-xs mt-1">Price, catalysts, technicals, options plays, bull/bear cases</div>
        </div>
      )}
    </div>
  )
}
