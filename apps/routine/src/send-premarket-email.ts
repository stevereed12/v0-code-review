// ─── PRE-MARKET ALERT EMAIL ──────────────────────────────────────────────────
// Sends a tight pre-market HTML strip (SPY/QQQ/VIX + overnight gappers +
// earnings reactions) via Resend at 8:00 AM ET, ahead of the 8:30 AM brief.
// Same Resend pattern and White80 brand as send-alert-email.ts.

import { Resend } from "resend"
import type { PremarketSnapshot } from "@white80/engine"

const TO = process.env.EMAIL_TO || "steven12.reed@gmail.com"
const FROM = process.env.EMAIL_FROM || "White80 <contact@white80.io>"

// White80 brand palette.
const BG = "#0a0a0a"
const TEXT = "#ffffff"
const ACCENT = "#3b82f6"
const MUTED = "#9ca3af"
const BORDER = "#1f2937"
const GREEN = "#22c55e"
const RED = "#ef4444"

function colorFor(n: number): string {
  if (n > 0) return GREEN
  if (n < 0) return RED
  return MUTED
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

function fmtPct1(n: number): string {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

function subjectFor(s: PremarketSnapshot): string {
  return `🌅 Pre-Market — SPY ${fmtPct(s.spyPremarket.changePct)} · QQQ ${fmtPct(s.qqqPremarket.changePct)} · ${s.overnightGappers.length} gappers (8:00 AM)`
}

function buildHtml(s: PremarketSnapshot): string {
  const td = `padding:8px 10px;border-bottom:1px solid ${BORDER};font-size:13px;`
  const th = `text-align:left;padding:8px 10px;border-bottom:2px solid ${ACCENT};font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:${MUTED};`

  // Row 1 — index / VIX strip.
  const stripCell = (label: string, value: string, color: string) =>
    `<td style="padding:10px 14px;border:1px solid ${BORDER};border-radius:6px;text-align:center;">
       <div style="color:${MUTED};font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
       <div style="color:${color};font-size:16px;font-weight:700;margin-top:2px;">${value}</div>
     </td>`

  const strip = `<table style="border-collapse:separate;border-spacing:8px 0;margin:0 0 18px;">
    <tr>
      ${stripCell("SPY", fmtPct(s.spyPremarket.changePct), colorFor(s.spyPremarket.changePct))}
      ${stripCell("QQQ", fmtPct(s.qqqPremarket.changePct), colorFor(s.qqqPremarket.changePct))}
      ${stripCell("VIX proxy", s.vixLevel.toFixed(2), TEXT)}
    </tr>
  </table>`

  // Row 2 — overnight gappers table.
  const gapperRows = s.overnightGappers
    .map(
      (g) => `<tr>
        <td style="${td}font-weight:700;color:${TEXT};">${g.ticker}</td>
        <td style="${td}color:${colorFor(g.gapPct)};font-weight:700;">${fmtPct1(g.gapPct)}</td>
        <td style="${td}color:${MUTED};">$${g.priorClose.toFixed(2)}</td>
        <td style="${td}color:${TEXT};">$${g.premarketPrice.toFixed(2)}</td>
      </tr>`
    )
    .join("")

  const gappersTable = s.overnightGappers.length
    ? `<table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          <tr>
            <th style="${th}">Ticker</th>
            <th style="${th}">Gap%</th>
            <th style="${th}">Prior Close</th>
            <th style="${th}">Pre-market</th>
          </tr>
        </thead>
        <tbody>${gapperRows}</tbody>
      </table>`
    : `<div style="color:${MUTED};font-size:13px;margin-bottom:18px;">No overnight gappers above 1.5%.</div>`

  // Row 3 — earnings reactions (if any).
  const earningsRows = s.earningsReactions
    .map(
      (e) => `<tr>
        <td style="${td}font-weight:700;color:${TEXT};">${e.ticker}</td>
        <td style="${td}color:${colorFor(e.gapPct)};font-weight:700;">${fmtPct1(e.gapPct)}</td>
        <td style="${td}color:${MUTED};">${e.note}</td>
      </tr>`
    )
    .join("")

  const earningsTable = s.earningsReactions.length
    ? `<div style="color:${ACCENT};font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Earnings reactions</div>
       <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          <tr>
            <th style="${th}">Ticker</th>
            <th style="${th}">Gap%</th>
            <th style="${th}">Note</th>
          </tr>
        </thead>
        <tbody>${earningsRows}</tbody>
      </table>`
    : ""

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};">
    <div style="max-width:640px;margin:0 auto;padding:24px;background:${BG};color:${TEXT};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;">
        <span style="color:${ACCENT};">🌅 WHITE80</span> PRE-MARKET
      </div>
      <div style="color:${MUTED};font-size:12px;margin:4px 0 18px;">
        8:00 AM ET · overnight gaps, futures-implied moves, earnings reactions
      </div>
      ${strip}
      ${gappersTable}
      ${earningsTable}
      <div style="color:${MUTED};font-size:11px;margin-top:6px;border-top:1px solid ${BORDER};padding-top:12px;">
        Pre-market snapshot on live Polygon data + sonar earnings check. Not investment advice.
      </div>
    </div>
  </body>
</html>`
}

/** Email the pre-market snapshot. Returns the Resend message id. Throws if key missing. */
export async function sendPremarketEmail(snapshot: PremarketSnapshot): Promise<string> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY required to send the pre-market email.")

  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: subjectFor(snapshot),
    html: buildHtml(snapshot),
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
  return data?.id ?? "sent"
}
