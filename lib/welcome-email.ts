// ─── WELCOME EMAIL ───────────────────────────────────────────────────────────
// Sent once per Stripe checkout (idempotency key = checkout session id), from the
// webhook, so it goes out even if the buyer closes the tab before /subscribed loads.

import { Resend } from "resend"
import { DELIVERY, NEWSLETTER } from "@/lib/newsletter"

const FROM = process.env.WELCOME_EMAIL_FROM || "White 80 <brief@white80.io>"
const REPLY_TO = "contact@white80.io"
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.white80.io"

// Brand bible: Void Black / Terminal Cream / Signal Green, Bebas Neue + DM Mono + DM Sans.
const C = { bg: "#0a0a0a", panel: "#121210", line: "#262620", cream: "#f4f0e6", muted: "#9a958a", green: "#c8ff00" }

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" })
}

export function buildWelcomeEmail(trialEndIso: string | null) {
  const trialEnd = fmtDate(trialEndIso)
  const subject = "You're in. Here's what hits your inbox."

  const text = [
    "WHITE 80",
    "",
    "You're in.",
    "",
    trialEnd
      ? `Your ${NEWSLETTER.trialDays}-day trial is live. Nothing is charged until ${trialEnd}.`
      : `Your ${NEWSLETTER.trialDays}-day trial is live.`,
    "",
    "THE ROUTINE, EVERY TRADING DAY",
    `${DELIVERY.premarket}  PREMARKET - futures, overnight gappers, what moved and why.`,
    `${DELIVERY.confirmation}  DAILY BRIEF - the setups, the levels, and the risk on every name.`,
    "No briefs on weekends or market holidays.",
    "",
    "SO YOU DON'T MISS ONE",
    "1. Add brief@white80.io to your contacts. In Gmail, drag the first one into Primary.",
    "2. Read it before the open. It's built to take three minutes.",
    "",
    `Manage or cancel anytime: ${SITE}/account`,
    "Questions, or something looks wrong? Just reply.",
    "",
    "- Steve, White 80",
    "",
    "For informational purposes only. Not financial advice.",
  ].join("\n")

  const row = (time: string, label: string, desc: string) => `
    <tr>
      <td style="padding:14px 0;border-top:1px solid ${C.line};vertical-align:top;width:120px;font-family:'DM Mono',Menlo,monospace;font-size:13px;color:${C.green};">${time}</td>
      <td style="padding:14px 0;border-top:1px solid ${C.line};font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:${C.cream};">
        <strong style="font-family:'DM Mono',Menlo,monospace;font-size:12px;letter-spacing:1px;">${label}</strong><br>
        <span style="color:${C.muted};">${desc}</span>
      </td>
    </tr>`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${C.panel};border:1px solid ${C.line};">
  <tr><td style="padding:28px 28px 0;">
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;letter-spacing:2px;color:${C.cream};">
      <span style="display:inline-block;width:10px;height:10px;background:${C.green};margin-right:8px;vertical-align:middle;"></span>WHITE 80
    </div>
  </td></tr>
  <tr><td style="padding:24px 28px 8px;">
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:44px;line-height:1;letter-spacing:1px;color:${C.cream};">YOU'RE IN.</div>
    <p style="margin:14px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.muted};">
      Your ${NEWSLETTER.trialDays}-day trial is live.${trialEnd ? ` Nothing is charged until <span style="color:${C.cream};">${trialEnd}</span>.` : ""}
    </p>
  </td></tr>
  <tr><td style="padding:20px 28px 0;">
    <div style="font-family:'DM Mono',Menlo,monospace;font-size:11px;letter-spacing:2px;color:${C.muted};padding-bottom:6px;">THE ROUTINE &middot; EVERY TRADING DAY</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row(DELIVERY.premarket, "PREMARKET", "Futures, overnight gappers, what moved and why.")}
      ${row(DELIVERY.confirmation, "DAILY BRIEF", "The setups, the levels, and the risk on every name.")}
    </table>
    <p style="margin:6px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;color:${C.muted};">No briefs on weekends or market holidays.</p>
  </td></tr>
  <tr><td style="padding:24px 28px 0;">
    <div style="font-family:'DM Mono',Menlo,monospace;font-size:11px;letter-spacing:2px;color:${C.muted};padding-bottom:8px;">SO YOU DON'T MISS ONE</div>
    <p style="margin:0 0 8px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${C.cream};">
      <span style="color:${C.green};font-family:'DM Mono',Menlo,monospace;">01</span>&nbsp; Add <strong>brief@white80.io</strong> to your contacts. In Gmail, drag the first one into Primary.
    </p>
    <p style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:${C.cream};">
      <span style="color:${C.green};font-family:'DM Mono',Menlo,monospace;">02</span>&nbsp; Read it before the open. It's built to take three minutes.
    </p>
  </td></tr>
  <tr><td style="padding:28px 28px 0;">
    <a href="${SITE}/account" style="display:inline-block;background:${C.green};color:${C.bg};font-family:'DM Mono',Menlo,monospace;font-size:13px;font-weight:bold;letter-spacing:1px;text-decoration:none;padding:12px 20px;">MANAGE MEMBERSHIP</a>
  </td></tr>
  <tr><td style="padding:24px 28px 28px;">
    <p style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:${C.muted};">
      Questions, or something looks wrong? Just reply.<br>
      <span style="color:${C.cream};">&mdash; Steve, White 80</span>
    </p>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid ${C.line};font-family:'DM Mono',Menlo,monospace;font-size:10px;letter-spacing:1px;color:${C.muted};">
    INTELLIGENCE IS THE POSITION &middot; For informational purposes only. Not financial advice.
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  return { subject, html, text }
}

/** Send the welcome email. Never throws: a failed welcome must not fail the webhook. */
export async function sendWelcomeEmail(to: string, trialEndIso: string | null, idempotencyKey: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("Welcome email skipped: RESEND_API_KEY not set")
    return
  }
  try {
    const { subject, html, text } = buildWelcomeEmail(trialEndIso)
    const { error } = await new Resend(key).emails.send(
      { from: FROM, to: [to], replyTo: REPLY_TO, subject, html, text },
      { idempotencyKey: `welcome/${idempotencyKey}` },
    )
    if (error) console.error("Welcome email failed:", error)
    else console.log(`Welcome email sent to ${to}`)
  } catch (e) {
    console.error("Welcome email error:", e)
  }
}
