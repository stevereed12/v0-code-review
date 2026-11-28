import { z } from "zod"

const sessionDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((val) => {
  const date = new Date(val + "T12:00:00Z")
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === val
})
const time = z.string().datetime()
const ticker = z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/)
const count = z.number().int().nonnegative()
const httpsUrl = z.string().url().max(2048).refine((s) => {
  try {
    const url = new URL(s)
    return url.protocol === "https:" && !url.username && !url.password
  } catch { return false }
})
const quote = z.object({
  ticker, price: z.number().positive(), changePct: z.number().finite(), volume: count.nullable(),
  asOf: time, source: z.literal("Massive"),
})
const evidenceIds = z.array(z.string().max(100)).max(80)
const evidence = z.object({
  id: z.string().max(100), kind: z.enum(["quote", "news", "earnings", "economic"]), tickers: z.array(ticker).max(16),
  title: z.string().max(300), source: z.string().max(150), url: httpsUrl, time: z.union([time, sessionDate]),
})
const commentary = z.object({
  ticker, bullCase: z.string().max(260), bearCase: z.string().max(260), why: z.string().max(260), evidenceIds,
})
const metric = z.object({ price: z.number().positive(), change_pct: z.number().finite(), context: z.string().max(200) })
const rotation = z.array(z.object({ sector: ticker, change_pct: z.number().finite() })).max(15)
const watch = z.object({ ticker, action: z.literal("WATCH"), thesis: z.string().max(300) })
const signal = z.object({
  ticker, price: z.number().positive(), change_pct: z.number().finite(), signal: z.literal("WATCH"), thesis: z.string().max(260).optional(),
})
const factor = z.object({ name: z.string().max(80), points: count, max: count }).refine((x) => x.points <= x.max)
const candidate = z.object({
  ticker, quote, direction: z.enum(["up", "down"]), score: count.max(100),
  factors: z.array(factor).min(1).max(8), commentary: commentary.nullable(),
}).refine((x) => x.quote.ticker === x.ticker && (!x.commentary || x.commentary.ticker === x.ticker) &&
  x.factors.reduce((n, f) => n + f.points, 0) === x.score)

const easternDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
export const morningEditionSchema = z.object({
  schemaVersion: z.literal(1),
  editionId: z.string().max(30),
  sessionDate,
  capturedAt: time,
  brief: z.object({
    session_date: sessionDate, session_label: z.literal("Premarket"),
    macro_pulse: z.object({ spy: metric, qqq: metric }),
    catalysts: z.array(z.object({ title: z.string().max(300), body: z.string().max(250) })).max(12),
    sector_rotation: z.object({ leading: rotation, lagging: rotation }),
    verdict: z.object({ tone: z.enum(["FIRM", "SOFT", "MIXED"]), summary: z.string().max(400) }),
    top_plays: z.array(watch).max(5),
  }),
  signals: z.array(signal).max(24),
  rocketPreview: z.object({ methodology: z.string().max(100), candidates: z.array(candidate).max(8) }),
  asymmetry: z.object({ status: z.literal("not_scored"), reason: z.string().max(150) }),
  tickerIntelligence: z.array(z.object({ ticker, quote, commentary: commentary.nullable(), evidenceIds }))
    .max(54).refine((rows) => rows.every((row) => row.ticker === row.quote.ticker &&
      (!row.commentary || row.commentary.ticker === row.ticker))),
  analysis: z.object({ status: z.enum(["narrated", "measured_facts_only"]), evidenceIds }),
  evidence: z.array(evidence).max(105),
  unavailable: z.array(z.string().max(150)).max(16),
}).refine((x) => x.editionId === `white80-${x.sessionDate}` && x.brief.session_date === x.sessionDate &&
  easternDate.format(new Date(x.capturedAt)) === x.sessionDate)

export type MorningEdition = z.infer<typeof morningEditionSchema>
