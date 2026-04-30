"use client"

import type { ScoutResult } from "@/lib/types"

interface ScoutCardProps {
  result: ScoutResult
  onWatchlist: boolean
  onPromote: () => void
}

export function ScoutCard({ result: r, onWatchlist, onPromote }: ScoutCardProps) {
  const convColor =
    r.conviction === "HIGH" ? "#00ffaa" : r.conviction === "MEDIUM" ? "#facc15" : "#fb923c"

  return (
    <div
      className="bg-[#0c1020] border border-[#131c2e] rounded p-3.5 mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ borderLeft: `3px solid ${convColor}` }}
    >
      <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
        <div>
          <span className="font-mono text-base text-[#d6dff0] font-medium tracking-wide">
            {r.ticker}
          </span>
          <span className="text-[13px] text-[#3d4f6b] ml-2">{r.name}</span>
        </div>
        <span
          className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider"
          style={{ background: `${convColor}10`, borderColor: convColor, color: convColor }}
        >
          {r.conviction}
        </span>
      </div>

      <div className="font-mono flex gap-3 text-[9px] text-[#3d4f6b] tracking-wide mb-2.5 flex-wrap">
        <span>{r.market_cap}</span>
        <span className="text-[#a78bfa]">{r.sector}</span>
      </div>

      <div className="text-[13px] leading-relaxed text-[#d6dff0] mb-2.5">{r.thesis}</div>

      <div className="grid grid-cols-2 gap-2 mb-2.5 sm:grid-cols-4">
        <div className="bg-[#00ffaa]/5 border border-[#00ffaa]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#00ffaa] tracking-wider mb-0.5">UPSIDE</div>
          <div className="text-xs text-[#d6dff0]">{r.upside_target}</div>
        </div>
        <div className="bg-[#f87171]/5 border border-[#f87171]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#f87171] tracking-wider mb-0.5">DOWNSIDE</div>
          <div className="text-xs text-[#d6dff0]">{r.downside_risk}</div>
        </div>
        <div className="bg-[#a78bfa]/5 border border-[#a78bfa]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#a78bfa] tracking-wider mb-0.5">CATALYST</div>
          <div className="text-xs text-[#d6dff0]">{r.catalyst}</div>
        </div>
        <div className="bg-[#00e5ff]/5 border border-[#00e5ff]/30 p-2 rounded-sm">
          <div className="font-mono text-[8px] text-[#00e5ff] tracking-wider mb-0.5">ENTRY</div>
          <div className="text-xs text-[#d6dff0]">{r.entry_strategy}</div>
        </div>
      </div>

      <div className="font-mono text-[10px] text-[#facc15] mb-2.5 italic">* Why now: {r.why_now}</div>

      <button
        onClick={onPromote}
        disabled={onWatchlist}
        className={`w-full font-mono py-2 px-3 text-[10px] tracking-wider rounded-sm border transition-all ${
          onWatchlist
            ? "bg-[#151e30] border-[#1a2540] text-[#3d4f6b] cursor-default"
            : "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff] cursor-pointer hover:bg-[#00e5ff]/20"
        }`}
      >
        {onWatchlist ? "ALREADY ON WATCHLIST" : "+ PROMOTE TO WATCHLIST (PIN)"}
      </button>
    </div>
  )
}
