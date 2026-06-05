import type { ScoutResult, CapTier, Horizon } from "../types"
import { buildScoutPrompt } from "../prompts"
import { askClaude, resolveAnthropicKey } from "../claude"

export interface ScoutOptions {
  anthropicKey?: string
  themes: string[]
  capTier: CapTier
  horizon: Horizon
  excludeTickers?: string[]
}

/** Scout agent — verbatim prompt, returns discovery candidates. */
export async function runScout(opts: ScoutOptions): Promise<ScoutResult[]> {
  const key = resolveAnthropicKey(opts.anthropicKey)
  const prompt = buildScoutPrompt(opts.themes, opts.capTier, opts.horizon, opts.excludeTickers ?? [])
  return askClaude<ScoutResult[]>(prompt, key)
}
