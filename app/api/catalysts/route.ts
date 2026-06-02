import { NextRequest, NextResponse } from "next/server"
import { CLAUDE_MODEL } from "@/lib/ai-config"

// ─── CATALYST DETECTION API ──────────────────────────────────────────────────
// Uses Claude to find upcoming catalysts for a batch of tickers

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"

interface CatalystInfo {
  ticker: string
  hasCatalyst: boolean
  type?: "earnings" | "fda" | "conference" | "product" | "dividend" | "split" | "other"
  date?: string
  daysUntil?: number
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tickers: string[] = body.tickers || []
    // Each user must supply their own Anthropic key. No shared server fallback.
    const apiKey = body.clientApiKey?.trim()

    if (!apiKey) {
      return NextResponse.json({ error: "API_KEY_REQUIRED" }, { status: 401 })
    }

    if (tickers.length === 0) {
      return NextResponse.json({ error: "tickers array required" }, { status: 400 })
    }
    
    // Limit batch size
    const tickerBatch = tickers.slice(0, 30)
    
    const today = new Date()
    const todayStr = today.toLocaleDateString("en-US", { 
      weekday: "long", year: "numeric", month: "long", day: "numeric" 
    })
    
    const prompt = `Today is ${todayStr}. Find upcoming catalysts for these tickers in the next 1-4 weeks: ${tickerBatch.join(", ")}

Search for:
1. Earnings dates (most important)
2. FDA decisions or PDUFA dates
3. Product launches or announcements
4. Investor conferences or presentations
5. Ex-dividend dates
6. Stock splits

Return ONLY a JSON array with no explanation. Each object:
{
  "ticker": "AAPL",
  "hasCatalyst": true,
  "type": "earnings",
  "date": "2026-05-15",
  "daysUntil": 15,
  "description": "Q2 2026 earnings report"
}

If no catalyst found in next 4 weeks, set hasCatalyst: false and omit other fields.
Return the array for all ${tickerBatch.length} tickers.`

    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    })
    
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`)
    }
    
    const data = await res.json()
    const textBlocks = (data.content || []).filter((b: { type: string }) => b.type === "text")
    const text = textBlocks.map((b: { text: string }) => b.text).join("\n").trim()
    
    // Parse JSON from response
    let catalysts: CatalystInfo[] = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        catalysts = JSON.parse(jsonMatch[0])
      }
    } catch {
      console.error("Failed to parse catalyst JSON:", text.slice(0, 500))
    }
    
    // Create map for easy lookup
    const catalystMap: Record<string, CatalystInfo> = {}
    for (const c of catalysts) {
      if (c.ticker) {
        catalystMap[c.ticker.toUpperCase()] = c
      }
    }
    
    return NextResponse.json({ data: catalystMap })
  } catch (err) {
    console.error("Catalyst scan error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
