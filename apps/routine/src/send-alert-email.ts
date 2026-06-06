// ─── INTRADAY ALERT EMAIL ────────────────────────────────────────────────────
// Sends a tight HTML alert (not the full brief) via Resend when the intraday
// scanner surfaces conviction signals. Same Resend pattern as send-email.ts.

import { Resend } from "resend"

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

export interface AlertResult {
  ticker: string
  score: number
  delta: number
  topDrivers: string[] // e.g. ["options heat", "volume surge"]
  price: number
  change: number // % change today
}

function nowET(): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  })
}

function subjectFor(alerts: AlertResult[]): string {
  const time = nowET()
  if (alerts.length === 1) {
    const a = alerts[0]
    const drivers = a.topDrivers.slice(0, 2).join(" + ") || "conviction signal"
    return `⚡ ${a.ticker} ${a.score}/100 — ${drivers} (${time})`
  }
  const names = alerts
    .slice(0, 3)
    .map((a) => a.ticker)
    .join(" · ")
  return `⚡ ${alerts.length} alerts — ${names} (${time})`
}

function colorFor(n: number): string {
  if (n > 0) return GREEN
  if (n < 0) return RED
  return MUTED
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(2)}%`
}

function fmtDelta(n: number): string {
  if (n === 0) return "—"
  const sign = n > 0 ? "+" : ""
  return `${sign}${Math.round(n)}`
}

function buildHtml(alerts: AlertResult[]): string {
  const rows = alerts
    .map((a) => {
      const td = `padding:8px 10px;border-bottom:1px solid ${BORDER};font-size:13px;`
      return `<tr>
        <td style="${td}font-weight:700;color:${TEXT};">${a.ticker}</td>
        <td style="${td}color:${ACCENT};font-weight:700;">${a.score}/100</td>
        <td style="${td}color:${TEXT};">$${a.price.toFixed(2)}</td>
        <td style="${td}color:${colorFor(a.change)};">${fmtPct(a.change)}</td>
        <td style="${td}color:${MUTED};">${a.topDrivers.join(", ") || "—"}</td>
        <td style="${td}color:${colorFor(a.delta)};">${fmtDelta(a.delta)}</td>
      </tr>`
    })
    .join("")

  const th = `text-align:left;padding:8px 10px;border-bottom:2px solid ${ACCENT};font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:${MUTED};`

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};">
    <div style="max-width:640px;margin:0 auto;padding:24px;background:${BG};color:${TEXT};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;">
        <span style="color:${ACCENT};">⚡ WHITE80</span> INTRADAY ALERT
      </div>
      <div style="color:${MUTED};font-size:12px;margin:4px 0 18px;">
        ${nowET()} ET · ${alerts.length} ticker${alerts.length === 1 ? "" : "s"} crossed threshold
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="${th}">Ticker</th>
            <th style="${th}">Score</th>
            <th style="${th}">Price</th>
            <th style="${th}">Chg%</th>
            <th style="${th}">Top Drivers</th>
            <th style="${th}">Δ</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="color:${MUTED};font-size:11px;margin-top:18px;border-top:1px solid ${BORDER};padding-top:12px;">
        Scored on live Polygon data + sonar catalyst check. Not investment advice.
      </div>
    </div>
  </body>
</html>`
}

/** Email the intraday alerts. Returns the Resend message id. Throws if key missing. */
export async function sendAlertEmail(alerts: AlertResult[]): Promise<string> {
  if (alerts.length === 0) throw new Error("sendAlertEmail called with no alerts")
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY required to send the alert email.")

  const resend = new Resend(key)
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    subject: subjectFor(alerts),
    html: buildHtml(alerts),
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
  return data?.id ?? "sent"
}
