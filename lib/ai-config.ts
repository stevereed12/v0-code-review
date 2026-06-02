// ─── ANTHROPIC MODEL CONFIG ──────────────────────────────────────────────────
// Centralized so a model deprecation/migration is a one-line change.
// When Anthropic retires a model, update CLAUDE_MODEL here and every API route
// (claude, brief, vibe, catalysts, extract-trades) picks it up automatically.
//
// Current: claude-sonnet-4-6 (claude-sonnet-4-20250514 retires 2026-06-15)
// Models: https://docs.anthropic.com/en/docs/about-claude/models

export const CLAUDE_MODEL = "claude-sonnet-4-6"
