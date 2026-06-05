import type { TickerNews } from "../types"
import { buildNewsPrompt } from "../prompts"
import { askModel } from "../model"
import { MODELS } from "../models"

export interface WatchlistOptions {
  tickers: string[]
}

/**
 * Watchlist agent (news monitor) — verbatim prompt, returns material news per ticker.
 * Returns one TickerNews per ticker (empty items + summary "quiet" when nothing material).
 */
export async function runWatchlist(opts: WatchlistOptions): Promise<TickerNews[]> {
  if (!opts.tickers || opts.tickers.length === 0) return []
  const prompt = buildNewsPrompt(opts.tickers)
  return askModel<TickerNews[]>(MODELS.WATCHLIST, "", prompt)
}
