import type { CuratorState } from "../types"
import { buildCuratorPrompt } from "../prompts"
import { askModel } from "../model"
import { MODELS } from "../models"

export interface CuratorOptions {
  watchlist: string[]
}

/** Curator agent — verbatim prompt, returns the curated watchlist state. */
export async function runCurator(opts: CuratorOptions): Promise<CuratorState> {
  const prompt = buildCuratorPrompt(opts.watchlist)
  return askModel<CuratorState>(MODELS.CURATOR, "", prompt)
}
