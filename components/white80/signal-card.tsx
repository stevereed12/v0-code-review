"use client"

import type { Signal } from "@/lib/types"
import { Sparkline } from "./sparkline"

interface SignalCardProps {
  signal: Signal
}

export function SignalCard({ signal: s }: SignalCardProps) {
  const sigColor =
    s.signal === "BUY"
      ? "#00ffaa"
      : s.signal === "SELL"
        ? "#f87171"
        : s.signal === "WATCH"
          ? "#facc15"
          : "#3d4f6b"
  const riskColor = s.risk === "Low" ? "#00ffaa" : s.risk === "High" ? "#f87171" : "#facc15"

  return (
    <div
      className="bg-[#0c1020] border border-[#131c2e] rounded p-3.5 mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ borderLeft: `3px solid ${sigColor}` }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-mono text-base text-[#d6dff0] font-medium tracking-wide">
              {s.ticker}
            </span>
            <span className="font-mono text-xs text-[#3d4f6b] ml-2.5">
              ${s.price?.toFixed(2)}
            </span>
            <span
              className={`font-mono text-[11px] ml-1.5 ${s.change_pct >= 0 ? "text-[#00ffaa]" : "text-[#f87171]"}`}
            >
              {s.change_pct >= 0 ? "+" : ""}
              {s.change_pct?.toFixed(2)}%
            </span>
          </div>
          <Sparkline ticker={s.ticker} width={50} height={20} />
        </div>
        <div className="flex gap-1.5">
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider"
            style={{ borderColor: sigColor, color: sigColor }}
          >
            {s.signal}
          </span>
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider"
            style={{ borderColor: `${riskColor}40`, color: riskColor }}
          >
            {s.risk?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="text-sm leading-relaxed text-[#d6dff0] mb-1.5">
        <span className="text-[#00e5ff] font-medium">{s.play}</span>
      </div>

      <div className="text-[13px] leading-snug text-[#d6dff0] opacity-85 mb-2">{s.thesis}</div>

      <div className="font-mono flex gap-3.5 text-[9px] text-[#3d4f6b] tracking-wide">
        <span>TGT ${s.target?.toFixed(2)}</span>
        <span>STOP ${s.stop?.toFixed(2)}</span>
        {s.catalyst && s.catalyst.toLowerCase() !== "none" && (
          <span className="text-[#a78bfa]">* {s.catalyst}</span>
        )}
      </div>
    </div>
  )
}
