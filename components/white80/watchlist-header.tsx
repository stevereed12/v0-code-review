"use client"

import { useState } from "react"
import { X, Pin } from "lucide-react"

interface WatchlistHeaderProps {
  watchlist: string[]
  pinnedTickers: string[]
  generatedAt?: string
  onRemove: (ticker: string) => void
  onTogglePin: (ticker: string) => void
  onAddTicker: (ticker: string, pin: boolean) => void
}

export function WatchlistHeader({
  watchlist,
  pinnedTickers,
  generatedAt,
  onRemove,
  onTogglePin,
  onAddTicker,
}: WatchlistHeaderProps) {
  const [manualTicker, setManualTicker] = useState("")
  const [manualAddError, setManualAddError] = useState("")

  const addManualTicker = (shouldPin: boolean) => {
    const t = manualTicker.trim().toUpperCase()
    setManualAddError("")
    if (!t) return
    if (!/^[A-Z]{1,9}$/.test(t)) {
      setManualAddError("Invalid ticker format")
      return
    }
    if (watchlist.includes(t)) {
      setManualAddError(`${t} is already on the watchlist`)
      return
    }
    onAddTicker(t, shouldPin)
    setManualTicker("")
  }

  return (
    <div className="bg-[#090c14] border border-[#131c2e] rounded-md p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[9px] tracking-[2px] text-[#3d4f6b]">
          ACTIVE WATCHLIST - {watchlist.length} NAMES
        </span>
        <span className="font-mono text-[9px] text-[#3d4f6b]">
          {generatedAt ? `curated ${generatedAt}` : "seed list"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {watchlist.map((t) => {
          const isPinned = pinnedTickers.includes(t)
          return (
            <span
              key={t}
              className={`font-mono text-[11px] px-2 py-1 rounded-sm border inline-flex items-center gap-1.5 transition-all ${
                isPinned
                  ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff]"
                  : "bg-[#0c1020] border-[#1a2540] text-[#d6dff0]"
              }`}
            >
              <span
                onClick={() => onTogglePin(t)}
                title={isPinned ? "Pinned (click to unpin)" : "Click to pin"}
                className="cursor-pointer flex items-center gap-1"
              >
                {isPinned && <Pin className="w-3 h-3" />}
                {t}
              </span>
              <span
                onClick={() => onRemove(t)}
                title="Remove from watchlist"
                className="cursor-pointer text-[#3d4f6b] hover:text-[#f87171] transition-colors"
              >
                <X className="w-3 h-3" />
              </span>
            </span>
          )
        })}
      </div>

      <div className="flex gap-2 items-center pt-2.5 border-t border-[#131c2e]">
        <input
          type="text"
          value={manualTicker}
          onChange={(e) => {
            setManualTicker(e.target.value.toUpperCase())
            setManualAddError("")
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") addManualTicker(true)
          }}
          placeholder="ADD TICKER"
          maxLength={10}
          className="flex-1 min-w-[100px] max-w-[180px] bg-[#05070e] border border-[#1a2540] text-[#d6dff0] px-2.5 py-1.5 text-[11px] tracking-wider rounded-sm font-mono focus:border-[#00e5ff] focus:outline-none"
        />
        <button
          onClick={() => addManualTicker(true)}
          disabled={!manualTicker.trim()}
          className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-sm border transition-all ${
            manualTicker.trim()
              ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff] cursor-pointer"
              : "border-[#1a2540] text-[#3d4f6b] cursor-default"
          }`}
          title="Add and pin (survives curator)"
        >
          + ADD & PIN
        </button>
        <button
          onClick={() => addManualTicker(false)}
          disabled={!manualTicker.trim()}
          className={`font-mono text-[10px] tracking-wider px-2.5 py-1.5 rounded-sm border transition-all ${
            manualTicker.trim()
              ? "border-[#3d4f6b] text-[#3d4f6b] cursor-pointer hover:text-[#d6dff0]"
              : "border-[#1a2540] text-[#1a2540] cursor-default"
          }`}
          title="Add temporarily (curator may demote)"
        >
          + ADD
        </button>
        {manualAddError && (
          <span className="font-mono text-[9px] text-[#f87171] tracking-wide ml-1">
            {manualAddError}
          </span>
        )}
      </div>
    </div>
  )
}
