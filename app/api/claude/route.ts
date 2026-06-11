import { NextRequest, NextResponse } from "next/server"
import { askModel, MODELS } from "@/lib/model"

// ─── GENERIC MODEL HANDLER ───────────────────────────────────────────────────
// Model-aware passthrough used by the web app's client (lib/api.ts askClaude).
// All transport, retry, and JSON extraction live in lib/model.askModel,
// which calls the Perplexity Agent API with the single PERPLEXITY_API_KEY.
// Defaults to the Daily Brief model. `useSearch` is accepted for backwards
// compatibility but ignored — sonar models search natively, others don't need it.

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const data = await askModel<unknown>(MODELS.DAILY_BRIEF, "", prompt)

    // Preserve the { data, raw } shape lib/api.ts expects. The engine returns
    // parsed JSON only, so raw is the re-serialized payload.
    return NextResponse.json({ data, raw: JSON.stringify(data) })
  } catch (err) {
    const message = (err as Error).message || "Model request failed"
    if (message === "API_KEY_REQUIRED") {
      return NextResponse.json({ error: "API_KEY_REQUIRED" }, { status: 401 })
    }
    if (/rate limit/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 429 })
    }
    console.error("Model API error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
