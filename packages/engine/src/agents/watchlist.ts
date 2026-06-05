import type { TickerNews } from "../types"
import { buildNewsPrompt } from "../prompts"
import { askClaude, resolveAnthropicKey } from "../claude"

export interface WatchlistOptions {
  anthropicKey?: string
  tickers: string[]
}

/**
 * Watchlist agent (news monitor) — verbatim prompt, returns material news per ticker.
 * Returns one TickerNews per ticker (empty items + summary "quiet" when nothing material).
 */
export async function runWatchlist(opts: WatchlistOptions): Promise<TickerNews[]> {
  const key = resolveAnthropicKey(opts.anthropicKey)
  if (!opts.tickers || opts.tickers.length === 0) return []
  const prompt = buildNewsPrompt(opts.tickers)
  return askClaude<TickerNews[]>(prompt, key)
}
