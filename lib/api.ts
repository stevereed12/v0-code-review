// ─── API CLIENT ─────────────────────────────────────────────────────────────

import type { LivePrice, PriceHistory } from "./types"

const API_KEY_STORAGE_KEY = "white80:anthropic_api_key"

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
}

export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

export class ApiKeyRequiredError extends Error {
  constructor() {
    super("API_KEY_REQUIRED")
    this.name = "ApiKeyRequiredError"
  }
}

export async function askClaude<T>(prompt: string, useSearch = true, maxTokens = 6000): Promise<T> {
  const clientApiKey = getStoredApiKey()
  
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, useSearch, maxTokens, clientApiKey }),
  })

  const json = await res.json()

  if (json.error === "API_KEY_REQUIRED") {
    throw new ApiKeyRequiredError()
  }

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
