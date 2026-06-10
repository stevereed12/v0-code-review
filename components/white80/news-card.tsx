"use client"

import type { TickerNews } from "@/lib/types"

interface NewsCardProps {
  news: TickerNews
}

export function NewsCard({ news: n }: NewsCardProps) {
  const isQuiet = !n.items || n.items.length === 0 || n.summary === "quiet"

  return (
    <div
      className={`bg-[#141411] border border-[#262620] rounded p-3.5 mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-300 ${isQuiet ? "opacity-55" : ""}`}
      style={{ borderLeft: `3px solid ${isQuiet ? "#6e6a5e" : "#facc15"}` }}
    >
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-mono text-sm text-[#f4f0e6] font-medium tracking-wide">{n.ticker}</span>
        <span className="font-mono text-[9px] text-[#6e6a5e] tracking-wider">
          {n.items?.length || 0} item{n.items?.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        className={`text-[13px] leading-relaxed text-[#f4f0e6] opacity-90 ${isQuiet ? "italic" : ""} ${!isQuiet && n.items?.length ? "mb-2.5" : ""}`}
      >
        {n.summary}
      </div>

      {!isQuiet &&
        n.items?.map((item, j) => {
          const ic = item.impact === "BULLISH" ? "#c8ff00" : item.impact === "BEARISH" ? "#f87171" : "#6e6a5e"
          const mc = item.magnitude === "HIGH" ? "#fb923c" : item.magnitude === "MEDIUM" ? "#facc15" : "#6e6a5e"
          return (
            <div key={j} className="pt-2 border-t border-[#262620] mt-2">
              <div className="flex gap-1.5 mb-1 flex-wrap">
                <span
                  className="font-mono text-[8px] px-1.5 py-0.5 border rounded-sm tracking-wide"
                  style={{ borderColor: ic, color: ic }}
                >
                  {item.impact}
                </span>
                <span
                  className="font-mono text-[8px] px-1.5 py-0.5 border rounded-sm tracking-wide"
                  style={{ borderColor: `${mc}40`, color: mc }}
                >
                  {item.magnitude}
                </span>
                <span className="font-mono text-[8px] text-[#6e6a5e] py-0.5">
                  {item.source} - {item.age_hours}h ago
                </span>
              </div>
              <div className="text-[13px] leading-snug text-[#f4f0e6]">{item.headline}</div>
            </div>
          )
        })}
    </div>
  )
}
