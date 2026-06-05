// ─── MODEL CALL + JSON EXTRACTION ────────────────────────────────────────────
// Replaces the old Anthropic-specific claude.ts. All model calls now go through
// the Perplexity Agent API, which is OpenAI-SDK compatible (base URL
// https://api.perplexity.ai, single key PERPLEXITY_API_KEY). Each agent passes its
// own model id (see ./models). extractJSON is preserved VERBATIM so Claude/GPT/
// Gemini/Grok/Sonar JSON output parses byte-for-byte identically.

import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: "https://api.perplexity.ai",
})

export function extractJSON(s: string): unknown {
  if (!s) throw new Error("Empty response from model")

  // Strip code fences first
  let cleaned = s.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
  // Strip citation markers that sonar models inject into responses (e.g. [1], [2])
  cleaned = cleaned.replace(/\[\d+\]/g, "")

  // Try parsing as-is
  try {
    return JSON.parse(cleaned)
  } catch {
    // Continue to extraction logic
  }

  // Find the first { or [ and the matching close
  const firstObj = cleaned.indexOf("{")
  const firstArr = cleaned.indexOf("[")
  let start = -1
  let openChar: string, closeChar: string

  if (firstObj === -1 && firstArr === -1) {
    throw new Error("No JSON found in response. Got: " + cleaned.slice(0, 200))
  }
  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) {
    start = firstObj
    openChar = "{"
    closeChar = "}"
  } else {
    start = firstArr
    openChar = "["
    closeChar = "]"
  }

  // Walk forward tracking depth, respecting strings
  let depth = 0,
    inStr = false,
    esc = false,
    end = -1
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i]
    if (esc) {
      esc = false
      continue
    }
    if (c === "\\") {
      esc = true
      continue
    }
    if (c === '"') {
      inStr = !inStr
      continue
    }
    if (inStr) continue
    if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }

  if (end !== -1) {
    const jsonStr = cleaned.slice(start, end + 1)
    return JSON.parse(jsonStr)
  }

  // RECOVERY MODE: response was truncated mid-JSON
  // For arrays: try to salvage all complete objects and close the array
  if (openChar === "[") {
    const truncated = cleaned.slice(start)
    let lastCompleteObjEnd = -1
    let d = 0,
      iS = false,
      esc2 = false
    for (let i = 1; i < truncated.length; i++) {
      const c = truncated[i]
      if (esc2) {
        esc2 = false
        continue
      }
      if (c === "\\") {
        esc2 = true
        continue
      }
      if (c === '"') {
        iS = !iS
        continue
      }
      if (iS) continue
      if (c === "{") d++
      else if (c === "}") {
        d--
        if (d === 0) lastCompleteObjEnd = i
      }
    }
    if (lastCompleteObjEnd > 0) {
      const salvaged = "[" + truncated.slice(1, lastCompleteObjEnd + 1) + "]"
      try {
        const parsed = JSON.parse(salvaged)
        console.warn(`Recovered ${parsed.length} items from truncated JSON response`)
        return parsed
      } catch {
        // Continue to error
      }
    }
  }

  // For objects: try to close braces and parse what we have
  if (openChar === "{") {
    let truncated = cleaned.slice(start)
    let d = 0,
      iS = false,
      esc2 = false
    for (let i = 0; i < truncated.length; i++) {
      const c = truncated[i]
      if (esc2) {
        esc2 = false
        continue
      }
      if (c === "\\") {
        esc2 = true
        continue
      }
      if (c === '"') {
        iS = !iS
        continue
      }
      if (iS) continue
      if (c === "{") d++
      else if (c === "}") d--
    }
    if (iS) truncated += '"'
    truncated = truncated.replace(/,\s*"[^"]*"\s*:?\s*[^,}]*$/, "")
    truncated = truncated.replace(/,\s*$/, "")
    truncated += "}".repeat(Math.max(0, d))
    try {
      const parsed = JSON.parse(truncated)
      console.warn("Recovered partial object from truncated JSON response")
      return parsed
    } catch {
      // Continue to error
    }
  }

  throw new Error("Unclosed JSON in response and recovery failed. Response may be truncated.")
}

const JSON_SYSTEM_PROMPT =
  "You are a JSON API. You MUST respond with valid JSON only. No prose, no explanations, no markdown. Your entire response must be parseable JSON starting with { and ending with }. Never start with phrases like 'Based on' or 'Here is' - output raw JSON immediately."

/**
 * Calls a model via the Perplexity Agent API and returns parsed JSON of type T.
 * Mirrors the old askClaude retry semantics: 3 attempts with backoff on 5xx /
 * overload / transient network errors, same extractJSON parsing. Sonar models
 * have web search built in; xai/google models rely on prompt + Polygon context.
 *
 * @param model        Model id (see ./models MODELS)
 * @param systemPrompt System prompt. Pass "" to use the default strict-JSON prompt.
 * @param userPrompt   The user content (the verbatim agent prompt).
 */
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
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      })

      const text = (completion.choices?.[0]?.message?.content ?? "").trim()

      if (!text) {
        const finish = completion.choices?.[0]?.finish_reason || "unknown"
        if (attempt < retries - 1) {
          lastError = new Error(`Empty response (finish=${finish})`)
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
        throw new Error(`Empty text response. finish_reason=${finish}`)
      }

      return extractJSON(text) as T
    } catch (err) {
      lastError = err as Error
      const status = (err as { status?: number })?.status
      const msg = (err as Error).message || ""

      if (status === 429) {
        throw new Error(
          "Rate limit reached on your Perplexity API key. Please wait a minute and try again, or upgrade your plan for higher limits."
        )
      }

      const transient =
        (typeof status === "number" && status >= 500) ||
        /overload|server|temporarily|timeout|network|fetch|abort|ECONN|socket/i.test(msg)

      if (attempt < retries - 1 && transient) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }

  throw new Error(lastError?.message || `Failed after ${retries} attempts`)
}

/** Resolve a Polygon key from explicit option or environment (may be empty). */
export function resolvePolygonKey(explicit?: string): string {
  return (explicit || process.env.POLYGON_API_KEY || "").trim()
}
