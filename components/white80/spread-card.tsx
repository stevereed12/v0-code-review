"use client"

import type { Signal } from "@/lib/types"
import { Sparkline } from "./sparkline"
import { ArrowRight, TrendingUp, TrendingDown, Shield } from "lucide-react"

interface SpreadCardProps {
  signal: Signal
}

// Convert a single-leg signal into a spread strategy
function generateSpread(signal: Signal) {
  const { ticker, price, signal: direction, play, thesis, risk, target, stop } = signal
  
  // Parse the play to extract strike and expiration
  const callMatch = play.match(/\$?([\d.]+)\s*calls?\s*(?:exp\s*)?([\w\s\d]+)/i)
  const putMatch = play.match(/\$?([\d.]+)\s*puts?\s*(?:exp\s*)?([\w\s\d]+)/i)
  
  if (direction === "BUY" && callMatch) {
    // Bullish signal with calls -> Bull Call Spread
    const strike = parseFloat(callMatch[1])
    const exp = callMatch[2]?.trim() || "TBD"
    const shortStrike = Math.round((strike + (target - price) * 0.5) / 2.5) * 2.5
    
    return {
      type: "BULL CALL SPREAD",
      strategy: "DEBIT",
      direction: "BULLISH",
      legs: [
        { action: "BUY", type: "CALL", strike, exp },
        { action: "SELL", type: "CALL", strike: shortStrike, exp },
      ],
      maxProfit: `$${((shortStrike - strike) * 100).toFixed(0)} per contract`,
      maxLoss: "Limited to net debit paid",
      breakeven: `$${(strike + (shortStrike - strike) * 0.3).toFixed(2)}`,
      thesis: `Bullish on ${ticker} with defined risk. Selling the higher strike reduces cost basis and caps upside at $${shortStrike}.`,
    }
  } else if (direction === "BUY" && putMatch) {
    // Bullish with puts (unusual) -> Bull Put Spread (credit)
    const strike = parseFloat(putMatch[1])
    const exp = putMatch[2]?.trim() || "TBD"
    const shortStrike = Math.round((strike + 5) / 2.5) * 2.5
    
    return {
      type: "BULL PUT SPREAD",
      strategy: "CREDIT",
      direction: "BULLISH",
      legs: [
        { action: "SELL", type: "PUT", strike: shortStrike, exp },
        { action: "BUY", type: "PUT", strike, exp },
      ],
      maxProfit: "Limited to net credit received",
      maxLoss: `$${((shortStrike - strike) * 100).toFixed(0)} per contract`,
      breakeven: `$${(shortStrike - (shortStrike - strike) * 0.3).toFixed(2)}`,
      thesis: `Neutral-to-bullish on ${ticker}. Collect premium if stock stays above $${shortStrike} by expiration.`,
    }
  } else if ((direction === "SELL" || direction === "FADE") && callMatch) {
    // Bearish with calls -> Bear Call Spread (credit)
    const strike = parseFloat(callMatch[1])
    const exp = callMatch[2]?.trim() || "TBD"
    const longStrike = Math.round((strike + 10) / 2.5) * 2.5
    
    return {
      type: "BEAR CALL SPREAD",
      strategy: "CREDIT",
      direction: "BEARISH",
      legs: [
        { action: "SELL", type: "CALL", strike, exp },
        { action: "BUY", type: "CALL", strike: longStrike, exp },
      ],
      maxProfit: "Limited to net credit received",
      maxLoss: `$${((longStrike - strike) * 100).toFixed(0)} per contract`,
      breakeven: `$${(strike + (longStrike - strike) * 0.3).toFixed(2)}`,
      thesis: `Bearish on ${ticker}. Profit if stock stays below $${strike} by expiration.`,
    }
  } else if ((direction === "SELL" || direction === "FADE") && putMatch) {
    // Bearish with puts -> Bear Put Spread (debit)
    const strike = parseFloat(putMatch[1])
    const exp = putMatch[2]?.trim() || "TBD"
    const shortStrike = Math.round((strike - 10) / 2.5) * 2.5
    
    return {
      type: "BEAR PUT SPREAD",
      strategy: "DEBIT",
      direction: "BEARISH",
      legs: [
        { action: "BUY", type: "PUT", strike, exp },
        { action: "SELL", type: "PUT", strike: shortStrike, exp },
      ],
      maxProfit: `$${((strike - shortStrike) * 100).toFixed(0)} per contract`,
      maxLoss: "Limited to net debit paid",
      breakeven: `$${(strike - (strike - shortStrike) * 0.3).toFixed(2)}`,
      thesis: `Bearish on ${ticker} with defined risk. Max profit if stock falls below $${shortStrike}.`,
    }
  } else if (direction === "WATCH" || direction === "HOLD") {
    // Neutral -> Iron Condor
    const upperStrike = Math.round((price * 1.05) / 2.5) * 2.5
    const lowerStrike = Math.round((price * 0.95) / 2.5) * 2.5
    const exp = callMatch?.[2]?.trim() || putMatch?.[2]?.trim() || "TBD"
    
    return {
      type: "IRON CONDOR",
      strategy: "CREDIT",
      direction: "NEUTRAL",
      legs: [
        { action: "SELL", type: "PUT", strike: lowerStrike, exp },
        { action: "BUY", type: "PUT", strike: lowerStrike - 5, exp },
        { action: "SELL", type: "CALL", strike: upperStrike, exp },
        { action: "BUY", type: "CALL", strike: upperStrike + 5, exp },
      ],
      maxProfit: "Limited to net credit received",
      maxLoss: "$500 per contract (width of wings)",
      breakeven: `$${lowerStrike.toFixed(0)} - $${upperStrike.toFixed(0)}`,
      thesis: `Neutral on ${ticker}. Profit if stock stays between $${lowerStrike} and $${upperStrike} by expiration.`,
    }
  }
  
  // Fallback - simple vertical based on direction
  return {
    type: direction === "BUY" ? "BULL CALL SPREAD" : "BEAR PUT SPREAD",
    strategy: "DEBIT",
    direction: direction === "BUY" ? "BULLISH" : "BEARISH",
    legs: [
      { action: "BUY", type: direction === "BUY" ? "CALL" : "PUT", strike: Math.round(price / 2.5) * 2.5, exp: "TBD" },
      { action: "SELL", type: direction === "BUY" ? "CALL" : "PUT", strike: Math.round((price * (direction === "BUY" ? 1.1 : 0.9)) / 2.5) * 2.5, exp: "TBD" },
    ],
    maxProfit: "Defined at entry",
    maxLoss: "Limited to net debit",
    breakeven: `~$${price.toFixed(2)}`,
    thesis: thesis,
  }
}

export function SpreadCard({ signal }: SpreadCardProps) {
  const spread = generateSpread(signal)
  
  const dirColor = spread.direction === "BULLISH" ? "#00ffaa" : spread.direction === "BEARISH" ? "#f87171" : "#facc15"
  const stratColor = spread.strategy === "CREDIT" ? "#a78bfa" : "#00e5ff"
  
  return (
    <div
      className="bg-[#0c1020] border border-[#131c2e] rounded-lg p-4 mb-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ borderLeft: `3px solid ${dirColor}` }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-mono text-lg text-[#d6dff0] font-medium tracking-wide">
              {signal.ticker}
            </span>
            <span className="font-mono text-xs text-[#3d4f6b] ml-2">
              ${signal.price?.toFixed(2)}
            </span>
            <span className={`font-mono text-[11px] ml-1.5 ${signal.change_pct >= 0 ? "text-[#00ffaa]" : "text-[#f87171]"}`}>
              {signal.change_pct >= 0 ? "+" : ""}{signal.change_pct?.toFixed(2)}%
            </span>
          </div>
          <Sparkline ticker={signal.ticker} width={50} height={20} />
        </div>
        <div className="flex gap-1.5">
          <span
            className="font-mono text-[9px] px-2 py-1 border rounded tracking-wider flex items-center gap-1"
            style={{ borderColor: dirColor, color: dirColor }}
          >
            {spread.direction === "BULLISH" ? <TrendingUp className="w-3 h-3" /> : spread.direction === "BEARISH" ? <TrendingDown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
            {spread.direction}
          </span>
          <span
            className="font-mono text-[9px] px-2 py-1 border rounded tracking-wider"
            style={{ borderColor: `${stratColor}60`, color: stratColor }}
          >
            {spread.strategy}
          </span>
        </div>
      </div>

      {/* Strategy Name */}
      <div className="font-mono text-sm text-[#00e5ff] tracking-wider mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4" />
        {spread.type}
      </div>

      {/* Legs */}
      <div className="bg-[#060a10] rounded p-3 mb-3">
        <div className="font-mono text-[9px] text-[#3d4f6b] tracking-wider mb-2">LEGS</div>
        <div className="space-y-1.5">
          {spread.legs.map((leg, i) => (
            <div key={i} className="flex items-center gap-2 font-mono text-[12px]">
              <span className={`px-1.5 py-0.5 rounded text-[9px] ${leg.action === "BUY" ? "bg-[#00ffaa]/15 text-[#00ffaa]" : "bg-[#f87171]/15 text-[#f87171]"}`}>
                {leg.action}
              </span>
              <span className="text-[#d6dff0]">${leg.strike}</span>
              <span className={leg.type === "CALL" ? "text-[#00e5ff]" : "text-[#fb923c]"}>{leg.type}</span>
              <span className="text-[#3d4f6b] text-[10px]">exp {leg.exp}</span>
              {i < spread.legs.length - 1 && <ArrowRight className="w-3 h-3 text-[#3d4f6b]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Risk/Reward */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="font-mono text-[9px] text-[#3d4f6b] tracking-wider mb-1">MAX PROFIT</div>
          <div className="text-[11px] text-[#00ffaa]">{spread.maxProfit}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#3d4f6b] tracking-wider mb-1">MAX LOSS</div>
          <div className="text-[11px] text-[#f87171]">{spread.maxLoss}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] text-[#3d4f6b] tracking-wider mb-1">BREAKEVEN</div>
          <div className="text-[11px] text-[#d6dff0]">{spread.breakeven}</div>
        </div>
      </div>

      {/* Thesis */}
      <div className="text-[12px] leading-relaxed text-[#d6dff0] opacity-85 border-t border-[#131c2e] pt-3">
        {spread.thesis}
      </div>

      {/* Original Signal Reference */}
      <div className="mt-3 pt-2 border-t border-[#131c2e]/50">
        <div className="font-mono text-[9px] text-[#3d4f6b] tracking-wider">
          BASED ON: <span className="text-[#00e5ff]">{signal.play}</span>
          {signal.catalyst && signal.catalyst.toLowerCase() !== "none" && (
            <span className="ml-2 text-[#a78bfa]">* {signal.catalyst}</span>
          )}
        </div>
      </div>
    </div>
  )
}
