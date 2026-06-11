import { NextRequest, NextResponse } from "next/server"
import { askModel, MODELS } from "@/lib/model"

// ─── CATALYST DETECTION API ──────────────────────────────────────────────────
// Finds upcoming catalysts for a batch of tickers. Routed through the Watchlist
// model (perplexity/sonar) because catalyst discovery needs live, grounded news
// retrieval per ticker — sonar has web search built in.

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

    let catalysts: CatalystInfo[] = []
    try {
      const data = await askModel<CatalystInfo[]>(MODELS.WATCHLIST, "", prompt)
      if (Array.isArray(data)) catalysts = data
    } catch (err) {
      const message = (err as Error).message || ""
      if (/rate limit/i.test(message)) {
        return NextResponse.json({ error: message }, { status: 429 })
      }
      if (message === "API_KEY_REQUIRED") {
        return NextResponse.json({ error: "API_KEY_REQUIRED" }, { status: 401 })
      }
      // A parse/transport failure shouldn't 500 the whole scan — return none.
      console.error("Catalyst model call failed:", err)
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
