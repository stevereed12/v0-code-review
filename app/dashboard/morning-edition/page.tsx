import type { Metadata } from "next"
import Link from "next/link"
import { getRocketEdition, requireMorningMembership } from "@/lib/morning-edition-data"
import { parseSession } from "@/lib/rocket-board"

export const metadata: Metadata = {
  title: "Morning Edition | White80",
  robots: { index: false, follow: false },
}
export const dynamic = "force-dynamic"

const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" })
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`

export default async function MorningEditionPage({
  searchParams,
}: { searchParams: Promise<{ date?: string | string[] }> }) {
  const admin = await requireMorningMembership("/dashboard/morning-edition")
  const requested = (await searchParams).date
  const date = parseSession(requested)
  const result = requested === undefined || date
    ? await getRocketEdition(admin, date ?? undefined).then((edition) => ({ edition, unavailable: false }))
      .catch(() => ({ edition: null, unavailable: true }))
    : { edition: null, unavailable: false }
  const { edition } = result
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
          {result.unavailable ? "The edition is temporarily unavailable." : (requested ? "No morning edition is available for that session." : "No morning edition has been published yet.")}
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

          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="text-xl font-semibold">Rocket Board</h2>
              <p className="mt-1 text-sm text-foreground/70">Read both sides of each setup, see what drove the rank and compare prior editions.</p>
            </div>
            <Link href={`/dashboard/rocket-board?date=${edition.sessionDate}`} className="rounded-md border border-primary/40 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">Open this edition’s board →</Link>
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
