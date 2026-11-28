import Link from "next/link"
import { ChevronDown } from "lucide-react"
import type { MemberRocket, PublicRocket } from "@/lib/rocket-board"

const localTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", timeZoneName: "short" })
const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" })
const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const shares = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

function MembershipDetails({ rocket }: { rocket: MemberRocket }) {
  const { quote, recent, sources } = rocket
  return <div className="space-y-4 border-t border-border pt-4">
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div><dt className="text-foreground/65">Premarket price</dt><dd className="mt-1 font-mono">{dollars.format(quote.price)}</dd></div>
      <div><dt className="text-foreground/65">Session move</dt><dd className="mt-1 font-mono">{quote.changePct >= 0 ? "+" : ""}{quote.changePct.toFixed(2)}%</dd></div>
      <div><dt className="text-foreground/65">Shares traded</dt><dd className="mt-1 font-mono">{quote.volume === null ? "Unavailable" : shares.format(quote.volume)}</dd></div>
      <div><dt className="text-foreground/65">Observed at</dt><dd className="mt-1 font-mono">{localTime.format(new Date(quote.asOf))}</dd></div>
    </dl>
    {recent.length > 0 && <div>
      <h4 className="mb-2 text-sm font-semibold">Prior editions</h4>
      <ul className="flex flex-wrap gap-2">
        {recent.map(({ date, rank, score }) => <li key={date}>
          <Link href={`/dashboard/rocket-board?date=${date}`} className="flex min-w-24 flex-col rounded-md border border-border px-3 py-2 text-xs hover:border-primary/50">
            <time dateTime={date} className="text-foreground/65">{dateLabel.format(new Date(date + "T12:00:00Z"))}</time>
            <span className="mt-1 font-mono">{rank === null ? "Not ranked" : `#${rank} · ${score}/100`}</span>
          </Link>
        </li>)}
      </ul>
    </div>}
    {sources.length > 0 && <div>
      <h4 className="mb-2 text-sm font-semibold">Supporting sources</h4>
      <ul className="space-y-1 text-sm text-foreground/75">
        {sources.map((e) => <li key={e.id}><a href={e.url} target="_blank" rel="noreferrer noopener" className="underline decoration-foreground/40 underline-offset-2">{e.title}</a> <span className="text-foreground/65">· {e.source}</span></li>)}
      </ul>
    </div>}
  </div>
}

export function RocketRows({ rockets }: { rockets: (PublicRocket | MemberRocket)[] }) {
  if (!rockets.length) return <p className="rounded-xl border border-border bg-card p-5 text-sm text-foreground/75">No tickers met the criteria for this view.</p>
  return <div className="space-y-3">
    {rockets.map((r, index) =>
      <details key={r.ticker} open={index === 0} className="group overflow-hidden rounded-xl border border-border bg-card">
        <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto_auto] items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <span className="min-w-9 font-mono text-sm text-foreground/65">#{String(r.rank).padStart(2,"0")}</span>
          <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="font-mono text-xl font-semibold">{r.ticker}</span>
            <span className={`w-fit rounded border px-2 py-1 text-[11px] font-medium ${r.direction === "up" ? "border-primary/30 text-primary" : "border-destructive/30 text-destructive"}`}>
              {r.direction === "up" ? "Ahead of SPY" : "Behind SPY"}
            </span>
          </span>
          <span className="font-mono text-xl font-semibold text-primary tabular-nums">{r.score}<span className="text-sm font-normal text-foreground/60">/100</span></span>
          <ChevronDown className="size-4 text-foreground/70 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-5 border-t border-border px-4 py-5 sm:px-6">
          <div>
            <h3 className="text-sm font-semibold">Why it ranked</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground/75">
              {r.commentary?.why ?? "Ranked by the observed move relative to SPY and premarket shares traded. No written thesis was available for this edition."}
            </p>
          </div>
          {r.commentary && <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <dt className="text-sm font-semibold text-primary">Bull case</dt>
              <dd className="mt-1 text-sm leading-relaxed text-foreground/85">{r.commentary.bullCase}</dd>
            </div>
            <div className="rounded-md border border-destructive/25 bg-destructive/5 p-3">
              <dt className="text-sm font-semibold text-destructive">Bear case</dt>
              <dd className="mt-1 text-sm leading-relaxed text-foreground/85">{r.commentary.bearCase}</dd>
            </div>
          </dl>}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Score breakdown</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {r.factors.map((f) => <div key={f.name}>
                <div className="flex justify-between gap-3 text-xs">
                  <dt className="text-foreground/70">{f.name}</dt>
                  <dd className="font-mono">{f.points}/{f.max}</dd>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-background" aria-hidden>
                  <div className="h-full rounded bg-primary/70" style={{ width: `${f.max > 0 ? Math.min(100, f.points / f.max * 100) : 0}%` }} />
                </div>
              </div>)}
            </dl>
          </div>
          {"quote" in r && <MembershipDetails rocket={r} />}
        </div>
      </details>)}
  </div>
}

export function BoardMethodology({ name }: { name: string }) {
  return <details className="rounded-xl border border-border px-4 py-4 text-sm sm:px-6">
    <summary className="cursor-pointer font-semibold">How the score works</summary>
    <div className="mt-3 space-y-2 leading-relaxed text-foreground/75">
      <p>{name} ranks the intensity of premarket activity. It is an early watchlist, not the calibrated Rocket Score, a buy or sell signal, or a probability of gain.</p>
      <p>Up to 50 points come from the size of the move versus SPY, in either direction. Up to 50 come from premarket shares traded. A high score can reflect heavy selling as easily as heavy buying.</p>
      <p>The board uses the saved morning snapshot. Prices and ranks do not update intraday.</p>
    </div>
  </details>
}
