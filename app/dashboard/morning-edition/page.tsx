import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { morningEditionSchema } from "@/lib/morning-edition"

export const metadata: Metadata = {
  title: "Morning Edition | White80",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

const active = (status: string | null | undefined) => status === "active" || status === "trialing"
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`

export default async function MorningEditionPage({
  searchParams,
}: { searchParams: Promise<{ date?: string | string[] }> }) {
  const auth = await createClient()
  const { data: { user }, error: authError } = await auth.auth.getUser()
  if (authError || !user) redirect("/auth/login?next=/dashboard/morning-edition")
  const admin = createAdminClient()
  const profile = await admin.from("profiles").select("subscription_status").eq("id", user.id).maybeSingle()

  if (!active(profile.data?.subscription_status)) {
    // A site-connected subscription or the same confirmed checkout email.
    // Never use a browser-supplied email or mutate a subscription during a read.
    const linked = await admin.from("newsletter_subscribers").select("status")
      .eq("user_id", user.id).in("status", ["active", "trialing"]).limit(1).maybeSingle()
    const unlinked = !linked.data && user.email_confirmed_at && user.email
      ? await admin.from("newsletter_subscribers").select("status").eq("email", user.email.trim().toLowerCase())
        .is("user_id", null).in("status", ["active", "trialing"]).limit(1).maybeSingle()
      : null
    if (!active(linked.data?.status) && !active(unlinked?.data?.status)) redirect("/account")
  }

  const requested = (await searchParams).date
  const date = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : null
  const query = admin.from("white80_morning_editions").select("content")
  const latest = requested === undefined ? await query.order("session_date", { ascending: false }).limit(1).maybeSingle() :
    date ? await query.eq("session_date", date).maybeSingle() : { data: null, error: null }
  const parsed = morningEditionSchema.safeParse(latest.data?.content)
  const edition = parsed.success ? parsed.data : null
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-10 md:py-16">
      <header className="border-b border-border pb-6">
        <Link href="/account" className="text-sm font-medium text-primary">White80 Pro</Link>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Morning Edition</h1>
        {edition && <p className="mt-2 text-sm text-muted-foreground">
          Market session {edition.sessionDate} · Data captured {dateFormat.format(new Date(edition.capturedAt))} PT
        </p>}
      </header>

      {!edition ? (
        <p className="rounded-xl border border-border p-5 text-muted-foreground">
          {latest.error ? "The edition is temporarily unavailable." : (requested ? "No morning edition is available for that session." : "No morning edition has been published yet.")}
        </p>
      ) : (
        <>
          <section className="space-y-3 rounded-xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold">The Daily</h2>
            <p className="text-sm uppercase tracking-wide text-primary">{edition.brief.verdict.tone}</p>
            <p>{edition.brief.verdict.summary}</p>
            {edition.analysis.status === "measured_facts_only" &&
              <p className="text-sm text-muted-foreground">This edition contains verified observations without commentary.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {(["spy", "qqq"] as const).map((key) => {
                const q = edition.brief.macro_pulse[key]
                return <p key={key} className="font-mono text-sm">{key.toUpperCase()} {money.format(q.price)} · {pct(q.change_pct)}</p>
              })}
            </div>
            {edition.brief.catalysts.length > 0 && <ul className="space-y-2 border-t border-border pt-3">
              {edition.brief.catalysts.map((row, index) => <li key={index} className="text-sm">
                {row.title} <span className="text-muted-foreground">· {row.body}</span>
              </li>)}
            </ul>}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Rocket Board Preview</h2>
              <p className="text-sm text-muted-foreground">{edition.rocketPreview.methodology}</p>
            </div>
            {edition.rocketPreview.candidates.length === 0 && <p className="text-sm text-muted-foreground">No candidates met the data thresholds.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {edition.rocketPreview.candidates.map((r) => (
                <article key={r.ticker} className="space-y-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-mono text-xl font-semibold">{r.ticker}</h3>
                    <p className="font-mono text-sm text-primary">{r.score}/100</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{money.format(r.quote.price)} · {pct(r.quote.changePct)} · {r.direction === "up" ? "Outperforming" : "Underperforming"} SPY</p>
                  {r.commentary ? (
                    <dl className="space-y-2 text-sm">
                      <div><dt className="font-semibold">Why it ranked</dt><dd>{r.commentary.why}</dd></div>
                      <div><dt className="font-semibold">Bull case</dt><dd>{r.commentary.bullCase}</dd></div>
                      <div><dt className="font-semibold">Bear case</dt><dd>{r.commentary.bearCase}</dd></div>
                    </dl>
                  ) : <p className="text-sm text-muted-foreground">No verified commentary for this ticker.</p>}
                  <dl className="space-y-2 border-t border-border pt-3 text-sm">
                    {r.factors.map((f) => <div className="flex justify-between gap-4" key={f.name}>
                      <dt>{f.name}</dt><dd className="font-mono">{f.points}/{f.max}</dd>
                    </div>)}
                  </dl>
                </article>
              ))}
            </div>
          </section>

          {edition.signals.length > 0 && <section className="space-y-3">
            <h2 className="text-xl font-semibold">Watchlist</h2>
            <ul className="divide-y divide-border rounded-xl border border-border px-5">
              {edition.signals.map((s) => <li key={s.ticker} className="grid gap-1 py-3 text-sm sm:grid-cols-[10rem_1fr]">
                <span className="font-mono">{s.ticker} · {pct(s.change_pct)}</span>
                <span className="text-muted-foreground">{s.thesis ?? "Verified price movement only."}</span>
              </li>)}
            </ul>
          </section>}

          <section className="space-y-2 text-sm text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">Sources and coverage</h2>
            {edition.unavailable.map((note) => <p key={note}>{note}</p>)}
            <p>Asymmetry Index not scored. {edition.asymmetry.reason}.</p>
            {edition.evidence.some((e) => e.kind !== "quote") && <ul className="space-y-1">
              {edition.evidence.filter((e) => e.kind !== "quote").map((e) =>
                <li key={e.id}><a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">{e.title}</a> · {e.source}</li>)}
            </ul>}
          </section>
        </>
      )}
    </main>
  )
}
