import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { ingestMorningEdition, type EditionInsert } from "../lib/morning-ingest"

const fixture = JSON.parse(readFileSync("tests/fixtures/morning-edition.json", "utf8"))
const secret = "x".repeat(32)
const good = { authorization: `Bearer ${secret}`, "content-type": "application/json" }
const now = () => new Date("2026-11-27T13:30:00.000Z")

function storage() {
  const editions = new Map<string, EditionInsert>()
  const deps = {
    secret, now,
    insert: async (row: EditionInsert): Promise<"created" | "conflict"> => {
      if (editions.has(row.edition_id)) return "conflict"
      editions.set(row.edition_id, row)
      return "created"
    },
    existingHash: async (editionId: string) => editions.get(editionId)?.content_sha256,
  }
  return { editions, deps }
}
const endpoint = (body: string, headers: Record<string, string> = good) => new Request(
  "https://example.com/api/internal/morning-edition", { method: "POST", headers, body },
)

test("worker fixture is accepted unchanged and publishing identical bytes is idempotent", async () => {
  const { editions, deps } = storage()
  const raw = JSON.stringify(fixture)
  const first = await ingestMorningEdition(endpoint(raw), deps)
  assert.equal(first.status, 201)
  assert.equal(first.headers.get("cache-control"), "no-store")
  assert.deepEqual(await first.json(), { editionId: fixture.editionId, status: "published" })
  assert.deepEqual(editions.get(fixture.editionId)?.content, fixture)
  const again = await ingestMorningEdition(endpoint(raw), deps)
  assert.equal(again.status, 200)
  assert.deepEqual(await again.json(), { editionId: fixture.editionId, status: "already_published" })
  const updated = structuredClone(fixture)
  updated.brief.verdict.summary = "Different edition"
  const conflict = await ingestMorningEdition(endpoint(JSON.stringify(updated)), deps)
  assert.equal(conflict.status, 409)
  assert.deepEqual(editions.get(fixture.editionId)?.content, fixture)
})

test("unconfigured, unauthorized, giant and malformed payloads do not touch storage", async () => {
  const { editions, deps } = storage()
  const raw = JSON.stringify(fixture)
  assert.equal((await ingestMorningEdition(endpoint(raw), { ...deps, secret: undefined })).status, 503)
  assert.equal((await ingestMorningEdition(endpoint(raw, {}), deps)).status, 401)
  assert.equal((await ingestMorningEdition(endpoint(raw, { authorization: good.authorization }), deps)).status, 415)
  assert.equal((await ingestMorningEdition(endpoint(" ".repeat(262_145)), deps)).status, 413)
  assert.equal((await ingestMorningEdition(endpoint("not JSON"), deps)).status, 400)
  assert.equal(editions.size, 0)
})

test("wrong day, altered scores, invalid link text and external code are not accepted", async () => {
  const { editions, deps } = storage()
  const raw = JSON.stringify(fixture)
  assert.equal((await ingestMorningEdition(endpoint(raw), { ...deps, now: () => new Date("2026-11-28T13:30:00Z") })).status, 422)
  const wrongScore = structuredClone(fixture)
  wrongScore.rocketPreview.candidates[0].score++
  assert.equal((await ingestMorningEdition(endpoint(JSON.stringify(wrongScore)), deps)).status, 422)
  const wrongLink = structuredClone(fixture)
  for (const url of ["not a url", "javascript:alert(1)"]) {
    wrongLink.evidence[0].url = url
    assert.equal((await ingestMorningEdition(endpoint(JSON.stringify(wrongLink)), deps)).status, 422)
  }
  assert.equal(editions.size, 0)
})
