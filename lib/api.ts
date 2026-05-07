// ─── API CLIENT ─────────────────────────────────────────────────────────────

import type { LivePrice, PriceHistory, OptionsChainSummary } from "./types"

const ANTHROPIC_KEY_STORAGE = "white80:anthropic_api_key"
const POLYGON_KEY_STORAGE = "white80:polygon_api_key"

// Anthropic API Key
export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE)
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ANTHROPIC_KEY_STORAGE, key)
}

export function clearStoredApiKey(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ANTHROPIC_KEY_STORAGE)
}

// Polygon API Key
export function getStoredPolygonKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(POLYGON_KEY_STORAGE)
}

export function setStoredPolygonKey(key: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(POLYGON_KEY_STORAGE, key)
}

export function clearStoredPolygonKey(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(POLYGON_KEY_STORAGE)
}

export class PolygonKeyRequiredError extends Error {
  constructor() {
    super("POLYGON_KEY_REQUIRED")
    this.name = "PolygonKeyRequiredError"
  }
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

  // Pass Polygon key if available for better data
  const polygonKey = getStoredPolygonKey()
  let url = `/api/prices?symbols=${tickers.join(",")}`
  if (polygonKey) {
    url += `&polygonKey=${encodeURIComponent(polygonKey)}`
  }

  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error || `Price API error ${res.status}`)
  }

  return json.data
}

export async function fetchChartData(ticker: string): Promise<PriceHistory[]> {
  // Pass Polygon key if available for better data
  const polygonKey = getStoredPolygonKey()
  let url = `/api/chart?symbol=${ticker}`
  if (polygonKey) {
    url += `&polygonKey=${encodeURIComponent(polygonKey)}`
  }

  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json()

  if (!res.ok || json.error) {
    throw new Error(json.error || `Chart API error ${res.status}`)
  }

  return json.data
}

// Options Data
export async function fetchOptionsData(
  tickers: string[], 
  prices: Record<string, number>
): Promise<Record<string, OptionsChainSummary | null>> {
  if (!tickers || tickers.length === 0) return {}
  
  const polygonKey = getStoredPolygonKey()
  if (!polygonKey) {
    throw new PolygonKeyRequiredError()
  }
  
  const url = `/api/options?symbols=${tickers.join(",")}&prices=${encodeURIComponent(JSON.stringify(prices))}&polygonKey=${encodeURIComponent(polygonKey)}`
  
  const res = await fetch(url)
  const json = await res.json()
  
  if (json.error === "POLYGON_KEY_REQUIRED") {
    throw new PolygonKeyRequiredError()
  }
  
  if (!res.ok || json.error) {
    throw new Error(json.error || `Options API error ${res.status}`)
  }
  
  return json.data
}

// Tier 1 Scanner
export async function runTier1Scan(config?: Record<string, unknown>, tickers?: string[]) {
  const clientPolygonKey = getStoredPolygonKey()
  
  const res = await fetch("/api/tier1-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, tickers, clientPolygonKey }),
  })

  const json = await res.json()

  if (json.error === "POLYGON_KEY_REQUIRED") {
    throw new PolygonKeyRequiredError()
  }

  if (!res.ok || json.error) {
    throw new Error(json.error || `Tier 1 scan error ${res.status}`)
  }

  return json.data
}
