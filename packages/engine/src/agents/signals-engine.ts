import type { Signal, LivePrice, OptionsChainSummary } from "../types"
import { buildSignalPrompt } from "../prompts"
import { askModel } from "../model"
import { MODELS } from "../models"

export interface SignalsOptions {
  tickers: string[]
  newsContext?: string | null
  livePrices?: Record<string, LivePrice> | null
  optionsData?: Record<string, OptionsChainSummary | null> | null
}

/** Signals engine — verbatim prompt, returns one Signal per watchlist ticker. */
export async function runSignals(opts: SignalsOptions): Promise<Signal[]> {
  if (!opts.tickers || opts.tickers.length === 0) return []
  const prompt = buildSignalPrompt(
    opts.tickers,
    opts.newsContext ?? null,
    opts.livePrices ?? null,
    opts.optionsData ?? null
  )
  return askModel<Signal[]>(MODELS.SIGNALS_ENGINE, "", prompt)
}
