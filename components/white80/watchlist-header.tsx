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
    <div className="bg-[#0a0a0a] border border-[#262620] rounded-md p-3 mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[9px] tracking-[2px] text-[#6e6a5e]">
          ACTIVE WATCHLIST - {watchlist.length} NAMES
        </span>
        <span className="font-mono text-[9px] text-[#6e6a5e]">
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
                  ? "bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]"
                  : "bg-[#141411] border-[#1e1e19] text-[#f4f0e6]"
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
                className="cursor-pointer text-[#6e6a5e] hover:text-[#f87171] transition-colors"
              >
                <X className="w-3 h-3" />
              </span>
            </span>
          )
        })}
      </div>

      <div className="flex gap-2 items-center pt-2.5 border-t border-[#262620]">
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
          className="flex-1 min-w-[100px] max-w-[180px] bg-[#0a0a0a] border border-[#1e1e19] text-[#f4f0e6] px-2.5 py-1.5 text-[11px] tracking-wider rounded-sm font-mono focus:border-[#c8ff00] focus:outline-none"
        />
        <button
          onClick={() => addManualTicker(true)}
          disabled={!manualTicker.trim()}
          className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-sm border transition-all ${
            manualTicker.trim()
              ? "bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00] cursor-pointer"
              : "border-[#1e1e19] text-[#6e6a5e] cursor-default"
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
              ? "border-[#6e6a5e] text-[#6e6a5e] cursor-pointer hover:text-[#f4f0e6]"
              : "border-[#1e1e19] text-[#1e1e19] cursor-default"
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
