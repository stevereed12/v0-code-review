"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"

const DISCLAIMER_KEY = "white80_disclaimer_acknowledged"

export function DisclaimerModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const acknowledged = localStorage.getItem(DISCLAIMER_KEY)
    if (!acknowledged) {
      setShow(true)
    }
  }, [])

  const handleAcknowledge = () => {
    localStorage.setItem(DISCLAIMER_KEY, new Date().toISOString())
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0a0e1a] border border-[#131c2e] rounded-lg max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#fb923c]/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#fb923c]" />
          </div>
          <div>
            <h2 className="font-mono text-lg font-bold text-white tracking-wide">
              IMPORTANT DISCLAIMER
            </h2>
            <p className="font-mono text-[10px] text-[#3d4f6b] tracking-wider">
              PLEASE READ BEFORE CONTINUING
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-[13px] text-[#d6dff0] leading-relaxed">
            White 80 is an <span className="text-[#00e5ff] font-medium">information intelligence platform</span>. 
            The signals, analysis, and data presented are for <span className="text-[#00e5ff] font-medium">informational 
            and educational purposes only</span>.
          </p>
          
          <div className="bg-[#0c1020] border border-[#131c2e] rounded p-4">
            <p className="text-[12px] text-[#d6dff0] leading-relaxed">
              <span className="text-[#fb923c] font-bold">This is not investment advice.</span> Nothing 
              contained herein constitutes a solicitation, recommendation, endorsement, or offer to 
              buy or sell any securities or other financial instruments.
            </p>
          </div>

          <p className="text-[12px] text-[#3d4f6b] leading-relaxed">
            All investments involve risk, including the possible loss of principal. Past performance 
            does not guarantee future results. You are solely responsible for your own investment 
            decisions. Always conduct your own research and consult with a qualified financial 
            advisor before making any investment.
          </p>
        </div>

        {/* Action */}
        <button
          onClick={handleAcknowledge}
          className="w-full font-mono text-[11px] tracking-wider py-3 rounded bg-[#00e5ff]/20 border border-[#00e5ff]/40 text-[#00e5ff] hover:bg-[#00e5ff]/30 transition-colors"
        >
          I UNDERSTAND AND ACKNOWLEDGE
        </button>

        <p className="text-center text-[10px] text-[#3d4f6b] mt-3 font-mono">
          By clicking above, you confirm you have read and understood this disclaimer.
        </p>
      </div>
    </div>
  )
}
