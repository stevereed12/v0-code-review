import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { memberBoard, parseDirection, parseSession, publicBoard, sampleBoard } from "../lib/rocket-board"
import { morningEditionSchema } from "../lib/morning-edition"

const fixture = morningEditionSchema.parse(JSON.parse(readFileSync("tests/fixtures/morning-edition.json", "utf8")))
const candidate = fixture.rocketPreview.candidates[0]
function asDate(date: string) {
  return { ...structuredClone(fixture), sessionDate: date, editionId: "white80-" + date }
}

test("public board sorts the edition and releases only top-five projected fields", () => {
  const edition = asDate(fixture.sessionDate)
  edition.rocketPreview.candidates = Array.from({ length: 8 }, (_, i) => {
    const ticker = "TEST-" + i
    return { ...candidate, ticker, quote: { ...candidate.quote, ticker }, score: 50 + i,
      factors: [{ name: "Test move", points: 30, max: 50 }, { name: "Test volume", points: 20 + i, max: 50 }],
      commentary: { ...candidate.commentary!, ticker, evidenceIds: ["secret-fixture"] } }
  })
  const top = publicBoard(edition)
  assert.equal(top.sessionDate, "2026-11-27")
  assert.deepEqual(top.rockets.map((r) => r.ticker), ["TEST-7", "TEST-6", "TEST-5", "TEST-4", "TEST-3"])
  assert.deepEqual(top.rockets.map((r) => r.rank), [1, 2, 3, 4, 5])
  assert.deepEqual(Object.keys(top.rockets[0]).sort(), ["commentary", "direction", "factors", "rank", "score", "ticker"])
  assert.ok(!JSON.stringify(top).includes("secret-fixture"))
  assert.equal(top.rockets[0].commentary?.bullCase, candidate.commentary?.bullCase)
})

test("member filtering preserves overall rank, and evidence never crosses tickers", () => {
  const e = asDate(fixture.sessionDate)
  const c = e.rocketPreview.candidates[0]
  c.commentary!.evidenceIds = ["news:good", "news:wrong", "quote:TEST", "news:good"]
  e.evidence.push(
    { id: "news:good", kind: "news", url: "https://example.com/good", tickers: ["TEST"], source: "Test", title: "In scope", time: e.sessionDate },
    { id: "news:wrong", kind: "news", url: "https://example.com/wrong", tickers: ["OTHER"], source: "Test", title: "Out of scope", time: e.sessionDate },
  )
  e.rocketPreview.candidates.push({ ...c, direction: "down", ticker: "OTHER", quote: { ...c.quote, ticker: "OTHER" },
    score: 1, factors: [{ name: "Low test score", points: 1, max: 100 }], commentary: null })
  const all = memberBoard(e, [], "all").rockets
  assert.deepEqual(all.find((r) => r.ticker === "TEST")?.sources.map((x) => x.id), ["news:good"])
  assert.deepEqual(memberBoard(e, [], "down").rockets.map((r) => [r.ticker, r.rank]), [["OTHER", 2]])
  assert.equal(all.find((r) => r.ticker === "TEST")?.quote.asOf, candidate.quote.asOf)
})

test("history only shows earlier editions with a compatible method, and no fabricated ranks", () => {
  const missing = asDate("2026-11-25")
  missing.rocketPreview.candidates = []
  const changed = asDate("2026-11-24")
  changed.rocketPreview.methodology = "Something else"
  const old = asDate("2026-11-23")
  const later = asDate("2026-11-30")
  const list = memberBoard(fixture, [old, fixture, later, changed, missing], "all").rockets[0].recent
  assert.deepEqual(list, [
    { date: "2026-11-25", score: null, rank: null }, { date: "2026-11-23", score: candidate.score, rank: 1 },
  ])
})
test("sample is five fictional rows without dates or quotes and request filters fail safely", () => {
  assert.equal(sampleBoard.status, "sample")
  assert.equal(sampleBoard.sessionDate, null)
  assert.equal(sampleBoard.rockets.length, 5)
  assert.ok(sampleBoard.rockets.every((r) => r.ticker.startsWith("DEMO-") && !("quote" in r)))
  assert.equal(parseSession("2026-02-30"), null)
  assert.equal(parseSession(["2026-11-27"]), null)
  assert.equal(parseSession("2026-11-27"), "2026-11-27")
  assert.equal(parseDirection("DOWN"), "all")
  assert.equal(parseDirection("down"), "down")
})
