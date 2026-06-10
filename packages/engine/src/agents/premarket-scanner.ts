// ─── PRE-MARKET SCANNER ──────────────────────────────────────────────────────
// Runs at 8:00 AM ET, 30 minutes before the 8:30 AM brief. Catches overnight
// gaps, futures-implied index moves (via SPY/QQQ pre-market), VIX proxy (VXX),
// and earnings reactions across the same ~150-name universe as the alert scanner.
// Writes a snapshot file the 8:30 AM brief pipeline reads as context.

import OpenAI from "openai"
import { writeFileSync } from "node:fs"
import { resolvePolygonKey } from "../model"
import { ALERT_UNIVERSE } from "./alert-scanner"

const POLYGON_BASE = "https://api.polygon.io"
const SNAPSHOT_PATH = "/tmp/white80-premarket-snapshot.json"
const GAP_THRESHOLD = 1.5 // %
const MAX_GAPPERS = 15

export interface PremarketSnapshot {
  scanTime: string // ISO timestamp
  spyPremarket: { price: number; changePct: number }
  qqqPremarket: { price: number; changePct: number }
  vixLevel: number
  overnightGappers: OvernightGapper[] // top movers vs prior close
  earningsReactions: EarningsReaction[]
}

export interface OvernightGapper {
  ticker: string
  priorClose: number
  premarketPrice: number
  gapPct: number // positive = gap up, negative = gap down
  direction: "up" | "down"
}

export interface EarningsReaction {
  ticker: string
  gapPct: number
  direction: "up" | "down"
  note: string // one-line from sonar: "Beat EPS by $0.12, guided higher"
}

// ─── POLYGON SNAPSHOT FETCH ──────────────────────────────────────────────────

interface SnapshotTicker {
  ticker: string
  lastTrade?: { p: number }
  lastQuote?: { P: number; p: number }
  min?: { c: number }
  day?: { c: number }
  prevDay?: { c: number }
  todaysChangePerc?: number
}

/** Batch-fetch Polygon snapshots for the given tickers. */
async function fetchSnapshots(tickers: string[], apiKey: string): Promise<Map<string, SnapshotTicker>> {
  const out = new Map<string, SnapshotTicker>()
  // Polygon caps the tickers query param; chunk to stay well under limits.
  const chunkSize = 100
  for (let i = 0; i < tickers.length; i += chunkSize) {
    const chunk = tickers.slice(i, i + chunkSize)
    const url = `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${chunk.join(",")}&apiKey=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) continue
    const data = (await res.json()) as { tickers?: SnapshotTicker[] }
    for (const t of data.tickers ?? []) out.set(t.ticker, t)
  }
  return out
}

/** Pre-market (or latest) price for a snapshot. Mirrors the pipeline's priority order. */
function premarketPrice(t: SnapshotTicker | undefined): number {
  if (!t) return 0
  return t.min?.c || t.lastQuote?.P || t.lastQuote?.p || t.lastTrade?.p || t.day?.c || t.prevDay?.c || 0
}

function priorClose(t: SnapshotTicker | undefined): number {
  if (!t) return 0
  return t.prevDay?.c || 0
}

function changePct(price: number, prior: number): number {
  return prior > 0 ? ((price - prior) / prior) * 100 : 0
}

// ─── EARNINGS REACTIONS (sonar) ──────────────────────────────────────────────

interface SonarEarnings {
  ticker: string
  gapPct_estimate?: number
  note?: string
}

/** Ask sonar which universe names reported earnings overnight. Best-effort. */
async function fetchEarningsTickers(tickers: string[]): Promise<SonarEarnings[]> {
  if (!process.env.PERPLEXITY_API_KEY?.trim()) return []
  try {
    const client = new OpenAI({
      apiKey: process.env.PERPLEXITY_API_KEY,
      baseURL: "https://api.perplexity.ai",
    })
    const completion = await client.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `You are a financial news monitor with access to live web search. From this list, identify ONLY the tickers whose earnings release has ACTUALLY BEEN PUBLISHED after market close yesterday or pre-market today: ${tickers.join(", ")}.

For each one, the "note" must state the actual reported figures (EPS beat/miss, revenue vs estimate) taken from the published release. Do NOT include a ticker whose earnings are merely SCHEDULED but not yet reported, and never fabricate or estimate results. If earnings are due but not yet out, omit the ticker.

Reply with a JSON array: [{ticker, gapPct_estimate, note}] or [] if none have actually reported.

CRITICAL: Never invent or estimate earnings results. Only include a ticker if you are certain its earnings report has been published.`,
        },
      ],
    })
    const text = (completion.choices?.[0]?.message?.content ?? "").trim()
    if (!text) return []
    const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim()
    const start = cleaned.indexOf("[")
    const end = cleaned.lastIndexOf("]")
    if (start === -1 || end === -1 || end < start) return []
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((e): e is SonarEarnings => e && typeof e.ticker === "string")
      .map((e) => ({ ticker: e.ticker.toUpperCase(), gapPct_estimate: e.gapPct_estimate, note: e.note }))
  } catch {
    return []
  }
}

// ─── MAIN SCAN ───────────────────────────────────────────────────────────────

/**
 * Run the pre-market scan. Fetches SPY/QQQ/VXX and the full alert universe in
 * batched Polygon snapshot calls, computes overnight gappers, cross-references
 * sonar-identified earnings names against real gap data, writes the snapshot to
 * /tmp/white80-premarket-snapshot.json, and returns it.
 */
export async function runPremarketScan(): Promise<PremarketSnapshot> {
  const apiKey = resolvePolygonKey()
  if (!apiKey) throw new Error("POLYGON_KEY_REQUIRED")

  // Fetch index/VIX proxies and the universe in parallel.
  const indexTickers = ["SPY", "QQQ", "VXX"]
  const universe = [...new Set([...indexTickers, ...ALERT_UNIVERSE])]
  const [snapshots, earnings] = await Promise.all([
    fetchSnapshots(universe, apiKey),
    fetchEarningsTickers(ALERT_UNIVERSE),
  ])

  // ── Index strip ──
  const spySnap = snapshots.get("SPY")
  const qqqSnap = snapshots.get("QQQ")
  const vxxSnap = snapshots.get("VXX")

  const spyPrice = premarketPrice(spySnap)
  const qqqPrice = premarketPrice(qqqSnap)
  const spyPremarket = { price: spyPrice, changePct: changePct(spyPrice, priorClose(spySnap)) }
  const qqqPremarket = { price: qqqPrice, changePct: changePct(qqqPrice, priorClose(qqqSnap)) }
  const vixLevel = premarketPrice(vxxSnap) // VXX as VIX proxy — Polygon doesn't carry CBOE VIX directly

  // ── Overnight gappers ──
  const gappers: OvernightGapper[] = []
  for (const ticker of ALERT_UNIVERSE) {
    const snap = snapshots.get(ticker)
    const prior = priorClose(snap)
    const price = premarketPrice(snap)
    if (prior <= 0 || price <= 0) continue
    const gap = changePct(price, prior)
    if (Math.abs(gap) <= GAP_THRESHOLD) continue
    gappers.push({
      ticker,
      priorClose: prior,
      premarketPrice: price,
      gapPct: gap,
      direction: gap >= 0 ? "up" : "down",
    })
  }
  gappers.sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct))
  const overnightGappers = gappers.slice(0, MAX_GAPPERS)

  // ── Earnings reactions: cross-reference sonar names with real gap data ──
  const gapByTicker = new Map(gappers.map((g) => [g.ticker, g]))
  const earningsReactions: EarningsReaction[] = earnings.map((e) => {
    const real = gapByTicker.get(e.ticker)
    const gapPct = real ? real.gapPct : e.gapPct_estimate ?? 0
    return {
      ticker: e.ticker,
      gapPct,
      direction: gapPct >= 0 ? "up" : "down",
      note: e.note?.trim() || "Reported earnings overnight",
    }
  })

  const snapshot: PremarketSnapshot = {
    scanTime: new Date().toISOString(),
    spyPremarket,
    qqqPremarket,
    vixLevel,
    overnightGappers,
    earningsReactions,
  }

  try {
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2))
  } catch {
    /* non-fatal — caller still gets the snapshot in memory */
  }

  return snapshot
}
