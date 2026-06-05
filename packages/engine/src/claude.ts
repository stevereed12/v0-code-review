// ─── CLAUDE CALL + JSON EXTRACTION ───────────────────────────────────────────
// extractJSON is copied VERBATIM from the web app's app/api/claude/route.ts so
// that the Signals/Curator/Watchlist/Scout agents parse Claude output byte-for-byte
// identically outside the browser. askClaude reproduces the same Anthropic request,
// retry, and web-search behavior the /api/claude route used.

import { CLAUDE_MODEL } from "./ai-config"

export function extractJSON(s: string): unknown {
  if (!s) throw new Error("Empty response from Claude")

  // Strip code fences first
  let cleaned = s.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()

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

/**
 * Calls Claude with the given prompt and returns parsed JSON of type T.
 * Mirrors the web app's /api/claude handler: web search enabled by default,
 * 3-attempt retry on transient/5xx/overload errors, same JSON extraction.
 */
export async function askClaude<T>(
  prompt: string,
  apiKey: string,
  useSearch = true,
  maxTokens = 6000
): Promise<T> {
  if (!prompt) throw new Error("Prompt is required")

  const trimmedKey = apiKey?.trim()
  if (!trimmedKey) throw new Error("API_KEY_REQUIRED")
  if (!trimmedKey.startsWith("sk-ant-")) {
    throw new Error(
      `Invalid API key format. Expected 'sk-ant-...' but got '${trimmedKey.slice(0, 10)}...'`
    )
  }

  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  }

  if (useSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }]
  }

  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": trimmedKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errText = await res.text()

        if (res.status === 429) {
          throw new Error(
            "Rate limit reached on your Anthropic API key. Please wait a minute and try again, or upgrade your Anthropic plan for higher limits."
          )
        }

        if (res.status >= 500 && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
          lastError = new Error(`Server ${res.status}: ${errText.slice(0, 100)}`)
          continue
        }
        throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`)
      }

      const data = (await res.json()) as {
        error?: { message?: string }
        content?: Array<{ type: string; text?: string }>
        stop_reason?: string
      }
      if (data.error) {
        if (attempt < 2 && /overload|server|temporarily|timeout/i.test(data.error.message || "")) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
          lastError = new Error(data.error.message)
          continue
        }
        throw new Error(data.error.message)
      }

      const textBlocks = (data.content || []).filter((b) => b.type === "text")
      const text = textBlocks.map((b) => b.text ?? "").join("\n").trim()

      if (!text) {
        const blockTypes = (data.content || []).map((b: { type: string }) => b.type).join(", ")
        const stopReason = data.stop_reason || "unknown"
        if (attempt < 2 && (blockTypes.includes("tool_use") || blockTypes.includes("server_tool_use"))) {
          lastError = new Error(`Empty after tools (stop=${stopReason})`)
          await new Promise((r) => setTimeout(r, 1000))
          continue
        }
        throw new Error(`Empty text response. stop_reason=${stopReason}, blocks=[${blockTypes || "none"}]`)
      }

      return extractJSON(text) as T
    } catch (err) {
      lastError = err as Error
      if (attempt < 2 && /network|fetch|timeout|abort/i.test((err as Error).message)) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      throw err
    }
  }

  throw new Error(lastError?.message || "Failed after 3 attempts")
}

/** Resolve an Anthropic key from explicit option or environment. */
export function resolveAnthropicKey(explicit?: string): string {
  const key = (explicit || process.env.ANTHROPIC_API_KEY || "").trim()
  if (!key) throw new Error("ANTHROPIC_API_KEY required (pass anthropicKey or set the env var)")
  return key
}

/** Resolve a Polygon key from explicit option or environment (may be empty). */
export function resolvePolygonKey(explicit?: string): string {
  return (explicit || process.env.POLYGON_API_KEY || "").trim()
}
