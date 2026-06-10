"use client"

import { X } from "lucide-react"
import type { TrackerLog } from "@/lib/types"

interface TrackerRowProps {
  log: TrackerLog
  onUpdate: (patch: Partial<TrackerLog>) => void
  onDelete: () => void
}

export function TrackerRow({ log, onUpdate, onDelete }: TrackerRowProps) {
  const sigColor =
    log.signal === "BUY"
      ? "#c8ff00"
      : log.signal === "SELL" || log.signal === "FADE"
        ? "#f87171"
        : log.signal === "WATCH"
          ? "#facc15"
          : "#6e6a5e"
  const statusColor =
    log.status === "APPROVED" ? "#c8ff00" : log.status === "PASSED" ? "#6e6a5e" : "#facc15"
  const date = new Date(log.ts)

  return (
    <div
      className="bg-[#141411] border border-[#262620] rounded p-3 mb-2"
      style={{ borderLeft: `3px solid ${sigColor}` }}
    >
      <div className="flex justify-between items-baseline mb-1.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] text-[#f4f0e6] font-medium tracking-wide">
            {log.ticker}
          </span>
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 border rounded-sm tracking-wider"
            style={{ borderColor: sigColor, color: sigColor }}
          >
            {log.signal}
          </span>
          {log.news_aware && (
            <span className="font-mono text-[8px] px-1.5 py-0.5 bg-[#facc15]/20 text-[#facc15] rounded-sm tracking-wide">
              NEWS-AWARE
            </span>
          )}
        </div>
        <span className="font-mono text-[8px] text-[#6e6a5e] tracking-wide">
          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="text-xs leading-snug text-[#f4f0e6] mb-2">{log.play}</div>

      <div className="font-mono text-[9px] text-[#6e6a5e] tracking-wide mb-2.5">
        @ ${log.price_at_signal?.toFixed(2)} - TGT ${log.target?.toFixed(2)} - STOP ${log.stop?.toFixed(2)} - {log.risk}
      </div>

      {/* Status row */}
      <div className="flex gap-1.5 mb-1.5 flex-wrap items-center">
        <span className="font-mono text-[8px] text-[#6e6a5e] tracking-wider pt-1 mr-1">STATUS:</span>
        {(["PENDING", "APPROVED", "PASSED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onUpdate({ status: s })}
            className={`font-mono text-[9px] px-2 py-0.5 rounded-sm border transition-all ${
              log.status === s
                ? `bg-[${statusColor}]/20 border-[${statusColor}] text-[${statusColor}]`
                : "border-[#1e1e19] text-[#6e6a5e]"
            }`}
            style={
              log.status === s ? { background: `${statusColor}25`, borderColor: statusColor, color: statusColor } : {}
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Outcome row (only if approved) */}
      {log.status === "APPROVED" && (
        <div className="flex gap-1.5 items-center flex-wrap">
          <span className="font-mono text-[8px] text-[#6e6a5e] tracking-wider pt-1 mr-1">OUTCOME:</span>
          {(["WIN", "EVEN", "LOSS"] as const).map((o) => {
            const oc = o === "WIN" ? "#c8ff00" : o === "LOSS" ? "#f87171" : "#facc15"
            return (
              <button
                key={o}
                onClick={() => onUpdate({ outcome: o })}
                className="font-mono text-[9px] px-2 py-0.5 rounded-sm border transition-all"
                style={
                  log.outcome === o
                    ? { background: `${oc}25`, borderColor: oc, color: oc }
                    : { borderColor: "#1e1e19", color: "#6e6a5e" }
                }
              >
                {o}
              </button>
            )
          })}
          <button
            onClick={onDelete}
            className="ml-auto text-[#6e6a5e] hover:text-[#f87171] transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
