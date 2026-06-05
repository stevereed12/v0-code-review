import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import type { TickerNews } from "../types"
import { buildNewsPrompt } from "../prompts"
import { askModel } from "../model"
import { MODELS, MAG_7 } from "../models"

export interface WatchlistOptions {
  tickers: string[]
}

/**
 * Load tickers from watchlist.json at the repo root (Railway serves from repo root).
 * Falls back to MAG_7 if the file is missing or unparseable.
 * This lets Steven add/remove tickers by editing watchlist.json on GitHub
 * without any code change or redeploy.
 */
export function loadWatchlistTickers(): string[] {
  const candidates = [
    resolve(process.cwd(), "watchlist.json"),
    resolve(process.cwd(), "../../../watchlist.json"), // in case cwd is apps/routine
    resolve(process.cwd(), "../../watchlist.json"),
  ]
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        const { tickers } = JSON.parse(readFileSync(p, "utf-8"))
        if (Array.isArray(tickers) && tickers.length > 0) {
          return tickers as string[]
        }
      } catch {
        // fall through to next candidate
      }
    }
  }
  console.warn("[watchlist] watchlist.json not found or invalid — falling back to Mag 7")
  return [...MAG_7]
}

/**
 * Watchlist agent (news monitor) — verbatim prompt, returns material news per ticker.
 * Returns one TickerNews per ticker (empty items + summary "quiet" when nothing material).
 * If opts.tickers is empty, loads from watchlist.json automatically.
 */
export async function runWatchlist(opts: WatchlistOptions): Promise<TickerNews[]> {
  const tickers = opts.tickers.length > 0 ? opts.tickers : loadWatchlistTickers()
  if (tickers.length === 0) return []
  const prompt = buildNewsPrompt(tickers)
  return askModel<TickerNews[]>(MODELS.WATCHLIST, "", prompt)
}
