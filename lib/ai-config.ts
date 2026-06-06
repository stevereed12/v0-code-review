// ─── MODEL CONFIG (web app) ──────────────────────────────────────────────────
// The engine now routes every agent through the Perplexity Agent API with a
// per-agent model (see @white80/engine MODELS). The web app's API routes still
// import a single model id from here, so we re-export the shared MODELS map and
// keep a default model id for backwards compatibility with existing imports.

export { MODELS } from "@white80/engine"

// Default model id retained so existing `@/lib/ai-config` imports keep resolving.
// Points at the Daily Brief model; update per-route by importing MODELS directly.
export const CLAUDE_MODEL = "google/gemini-3.1-pro-preview"
