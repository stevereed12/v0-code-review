import type { CuratorState } from "../types"
import { buildCuratorPrompt } from "../prompts"
import { askClaude, resolveAnthropicKey } from "../claude"

export interface CuratorOptions {
  anthropicKey?: string
  watchlist: string[]
}

/** Curator agent — verbatim prompt, returns the curated watchlist state. */
export async function runCurator(opts: CuratorOptions): Promise<CuratorState> {
  const key = resolveAnthropicKey(opts.anthropicKey)
  const prompt = buildCuratorPrompt(opts.watchlist)
  return askClaude<CuratorState>(prompt, key)
}
