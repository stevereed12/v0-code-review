const FUTURES = [
  { name: "S&P 500 fut", value: "+0.42%", up: true },
  { name: "Nasdaq 100 fut", value: "+0.61%", up: true },
  { name: "Russell 2000 fut", value: "-0.18%", up: false },
  { name: "10Y yield", value: "4.21% (+3bp)", up: false },
  { name: "WTI crude", value: "-1.1%", up: false },
  { name: "VIX", value: "15.8", up: true },
]

const CATALYSTS = [
  "CPI prints at 8:30 ET — consensus 0.2% m/m core. The tape is leaning on an in-line number.",
  "Semis bid overnight after a large-cap supplier raised full-year guidance after the close.",
  "Crude soft on inventory build; energy names indicated lower.",
]

const GAPPERS = [
  { ticker: "ORBX", gap: "+18.4%", catalyst: "Phase 2 topline data beat primary endpoint", flags: [] as string[] },
  { ticker: "VNTR", gap: "+11.2%", catalyst: "Raised FY guidance, beat on revenue", flags: [] as string[] },
  { ticker: "KSTL", gap: "+34.0%", catalyst: "No news found", flags: ["NO NEWS FOUND", "LOW FLOAT"] },
  { ticker: "PLMA", gap: "-9.6%", catalyst: "Priced $40M offering after the close", flags: ["DILUTION"] },
]

export function SampleBrief() {
  return (
    <section id="sample" className="scroll-mt-20 border-t border-border px-4 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="font-display text-5xl text-foreground text-balance md:text-6xl">WHAT LANDS IN YOUR INBOX</h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            An excerpt from a premarket brief. This sample uses fictional tickers and events to show the format.
          </p>
        </div>

        <article className="border border-border bg-card" aria-label="Sample premarket brief">
          <header className="flex flex-col gap-2 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 bg-primary" aria-hidden="true" />
              <span className="font-mono text-xs tracking-[0.2em] text-foreground">WHITE 80 · PREMARKET BRIEF</span>
            </div>
            <span className="font-mono text-[11px] tracking-wider text-muted-foreground">
              SAMPLE · FICTIONAL TICKERS · NOT A RECOMMENDATION
            </span>
          </header>

          <div className="flex flex-col gap-10 p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-xs tracking-[0.2em] text-primary">THE READ</h3>
              <p className="max-w-3xl text-lg leading-relaxed text-foreground text-pretty">
                Risk-on into CPI, led by semis. Small caps lagging, so this is a large-cap tape for now. The gap
                list is catalyst-heavy on the long side — but the biggest mover has no news behind it. Treat it
                accordingly.
              </p>
            </div>

            <div className="grid gap-10 lg:grid-cols-5">
              <div className="flex flex-col gap-3 lg:col-span-2">
                <h3 className="font-mono text-xs tracking-[0.2em] text-primary">FUTURES & MACRO</h3>
                <dl className="flex flex-col font-mono text-sm">
                  {FUTURES.map((row) => (
                    <div key={row.name} className="flex justify-between gap-4 border-b border-border py-2">
                      <dt className="text-muted-foreground">{row.name}</dt>
                      <dd className={row.up ? "text-primary" : "text-foreground"}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex flex-col gap-3 lg:col-span-3">
                <h3 className="font-mono text-xs tracking-[0.2em] text-primary">OVERNIGHT CATALYSTS</h3>
                <ul className="flex flex-col gap-3">
                  {CATALYSTS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-muted-foreground" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-mono text-xs tracking-[0.2em] text-primary">TOP GAPPERS</h3>
              <ul className="flex flex-col border-t border-border">
                {GAPPERS.map((row) => (
                  <li
                    key={row.ticker}
                    className="flex flex-col gap-2 border-b border-border py-3 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="flex items-center gap-4 sm:w-40 sm:shrink-0">
                      <span className="font-mono text-sm text-foreground">{row.ticker}</span>
                      <span
                        className={`font-mono text-sm ${row.gap.startsWith("-") ? "text-destructive" : "text-primary"}`}
                      >
                        {row.gap}
                      </span>
                    </div>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{row.catalyst}</p>
                    {row.flags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {row.flags.map((flag) => (
                          <span
                            key={flag}
                            className="border border-destructive/50 px-2 py-0.5 font-mono text-[10px] tracking-wider text-destructive"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
