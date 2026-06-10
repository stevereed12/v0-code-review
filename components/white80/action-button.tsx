"use client"

import { Spinner } from "@/components/ui/spinner"

interface ActionButtonProps {
  onClick: () => void
  loading: boolean
  label: string
  loadingLabel: string
  color: string
  className?: string
}

export function ActionButton({ onClick, loading, label, loadingLabel, color, className }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full font-mono py-3 px-4 text-[11px] tracking-[2px] rounded border transition-all relative overflow-hidden ${
        loading ? "bg-[#1e1e19] cursor-wait" : "bg-transparent cursor-pointer"
      } ${className}`}
      style={{ borderColor: color, color: color }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner className="w-3.5 h-3.5" />
          {loadingLabel}
        </span>
      ) : (
        <>
          <span className="mr-1.5">&#9654;</span> {label}
        </>
      )}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
      )}
    </button>
  )
}
