import type { MorningEdition } from "./morning-edition"

type Candidate = MorningEdition["rocketPreview"]["candidates"][number]
export type RocketFactor = Candidate["factors"][number]
type Direction = Candidate["direction"]
export type BoardDirection = "all" | Direction
type RocketCopy = Pick<NonNullable<Candidate["commentary"]>, "why" | "bullCase" | "bearCase">

export interface PublicRocket {
  rank: number
  ticker: string
  direction: Direction
  score: number
  factors: RocketFactor[]
  commentary: RocketCopy | null
}

export interface MemberRocket extends PublicRocket {
  quote: Candidate["quote"]
  sources: MorningEdition["evidence"]
  recent: { date: string; score: number | null; rank: number | null }[]
}

export interface PublicBoard {
  sessionDate: string | null
  methodology: string
  status: "sample" | "published"
  rockets: PublicRocket[]
}

export const PUBLIC_LIMIT = 5
export const MEMBER_HISTORY_LIMIT = 5
const METHOD = "White80 Tape Activity v0"

export function parseDirection(value: unknown): BoardDirection {
  return value === "up" || value === "down" ? value : "all"
}

export function parseSession(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value + "T12:00:00Z")
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? value : null
}

function rank(edition: MorningEdition) {
  return [...new Map(edition.rocketPreview.candidates.map((r) => [r.ticker, r])).values()]
    .sort((a, b) => b.score - a.score || a.ticker.localeCompare(b.ticker))
    .map((row, index) => ({ row, rank: index + 1 }))
}

function asPublic({ row, rank }: { row: Candidate; rank: number }): PublicRocket {
  const c = row.commentary
  // Explicit allowlist. Never return the raw edition, raw quote or evidence IDs.
  return { rank, ticker: row.ticker, direction: row.direction, score: row.score,
    factors: row.factors.map((f) => ({ name: f.name, points: f.points, max: f.max })),
    commentary: c ? { why: c.why, bullCase: c.bullCase, bearCase: c.bearCase } : null }
}

export function publicBoard(edition: MorningEdition): PublicBoard {
  return { sessionDate: edition.sessionDate, methodology: edition.rocketPreview.methodology,
    status: "published", rockets: rank(edition).slice(0, PUBLIC_LIMIT).map(asPublic) }
}

export function memberBoard(edition: MorningEdition, preceding: MorningEdition[], direction: BoardDirection) {
  const compatible = [...new Map(preceding.filter((e) =>
    e.sessionDate < edition.sessionDate && e.rocketPreview.methodology === edition.rocketPreview.methodology &&
    e.schemaVersion === edition.schemaVersion).map((e) => [e.sessionDate, e])).values()]
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, MEMBER_HISTORY_LIMIT)
    .map((e) => ({ date: e.sessionDate, ranked: rank(e) }))
  const evidence = new Map(edition.evidence.map((e) => [e.id, e]))
  const rockets: MemberRocket[] = rank(edition).filter(({ row }) => direction === "all" || row.direction === direction)
    .map(({ row, rank: currentRank }) => {
      const sources = [...new Set(row.commentary?.evidenceIds ?? [])].flatMap((id) => {
        const source = evidence.get(id)
        return source?.tickers.includes(row.ticker) && source.kind !== "quote" ? [source] : []
      })
      return {
        ...asPublic({ row, rank: currentRank }),
        quote: row.quote,
        sources,
        recent: compatible.map(({ date, ranked }) => {
          const match = ranked.find((r) => r.row.ticker === row.ticker)
          return { date, score: match?.row.score ?? null, rank: match?.rank ?? null }
        }),
      }
    })
  return { methodology: edition.rocketPreview.methodology, sessionDate: edition.sessionDate, rockets }
}

const sampleRows: { ticker: string; direction: Direction; move: number; activity: number; why: string; bull: string; bear: string }[] = [
  { ticker: "DEMO-A", direction: "up", move: 47, activity: 41,
    why: "Strong relative movement and active early trading both contributed.",
    bull: "Follow-through after the bell could confirm sustained demand.",
    bear: "Early buying may unwind as regular-session liquidity arrives." },
  { ticker: "DEMO-B", direction: "down", move: 46, activity: 33,
    why: "The move against the benchmark did more of the work than volume.",
    bull: "A reclaim of the early range could point to sellers getting exhausted.",
    bear: "Continued pressure after the bell would make a rebound less convincing." },
  { ticker: "DEMO-C", direction: "up", move: 36, activity: 39,
    why: "Healthy premarket activity supported a meaningful move ahead of the benchmark.",
    bull: "Continued participation could keep the move from fading.",
    bear: "If activity dries up, the relative strength may not hold." },
  { ticker: "DEMO-D", direction: "up", move: 33, activity: 35,
    why: "Both inputs contributed evenly to the ranking.",
    bull: "A steady bid through the opening rotation could confirm the read.",
    bear: "A quick return to the opening range would weaken the case." },
  { ticker: "DEMO-E", direction: "down", move: 42, activity: 23,
    why: "The early move was notable, but participation was weaker than higher-ranked names.",
    bull: "Limited participation leaves room for a bounce if buyers return.",
    bear: "A further pickup in selling would lend weight to the weakness." },
]

export const sampleBoard: PublicBoard = {
  status: "sample", sessionDate: null, methodology: METHOD,
  rockets: sampleRows.map((r, i) => ({
    rank: i + 1, ticker: r.ticker, direction: r.direction, score: r.move + r.activity,
    factors: [{ name: "Move relative to SPY", points: r.move, max: 50 },
      { name: "Premarket shares traded", points: r.activity, max: 50 }],
    commentary: { why: r.why, bullCase: r.bull, bearCase: r.bear },
  })),
}
