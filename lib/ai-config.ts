// ─── MODEL CONFIG (web app) ──────────────────────────────────────────────────
// Every agent routes through the Perplexity Agent API with a per-agent model
// (see lib/model MODELS). The web app's API routes still import a single model
// id from here, so we re-export the shared MODELS map and keep a default model
// id for backwards compatibility with existing imports.

export { MODELS } from "@/lib/model"

// Default model id retained so existing `@/lib/ai-config` imports keep resolving.
// Points at the Daily Brief model; update per-route by importing MODELS directly.
export const CLAUDE_MODEL = "google/gemini-3.1-pro-preview"
