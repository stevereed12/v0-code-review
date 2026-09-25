import { DELIVERY } from "@/lib/newsletter"

const BRIEFS = [
  {
    time: DELIVERY.premarket,
    title: "PREMARKET BRIEF",
    summary: "The full read on the session before it starts.",
    contents: [
      "Futures and the macro tape — index futures, yields, dollar, crude, VIX",
      "Overnight catalysts — earnings, guidance, FDA decisions, M&A, macro prints",
      "Top gappers, each with the catalyst behind the move",
      "Risk flags on every name — dilution, low float, no news found",
      "The session calendar — data releases and scheduled speakers",
    ],
  },
  {
    time: DELIVERY.confirmation,
    title: "CONFIRMATION BRIEF",
    summary: "What the open confirmed — and what it didn't.",
    contents: [
      "How the open traded against the premarket read",
      "Which gappers held and which faded",
      "Volume confirmation on the names that matter",
      "New filings, halts, or flags since the premarket brief",
      "The read for the rest of the morning",
    ],
  },
]

export function BriefsSection() {
  return (
    <section id="briefs" className="scroll-mt-20 border-t border-border px-4 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="font-display text-5xl text-foreground text-balance md:text-6xl">TWO BRIEFS. EVERY TRADING DAY.</h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            One before the open, one after it. Short enough to read over coffee, specific enough to act on.
          </p>
        </div>

        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {BRIEFS.map((brief) => (
            <article key={brief.title} className="flex flex-col gap-6 bg-background p-8">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-3xl tracking-wide text-foreground">{brief.title}</h3>
                <span className="font-mono text-xs text-primary">{brief.time}</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{brief.summary}</p>
              <ul className="flex flex-col gap-3">
                {brief.contents.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
