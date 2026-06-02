import { NextRequest, NextResponse } from "next/server"
import { CLAUDE_MODEL } from "@/lib/ai-config"

// Server restart trigger: 2026-04-30T13:25:00
// ─── JSON EXTRACTION UTILITY ─────────────────────────────────────────────────

function extractJSON(s: string): unknown {
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

// ─── CLAUDE API HANDLER ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { prompt, useSearch = true, maxTokens = 6000, clientApiKey } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check for API key: client-provided takes priority, then env var
    const apiKey = clientApiKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim()
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API_KEY_REQUIRED" },
        { status: 401 }
      )
    }
    
    // Validate key format
    if (!apiKey.startsWith("sk-ant-")) {
      return NextResponse.json(
        { error: `Invalid API key format. Expected 'sk-ant-...' but got '${apiKey.slice(0, 10)}...'` },
        { status: 400 }
      )
    }
    
    const trimmedKey = apiKey

    const body: Record<string, unknown> = {
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }

    if (useSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }]
    }

    // Retry up to 2 times on transient backend errors
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
          // 5xx errors are server-side and worth retrying
          if (res.status >= 500 && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
            lastError = new Error(`Server ${res.status}: ${errText.slice(0, 100)}`)
            continue
          }
          return NextResponse.json({ error: `API ${res.status}: ${errText.slice(0, 200)}` }, { status: res.status })
        }

        const data = await res.json()
        if (data.error) {
          if (attempt < 2 && /overload|server|temporarily|timeout/i.test(data.error.message || "")) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
            lastError = new Error(data.error.message)
            continue
          }
          return NextResponse.json({ error: data.error.message }, { status: 500 })
        }

        const textBlocks = (data.content || []).filter((b: { type: string }) => b.type === "text")
        const text = textBlocks.map((b: { text: string }) => b.text).join("\n").trim()

        if (!text) {
          const blockTypes = (data.content || []).map((b: { type: string }) => b.type).join(", ")
          const stopReason = data.stop_reason || "unknown"
          if (attempt < 2 && (blockTypes.includes("tool_use") || blockTypes.includes("server_tool_use"))) {
            lastError = new Error(`Empty after tools (stop=${stopReason})`)
            await new Promise((r) => setTimeout(r, 1000))
            continue
          }
          return NextResponse.json(
            { error: `Empty text response. stop_reason=${stopReason}, blocks=[${blockTypes || "none"}]` },
            { status: 500 }
          )
        }

        // Extract and return parsed JSON
        const parsed = extractJSON(text)
        return NextResponse.json({ data: parsed, raw: text })
      } catch (err) {
        lastError = err as Error
        if (attempt < 2 && /network|fetch|timeout|abort/i.test((err as Error).message)) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
          continue
        }
        throw err
      }
    }

    return NextResponse.json({ error: lastError?.message || "Failed after 3 attempts" }, { status: 500 })
  } catch (err) {
    console.error("Claude API error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
