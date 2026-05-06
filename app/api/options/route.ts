import { NextRequest, NextResponse } from "next/server"

const POLYGON_BASE = "https://api.polygon.io"

function getPolygonKey(request: NextRequest): string | null {
  const clientKey = request.nextUrl.searchParams.get("polygonKey")
  return clientKey || process.env.POLYGON_API_KEY || null
}

interface OptionsContract {
  strike: number
  expiration: string
  type: "call" | "put"
  volume: number
  openInterest: number
  impliedVolatility: number
  lastPrice: number
  bid: number
  ask: number
}

interface OptionsChainSummary {
  ticker: string
  currentPrice: number
  callPutRatio: number
  totalCallVolume: number
  totalPutVolume: number
  totalCallOI: number
  totalPutOI: number
  atmCallsVolume: number
  atmPutsVolume: number
  atmSkew: number // % of volume near the money
  hotStrikes: Array<{
    strike: number
    expiration: string
    type: "call" | "put"
    volume: number
    openInterest: number
    unusual: boolean
    reason: string
  }>
  unusualActivity: boolean
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL"
  summary: string
}

async function fetchOptionsChain(
  ticker: string,
  currentPrice: number,
  apiKey: string
): Promise<OptionsChainSummary | null> {
  try {
    // Get options contracts expiring in next 45 days
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + 45)
    
    const fromDate = now.toISOString().split("T")[0]
    const toDate = future.toISOString().split("T")[0]
    
    // Fetch contracts list
    const contractsUrl = `${POLYGON_BASE}/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date.gte=${fromDate}&expiration_date.lte=${toDate}&limit=250&apiKey=${apiKey}`
    
    const contractsRes = await fetch(contractsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    })
    
    if (!contractsRes.ok) {
      console.warn(`Polygon options contracts failed for ${ticker}: ${contractsRes.status}`)
      return null
    }
    
    const contractsData = await contractsRes.json()
    const contracts = contractsData.results || []
    
    if (contracts.length === 0) return null
    
    // Define ATM range (within 5% of current price)
    const atmLow = currentPrice * 0.95
    const atmHigh = currentPrice * 1.05
    
    // Aggregate data
    let totalCallVolume = 0
    let totalPutVolume = 0
    let totalCallOI = 0
    let totalPutOI = 0
    let atmCallsVolume = 0
    let atmPutsVolume = 0
    
    const hotStrikes: OptionsChainSummary["hotStrikes"] = []
    
    // Fetch snapshot for actual volume data
    const snapshotUrl = `${POLYGON_BASE}/v3/snapshot/options/${ticker}?apiKey=${apiKey}`
    const snapshotRes = await fetch(snapshotUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })
    
    let snapshotData: Record<string, {
      day?: { volume?: number; open_interest?: number }
      implied_volatility?: number
      details?: { strike_price?: number; contract_type?: string; expiration_date?: string }
    }> = {}
    
    if (snapshotRes.ok) {
      const snapshot = await snapshotRes.json()
      if (snapshot.results) {
        for (const opt of snapshot.results) {
          if (opt.details?.strike_price) {
            const key = `${opt.details.contract_type}_${opt.details.strike_price}_${opt.details.expiration_date}`
            snapshotData[key] = opt
          }
        }
      }
    }
    
    // Process contracts
    for (const contract of contracts) {
      const strike = contract.strike_price
      const type = contract.contract_type as "call" | "put"
      const expiration = contract.expiration_date
      const key = `${type}_${strike}_${expiration}`
      const snapshot = snapshotData[key]
      
      const volume = snapshot?.day?.volume || 0
      const oi = snapshot?.day?.open_interest || 0
      const isATM = strike >= atmLow && strike <= atmHigh
      
      if (type === "call") {
        totalCallVolume += volume
        totalCallOI += oi
        if (isATM) atmCallsVolume += volume
      } else {
        totalPutVolume += volume
        totalPutOI += oi
        if (isATM) atmPutsVolume += volume
      }
      
      // Flag unusual activity: volume > 2x OI or volume > 5000
      const unusual = (oi > 0 && volume > oi * 2) || volume > 5000
      if (unusual && volume > 100) {
        hotStrikes.push({
          strike,
          expiration,
          type,
          volume,
          openInterest: oi,
          unusual: true,
          reason: volume > 5000 ? "High absolute volume" : "Volume > 2x OI",
        })
      }
    }
    
    // Calculate ratios
    const totalVolume = totalCallVolume + totalPutVolume
    const callPutRatio = totalPutVolume > 0 ? totalCallVolume / totalPutVolume : totalCallVolume > 0 ? 5 : 1
    const atmSkew = totalVolume > 0 ? ((atmCallsVolume + atmPutsVolume) / totalVolume) * 100 : 0
    
    // Determine sentiment
    let sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL"
    if (callPutRatio > 1.8 && atmSkew > 25) sentiment = "BULLISH"
    else if (callPutRatio > 1.5) sentiment = "BULLISH"
    else if (callPutRatio < 0.7) sentiment = "BEARISH"
    
    const unusualActivity = hotStrikes.length >= 2 || (callPutRatio > 2.5 && atmSkew > 30)
    
    // Sort hot strikes by volume
    hotStrikes.sort((a, b) => b.volume - a.volume)
    
    // Generate summary
    let summary = ""
    if (unusualActivity) {
      summary = `Unusual options activity detected. C/P ratio ${callPutRatio.toFixed(1)}x with ${atmSkew.toFixed(0)}% volume concentrated near ATM.`
    } else if (sentiment === "BULLISH") {
      summary = `Bullish options flow. C/P ratio ${callPutRatio.toFixed(1)}x, ${hotStrikes.filter(s => s.type === "call").length} active call strikes.`
    } else if (sentiment === "BEARISH") {
      summary = `Elevated put activity. C/P ratio ${callPutRatio.toFixed(1)}x suggests hedging or bearish positioning.`
    } else {
      summary = `Normal options flow. C/P ratio ${callPutRatio.toFixed(1)}x, no unusual concentration.`
    }
    
    return {
      ticker,
      currentPrice,
      callPutRatio,
      totalCallVolume,
      totalPutVolume,
      totalCallOI,
      totalPutOI,
      atmCallsVolume,
      atmPutsVolume,
      atmSkew,
      hotStrikes: hotStrikes.slice(0, 5), // Top 5 hot strikes
      unusualActivity,
      sentiment,
      summary,
    }
  } catch (err) {
    console.error(`Options fetch error for ${ticker}:`, err)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const symbolsParam = searchParams.get("symbols")
  const pricesParam = searchParams.get("prices") // JSON of {ticker: price}
  
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols parameter required" }, { status: 400 })
  }
  
  const polygonKey = getPolygonKey(request)
  if (!polygonKey) {
    return NextResponse.json({ error: "POLYGON_KEY_REQUIRED" }, { status: 401 })
  }
  
  const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase())
  let prices: Record<string, number> = {}
  
  if (pricesParam) {
    try {
      prices = JSON.parse(pricesParam)
    } catch {
      // Ignore parse errors
    }
  }
  
  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const currentPrice = prices[symbol] || 100 // Default if no price provided
        const data = await fetchOptionsChain(symbol, currentPrice, polygonKey)
        return { symbol, data }
      })
    )
    
    const map: Record<string, OptionsChainSummary | null> = {}
    for (const { symbol, data } of results) {
      map[symbol] = data
    }
    
    return NextResponse.json({ data: map })
  } catch (err) {
    console.error("Options fetch error:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
