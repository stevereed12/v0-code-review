"use client"

import type { ScoutResult } from "@/lib/types"

interface ScoutCardProps {
  result: ScoutResult
  onWatchlist: boolean
  onPromote: () => void
}

export function ScoutCard({ result: r, onWatchlist, onPromote }: ScoutCardProps) {
  const convColor =
    r.conviction === "HIGH" ? "#c8ff00" : r.conviction === "MEDIUM" ? "#facc15" : "#fb923c"

  return (
    <div
      className="bg-[#141411] border border-[#262620] rounded p-3.5 mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ borderLeft: `3px solid ${convColor}` }}
    >
      <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
        <div>
          <span className="font-mono text-base text-[#f4f0e6] font-medium tracking-wide">
            {r.ticker}
          </span>
          <span className="text-[13px] text-[#6e6a5e] ml-2">{r.name}</span>
        </div>
        <span
          className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider"
          style={{ background: `${convColor}10`, borderColor: convColor, color: convColor }}
        >
          {r.conviction}
        </span>
      </div>

      <div className="font-mono flex gap-3 text-[9px] text-[#6e6a5e] tracking-wide mb-2.5 flex-wrap">
        <span>{r.market_cap}</span>
        <span className="text-[#f4f0e6]">{r.sector}</span>
      </div>

      <div className="text-[13px] leading-relaxed text-[#f4f0e6] mb-2.5">{r.thesis}</div>

      <div className="grid grid-cols-2 gap-2 mb-2.5 sm:grid-cols-4">
        <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#c8ff00] tracking-wider mb-0.5">UPSIDE</div>
          <div className="text-xs text-[#f4f0e6]">{r.upside_target}</div>
        </div>
        <div className="bg-[#f87171]/5 border border-[#f87171]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#f87171] tracking-wider mb-0.5">DOWNSIDE</div>
          <div className="text-xs text-[#f4f0e6]">{r.downside_risk}</div>
        </div>
        <div className="bg-[#f4f0e6]/5 border border-[#f4f0e6]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#f4f0e6] tracking-wider mb-0.5">CATALYST</div>
          <div className="text-xs text-[#f4f0e6]">{r.catalyst}</div>
        </div>
        <div className="bg-[#c8ff00]/5 border border-[#c8ff00]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#c8ff00] tracking-wider mb-0.5">ENTRY</div>
          <div className="text-xs text-[#f4f0e6]">{r.entry_strategy}</div>
        </div>
      </div>

      <div className="font-mono text-[10px] text-[#facc15] mb-2.5 italic">* Why now: {r.why_now}</div>

      <button
        onClick={onPromote}
        disabled={onWatchlist}
        className={`w-full font-mono py-2 px-3 text-[10px] tracking-wider rounded-sm border transition-all ${
          onWatchlist
            ? "bg-[#1e1e19] border-[#1e1e19] text-[#6e6a5e] cursor-default"
            : "bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00] cursor-pointer hover:bg-[#c8ff00]/20"
        }`}
      >
        {onWatchlist ? "ALREADY ON WATCHLIST" : "+ PROMOTE TO WATCHLIST (PIN)"}
      </button>
    </div>
  )
}
