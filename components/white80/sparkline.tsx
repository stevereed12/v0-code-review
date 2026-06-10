"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import { fetchChartData } from "@/lib/api"
import type { PriceHistory } from "@/lib/types"

interface SparklineProps {
  ticker: string
  width?: number
  height?: number
  className?: string
}

export function Sparkline({ ticker, width = 60, height = 24, className }: SparklineProps) {
  const [data, setData] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchChartData(ticker)
      .then((d) => {
        if (mounted) setData(d)
      })
      .catch(() => {
        // Silently fail for sparklines
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [ticker])

  if (loading || data.length < 2) {
    return (
      <div
        className={className}
        style={{ width, height, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}
      />
    )
  }

  const first = data[0]?.close || 0
  const last = data[data.length - 1]?.close || 0
  const isUp = last >= first
  const color = isUp ? "#c8ff00" : "#f87171"

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="close"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
