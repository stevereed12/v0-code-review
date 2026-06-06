// ─── MODEL CALL + JSON EXTRACTION ────────────────────────────────────────────
// All model calls go through the Perplexity Agent API.
// Sonar models (perplexity/sonar) use /chat/completions.
// Third-party models (xai/*, google/*, anthropic/*) use /v1/agent.
// We route based on the model prefix.

import OpenAI from "openai"

// Sonar client — chat/completions endpoint
const sonarClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
})

// Agent client — /v1/agent endpoint for third-party models
const agentClient = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai/v1/agent",
})

function isSonarModel(model: string): boolean {
  return model.startsWith("perplexity/")
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
  "You are a JSON API. Respond with valid JSON only. No prose, no markdown, no explanations. Output raw JSON starting with { or [."

export async function askModel<T>(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  retries = 3
): Promise<T> {
  if (!userPrompt) throw new Error("Prompt is required")
  if (!process.env.PERPLEXITY_API_KEY?.trim()) throw new Error("API_KEY_REQUIRED")

  const system = systemPrompt?.trim() ? systemPrompt : JSON_SYSTEM_PROMPT
  const client = isSonarModel(model) ? sonarClient : agentClient
  // Agent API uses just the model name without the provider prefix for the call
  const modelId = isSonarModel(model) ? model : model

  let lastError: Error | null = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: modelId,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      })

      const text = (completion.choices?.[0]?.message?.content ?? "").trim()
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
