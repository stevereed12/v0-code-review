// ─── API CLIENT ─────────────────────────────────────────────────────────────

import type { LivePrice, PriceHistory } from "./types"

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
