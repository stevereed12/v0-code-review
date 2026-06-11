// ─── MODEL CALL + JSON EXTRACTION ────────────────────────────────────────────
// Self-contained Perplexity client for the web API routes. Previously lived in
// @white80/engine; inlined here so the Next.js build has no workspace dependency
// on the (separately deployed) trading engine.
//   Sonar models (no "/" in name): Perplexity /chat/completions via OpenAI SDK
//   Agent API models (xai/*, anthropic/*, google/*): POST /v1/agent via fetch

import OpenAI from "openai"

// Lazily constructed so the OpenAI SDK doesn't throw on a missing key at module
// load (which happens during Next.js build-time page-data collection). The key
// is only needed when a request actually calls the model.
let sonarClient: OpenAI | null = null
function getSonarClient(): OpenAI {
  if (!sonarClient) {
    sonarClient = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    })
  }
  return sonarClient
}

function isSonarModel(model: string): boolean {
  return !model.includes("/")
}

export function extractJSON(s: string): unknown {
  if (!s) throw new Error("Empty response from model")
  let cleaned = s.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
  cleaned = cleaned.replace(/\[\d+\]/g, "")
  try { return JSON.parse(cleaned) } catch { /* continue */ }

  const firstObj = cleaned.indexOf("{")
  const firstArr = cleaned.indexOf("[")
  let start = -1, openChar: string, closeChar: string

  if (firstObj === -1 && firstArr === -1)
    throw new Error("No JSON found in response. Got: " + cleaned.slice(0, 200))

  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) {
    start = firstObj; openChar = "{"; closeChar = "}"
  } else {
    start = firstArr; openChar = "["; closeChar = "]"
  }

  let depth = 0, inStr = false, esc = false, end = -1
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]
    if (esc) { esc = false; continue }
    if (c === "\\") { esc = true; continue }
    if (c === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (c === openChar) depth++
    else if (c === closeChar) { depth--; if (depth === 0) { end = i; break } }
  }

  if (end !== -1) return JSON.parse(cleaned.slice(start, end + 1))
  throw new Error("Unclosed JSON in response")
}

const JSON_SYSTEM_PROMPT =
  "You are a JSON API. Respond with valid JSON only. No prose, no markdown. Output raw JSON starting with { or [."

async function callAgentAPI(model: string, system: string, user: string): Promise<string> {
  const input = system
    ? `${system}\n\n${user}`
    : user

  const res = await fetch("https://api.perplexity.ai/v1/agent", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw Object.assign(new Error(`${res.status} ${err}`), { status: res.status })
  }

  const data = await res.json() as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }
  // Try output_text first, fall back to output[0].content[0].text
  return data.output_text
    ?? data.output?.[0]?.content?.[0]?.text
    ?? ""
}

export async function askModel<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  retries = 3
): Promise<T> {
  if (!userPrompt) throw new Error("Prompt is required")
  if (!process.env.PERPLEXITY_API_KEY?.trim()) throw new Error("API_KEY_REQUIRED")

  const system = systemPrompt?.trim() ? systemPrompt : JSON_SYSTEM_PROMPT

  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      let text: string

      if (isSonarModel(model)) {
        const completion = await getSonarClient().chat.completions.create({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
        })
        text = (completion.choices?.[0]?.message?.content ?? "").trim()
      } else {
        text = (await callAgentAPI(model, system, userPrompt)).trim()
      }

      if (!text) {
        if (attempt < retries - 1) {
          lastError = new Error("Empty response")
          await new Promise(r => setTimeout(r, 1000))
          continue
        }
        throw new Error("Empty text response from model")
      }

      return extractJSON(text) as T
    } catch (err) {
      lastError = err as Error
      const status = (err as { status?: number })?.status
      const msg = (err as Error).message || ""
      if (status === 429) throw new Error("Rate limit — wait and retry")
      const transient = (typeof status === "number" && status >= 500) ||
        /overload|server|temporarily|timeout|network|fetch|abort|ECONN|socket/i.test(msg)
      if (attempt < retries - 1 && transient) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error(lastError?.message || `Failed after ${retries} attempts`)
}

export function resolvePolygonKey(explicit?: string): string {
  return (explicit || process.env.POLYGON_API_KEY || "").trim()
}

// ─── MODEL ROUTING ───────────────────────────────────────────────────────────
export const MODELS = {
  TIER1_SCANNER:  "xai/grok-4.20-reasoning",
  SCOUT:          "xai/grok-4.20-reasoning",
  CURATOR:        "sonar",
  WATCHLIST:      "sonar",
  DAILY_BRIEF:    "anthropic/claude-sonnet-4-6",
  VIBE_ENGINE:    "sonar",
  SIGNALS_ENGINE: "xai/grok-4.3",
} as const
