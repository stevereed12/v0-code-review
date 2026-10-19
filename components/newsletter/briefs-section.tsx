import { DELIVERY } from "@/lib/newsletter"

const BRIEFS = [
  {
    time: DELIVERY.premarket,
    title: "Premarket brief",
    summary: "The full read on the session before it starts.",
    contents: [
      "Macro pulse: SPY, QQQ, VIX, dollar, 10-year yield, crude and gold, with what's driving each",
      "Top catalysts: earnings, guidance, analyst moves, macro prints and geopolitics",
      "Sector rotation: which sectors lead, which lag, and why",
      "The verdict: risk-on or risk-off, and what would change it",
      "Names to watch, each with the catalyst, conviction level and the risk spelled out",
    ],
  },
  {
    time: DELIVERY.confirmation,
    title: "Confirmation brief",
    summary: "What the open confirmed, and what it didn't.",
    contents: [
      "How the open traded against the premarket read",
      "Which movers held and which faded",
      "Volume confirmation on the names that matter",
      "New filings, halts or flags since the premarket brief",
      "The read for the rest of the morning",
    ],
  },
]

export function BriefsSection() {
  return (
    <section id="briefs" className="scroll-mt-20 px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            Two briefs, every trading day.
          </h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            One before the open, one after it. Short enough to read over coffee, specific enough to act on.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {BRIEFS.map((brief) => (
            <article key={brief.title} className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold text-foreground">{brief.title}</h3>
                <span className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-foreground">
                  {brief.time}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{brief.summary}</p>
              <ul className="flex flex-col gap-3">
                {brief.contents.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" aria-hidden="true" />
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
