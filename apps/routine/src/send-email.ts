// ─── EMAIL DELIVERY ──────────────────────────────────────────────────────────
// Sends the finished brief to Steven via Resend: plain-text body, PDF + JSON
// attachments, and the X post draft inlined in the body.

import { readFileSync } from "node:fs"
import { basename } from "node:path"
import { Resend } from "resend"
import type { BriefOutput } from "@white80/engine"

const TO = process.env.EMAIL_TO || "steven12.reed@gmail.com"
const FROM = process.env.EMAIL_FROM || "White80 <contact@white80.io>"

function subjectDate(output: BriefOutput): string {
  const raw = output.brief?.session_date || output.session_date || output.generated_at
  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  }
  return String(raw)
}

export interface SendEmailArgs {
  output: BriefOutput
  pdfPath: string
  xPost: string
}

/** Email the brief. Returns the Resend message id. Throws if RESEND_API_KEY is missing. */
export async function sendEmail({ output, pdfPath, xPost }: SendEmailArgs): Promise<string> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY required to send the brief email.")

  const resend = new Resend(key)

  const vibe = output.vibe || ({} as BriefOutput["vibe"])
  const topPlay = output.brief?.top_plays?.[0]

  const body = [
    `White80 Brief — ${subjectDate(output)}`,
    "",
    `Vibe: ${Math.round(vibe.vibe_score ?? 0)}/100 — ${vibe.mood ?? ""}`,
    vibe.headline ? `"${vibe.headline}"` : "",
    "",
    topPlay ? `Top play: $${topPlay.ticker} — ${topPlay.play}` : "",
    "",
    `Watchlist: ${(output.watchlist || []).join(", ")}`,
    `Tier 1 matches: ${output.tier1?.length ?? 0} · Signals: ${output.signals?.length ?? 0} · Scout: ${output.scout?.length ?? 0}`,
    "",
    "── X post draft ──",
    xPost,
    "",
    "Full brief attached (PDF) along with the raw JSON.",
  ]
    .filter((l) => l !== undefined)
    .join("\n")

  const pdfBuf = readFileSync(pdfPath)
  const jsonBuf = Buffer.from(JSON.stringify(output, null, 2), "utf8")

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `White80 Brief — ${subjectDate(output)}`,
    text: body,
    attachments: [
      { filename: basename(pdfPath), content: pdfBuf },
      { filename: `white80-brief-${output.session_date || "today"}.json`, content: jsonBuf },
    ],
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
  return data?.id ?? "sent"
}
