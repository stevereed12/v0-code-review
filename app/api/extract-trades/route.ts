import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import type { ExtractedTrade } from "@/lib/types"
import { CLAUDE_MODEL } from "@/lib/ai-config"

export const maxDuration = 60

const EXTRACTION_PROMPT = `You are a trade extraction assistant. Analyze this content and extract all trades/transactions.

For each trade, extract:
- ticker: Stock symbol (e.g., "AAPL", "NVDA")
- action: "BUY" or "SELL"
- quantity: Number of shares or contracts
- price: Price per share/contract
- total: Total dollar amount
- time: Time of execution if shown (e.g., "9:45 AM")
- date: Date of trade (use today's date if not shown)
- contract: For options, the full contract description (e.g., "AAPL $185 Call 5/23")
- isOptions: true if this is an options trade, false for stock

IMPORTANT:
- Extract ALL trades shown, even partial fills
- For options, always capture strike price and expiration
- If you see "Bought" or "Buy", action is "BUY"
- If you see "Sold" or "Sell", action is "SELL"
- Round prices to 2 decimal places
- If quantity is fractional shares, include decimals

Return ONLY a JSON array of trades. No markdown, no explanation.

Example output:
[
  {
    "ticker": "NVDA",
    "action": "BUY",
    "quantity": 10,
    "price": 135.50,
    "total": 1355.00,
    "time": "9:32 AM",
    "date": "2024-01-15",
    "contract": null,
    "isOptions": false
  },
  {
    "ticker": "AAPL",
    "action": "BUY",
    "quantity": 5,
    "price": 2.45,
    "total": 1225.00,
    "time": "10:15 AM",
    "date": "2024-01-15",
    "contract": "AAPL $185 Call 1/19",
    "isOptions": true
  }
]

If no trades can be extracted, return an empty array: []`

function parseCSV(csvContent: string): ExtractedTrade[] {
  // Handle CSV with quoted fields that may contain commas/newlines
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }
  
  const lines = csvContent.split("\n").filter(line => line.trim())
  if (lines.length < 2) return []
  
  const trades: ExtractedTrade[] = []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ""))
  
  // Robinhood specific column indices
  const dateIdx = headers.findIndex(h => h.includes("activity date"))
  const instrumentIdx = headers.findIndex(h => h === "instrument")
  const descriptionIdx = headers.findIndex(h => h === "description")
  const transCodeIdx = headers.findIndex(h => h.includes("trans code"))
  const qtyIdx = headers.findIndex(h => h === "quantity")
  const priceIdx = headers.findIndex(h => h === "price")
  const amountIdx = headers.findIndex(h => h === "amount")
  
  // Skip if we can't find essential columns
  if (instrumentIdx < 0 && transCodeIdx < 0) {
    console.log("[v0] Could not find Robinhood columns, headers:", headers)
    return []
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ""))
    if (values.length < 5) continue
    
    const transCode = transCodeIdx >= 0 ? values[transCodeIdx]?.toUpperCase() : ""
    
    // Only process actual trades: BTO (Buy to Open), STC (Sell to Close), Buy, Sell
    const validTradeCodes = ["BTO", "STC", "BUY", "SELL"]
    if (!validTradeCodes.includes(transCode)) continue
    
    const ticker = instrumentIdx >= 0 ? values[instrumentIdx]?.toUpperCase() : ""
    if (!ticker) continue
    
    const description = descriptionIdx >= 0 ? values[descriptionIdx] : ""
    
    // Determine action: BTO/Buy = BUY, STC/Sell = SELL
    const action: "BUY" | "SELL" = (transCode === "BTO" || transCode === "BUY") ? "BUY" : "SELL"
    
    // Parse quantity (remove any trailing letters like "S" for shares)
    const qtyRaw = qtyIdx >= 0 ? values[qtyIdx]?.replace(/[^\d.]/g, "") : "0"
    const quantity = parseFloat(qtyRaw) || 1
    
    // Parse price (remove $ and commas)
    const priceRaw = priceIdx >= 0 ? values[priceIdx]?.replace(/[$,]/g, "") : "0"
    const price = parseFloat(priceRaw) || 0
    
    // Parse amount (remove $, commas, and parentheses for negative)
    const amountRaw = amountIdx >= 0 ? values[amountIdx]?.replace(/[$,()]/g, "") : "0"
    const total = Math.abs(parseFloat(amountRaw) || 0)
    
    // Get date
    const dateStr = dateIdx >= 0 ? values[dateIdx] : new Date().toISOString().split("T")[0]
    
    // Check if options based on description containing Call/Put
    const isOptions = description.toLowerCase().includes("call") || 
                      description.toLowerCase().includes("put") ||
                      transCode === "BTO" || transCode === "STC"
    
    // Extract contract details from description (e.g., "NVDA 5/15/2026 Call $210.00")
    const contract = isOptions ? description : undefined
    
    trades.push({
      ticker,
      action,
      quantity,
      price,
      total,
      date: dateStr,
      isOptions,
      contract,
    })
  }
  
  console.log("[v0] Parsed", trades.length, "trades from CSV")
  return trades
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const apiKey = formData.get("apiKey") as string | null
    const signalsJson = formData.get("signals") as string | null
    const topPlaysJson = formData.get("topPlays") as string | null
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    let trades: ExtractedTrade[] = []
    
    // Handle CSV files
    if (file.name.endsWith(".csv") || file.type === "text/csv") {
      const csvContent = await file.text()
      trades = parseCSV(csvContent)
    } 
    // Handle image files (screenshots)
    else if (file.type.startsWith("image/")) {
      if (!apiKey) {
        return NextResponse.json({ error: "API key required for image processing" }, { status: 400 })
      }
      
      const anthropic = new Anthropic({ apiKey })
      const imageData = Buffer.from(await file.arrayBuffer()).toString("base64")
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
      
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      })
      
      const textContent = response.content.find(c => c.type === "text")
      if (textContent && textContent.type === "text") {
        try {
          // Clean the response
          let jsonStr = textContent.text.trim()
          jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "")
          trades = JSON.parse(jsonStr)
        } catch {
          return NextResponse.json({ error: "Failed to parse extracted trades" }, { status: 500 })
        }
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use CSV or image." }, { status: 400 })
    }
    
    // Match trades against signals and top plays
    const signals = signalsJson ? JSON.parse(signalsJson) : []
    const topPlays = topPlaysJson ? JSON.parse(topPlaysJson) : []
    
    trades = trades.map(trade => {
      // Check against watchlist signals
      const matchedSignal = signals.find((s: { ticker: string; signal: string }) => 
        s.ticker.toUpperCase() === trade.ticker.toUpperCase() &&
        ((trade.action === "BUY" && (s.signal === "BUY" || s.signal === "WATCH")) ||
         (trade.action === "SELL" && (s.signal === "SELL" || s.signal === "FADE")))
      )
      
      if (matchedSignal) {
        return {
          ...trade,
          matchStatus: "SIGNAL" as const,
          matchedSignal: `${matchedSignal.signal} signal from watchlist`,
        }
      }
      
      // Check against top plays from brief
      const matchedTopPlay = topPlays.find((p: { ticker: string; action: string }) =>
        p.ticker.toUpperCase() === trade.ticker.toUpperCase() &&
        ((trade.action === "BUY" && p.action === "BUY") ||
         (trade.action === "SELL" && (p.action === "SELL" || p.action === "FADE")))
      )
      
      if (matchedTopPlay) {
        return {
          ...trade,
          matchStatus: "TOP_PLAY" as const,
          matchedSignal: `${matchedTopPlay.action} from White 80 Top Plays`,
        }
      }
      
      // Check if ticker was in signals/top plays but direction didn't match
      const tickerInSignals = signals.some((s: { ticker: string }) => 
        s.ticker.toUpperCase() === trade.ticker.toUpperCase()
      )
      const tickerInTopPlays = topPlays.some((p: { ticker: string }) => 
        p.ticker.toUpperCase() === trade.ticker.toUpperCase()
      )
      
      if (tickerInSignals || tickerInTopPlays) {
        return {
          ...trade,
          matchStatus: "OFF_SIGNAL" as const,
          matchedSignal: "Ticker tracked but direction differs",
        }
      }
      
      return {
        ...trade,
        matchStatus: "UNMATCHED" as const,
        matchedSignal: "Not in signals or top plays",
      }
    })
    
    return NextResponse.json({ trades })
  } catch (error) {
    console.error("Trade extraction error:", error)
    
    // Check for rate limit error from Anthropic SDK
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit reached on your Anthropic API key. Please wait a minute and try again, or upgrade your Anthropic plan for higher limits." },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract trades" },
      { status: 500 }
    )
  }
}
