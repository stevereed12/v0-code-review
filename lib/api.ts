// ─── API CLIENT ─────────────────────────────────────────────────────────────

import type { LivePrice, PriceHistory } from "./types"

export async function askClaude<T>(prompt: string, useSearch = true, maxTokens = 6000): Promise<T> {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, useSearch, maxTokens }),
  })

  const json = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error || `API error ${res.status}`)
  }

  return json.data as T
}

export async function fetchLivePrices(tickers: string[]): Promise<Record<string, LivePrice>> {
  if (!tickers || tickers.length === 0) return {}

  const res = await fetch(`/api/prices?symbols=${tickers.join(",")}`)
  const json = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error || `Price API error ${res.status}`)
  }

  return json.data
}

export async function fetchChartData(ticker: string): Promise<PriceHistory[]> {
  const res = await fetch(`/api/chart?symbol=${ticker}`)
  const json = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error || `Chart API error ${res.status}`)
  }

  return json.data
}
