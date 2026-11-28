import { createHash, timingSafeEqual } from "node:crypto"
import { morningEditionSchema } from "./morning-edition"

const maxBytes = 256 * 1024
const digest = (s: string) => createHash("sha256").update(s).digest()
const reply = (data: object, status: number) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } })

async function readBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader()
  if (!reader) return ""
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks, size).toString("utf8")
}

export interface EditionInsert {
  edition_id: string
  session_date: string
  captured_at: string
  content_sha256: string
  content: unknown
}

interface IngestDependencies {
  secret: string | undefined
  now: () => Date
  insert: (row: EditionInsert) => Promise<"created" | "conflict">
  existingHash: (editionId: string) => Promise<string | undefined>
}

export async function ingestMorningEdition(request: Request, deps: IngestDependencies): Promise<Response> {
  const expected = deps.secret?.trim()
  if (!expected || expected.length < 32) return reply({ error: "Publisher is not configured" }, 503)
  const bearer = request.headers.get("authorization") ?? ""
  if (!timingSafeEqual(digest(bearer), digest(`Bearer ${expected}`))) return reply({ error: "Unauthorized" }, 401)
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json")
    return reply({ error: "Expected application/json" }, 415)

  let raw: string | null
  let body: unknown
  try {
    raw = await readBody(request)
    if (raw === null) return reply({ error: "Edition is too large" }, 413)
    body = JSON.parse(raw)
  } catch {
    return reply({ error: "Invalid JSON" }, 400)
  }
  const parsed = morningEditionSchema.safeParse(body)
  if (!parsed.success) return reply({ error: "Invalid edition schema" }, 422)
  const ed = parsed.data
  const now = deps.now()
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now)
  if (ed.sessionDate !== today || Date.parse(ed.capturedAt) > +now + 60_000)
    return reply({ error: "Edition is not for the current session" }, 422)

  const contentHash = digest(raw).toString("hex")
  try {
    const result = await deps.insert({
      edition_id: ed.editionId, session_date: ed.sessionDate, captured_at: ed.capturedAt,
      content_sha256: contentHash, content: body,
    })
    if (result === "created") return reply({ editionId: ed.editionId, status: "published" }, 201)
    const existing = await deps.existingHash(ed.editionId)
    if (existing === contentHash) return reply({ editionId: ed.editionId, status: "already_published" }, 200)
    return reply({ error: "A different edition is already saved for this session" }, 409)
  } catch {
    console.error("Morning edition storage unavailable")
    return reply({ error: "Edition storage unavailable" }, 503)
  }
}
