import type { ScoutResult, CapTier, Horizon } from "../types"
import { buildScoutPrompt } from "../prompts"
import { askModel } from "../model"
import { MODELS } from "../models"

export interface ScoutOptions {
  themes: string[]
  capTier: CapTier
  horizon: Horizon
  excludeTickers?: string[]
}

/** Scout agent — verbatim prompt, returns discovery candidates. */
export async function runScout(opts: ScoutOptions): Promise<ScoutResult[]> {
  const prompt = buildScoutPrompt(opts.themes, opts.capTier, opts.horizon, opts.excludeTickers ?? [])
  return askModel<ScoutResult[]>(MODELS.SCOUT, "", prompt)
}
