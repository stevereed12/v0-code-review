const MACRO = [
  { name: "SPY", value: "$770.43", change: "+0.42%", up: true },
  { name: "QQQ", value: "$745.74", change: "+0.63%", up: true },
  { name: "VIX", value: "15.67", change: "+3.23%", up: false },
  { name: "DXY", value: "101.06", change: "-0.23%", up: null },
  { name: "10Y", value: "5.17%", change: "-3 bps", up: null },
  { name: "WTI", value: "$93.02", change: "+1.86%", up: null },
  { name: "Gold", value: "$4,298.69", change: "+0.56%", up: null },
]

const SECTORS = [
  { name: "Technology (XLK)", change: "+0.80%", up: true },
  { name: "Industrials (XLI)", change: "+0.76%", up: true },
  { name: "Consumer Disc. (XLY)", change: "+0.35%", up: true },
  { name: "Consumer Staples (XLP)", change: "-0.02%", up: false },
  { name: "Energy (XLE)", change: "-0.85%", up: false },
]

const PLAYS = [
  {
    ticker: "MU",
    call: "BUY",
    conviction: "High conviction",
    catalyst:
      "Reports fiscal Q4 after the close Sep 30, consensus EPS $31.52. Rosenblatt, Wells Fargo and Citigroup all reiterated Buy/Overweight this week. HBM booked through 2027.",
    risk: null as string | null,
  },
  {
    ticker: "XLE",
    call: "FADE",
    conviction: "Medium conviction",
    catalyst:
      "Only red sector pre-open at -0.85%. A weekend Hormuz deal could gap energy lower Monday; a breakdown in talks sends crude back above $100.",
    risk: "Binary geopolitical event",
  },
  {
    ticker: "INLF",
    call: "FADE",
    conviction: "Low conviction",
    catalyst:
      "Up 118.64% on 24.8M shares with no clear fundamental catalyst identified. Classic micro-cap squeeze signature; options too illiquid for a structured play.",
    risk: "No catalyst found · Micro-cap",
  },
]

function changeColor(up: boolean | null) {
  if (up === true) return "text-positive"
  if (up === false) return "text-negative"
  return "text-muted-foreground"
}

export function SampleBrief() {
  return (
    <section id="sample" className="scroll-mt-20 bg-muted px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:gap-16">
        <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            What lands in your inbox.
          </h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            An excerpt from a real White 80 premarket brief, sent Friday, September 25, 2026. Trimmed for length;
            the full brief also covers the vibe check and watchlist signals.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Shown for illustration only. Not a recommendation to buy or sell any security.
          </p>
        </div>

        <article
          aria-label="Excerpt of the White 80 Daily Brief for Friday, September 25, 2026"
          className="flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <header className="flex flex-col gap-1 border-b border-border px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-foreground">White 80 &lt;brief@white80.io&gt;</span>
              <span className="text-muted-foreground">Fri, Sep 25, 2026</span>
            </div>
            <p className="text-sm text-muted-foreground">White 80 Daily Brief · Friday, September 25, 2026</p>
          </header>

          <div className="flex flex-col gap-8 p-6 md:p-8">
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Macro pulse</h3>
              <dl className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
                {MACRO.map((row) => (
                  <div key={row.name} className="flex flex-col gap-0.5 border-b border-border py-2.5">
                    <dt className="text-xs text-muted-foreground">{row.name}</dt>
                    <dd className="flex items-baseline gap-2 font-mono text-sm">
                      <span className="text-foreground">{row.value}</span>
                      <span className={changeColor(row.up)}>{row.change}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm leading-relaxed text-foreground text-pretty">
                S&amp;P futures rose about 0.4% overnight as bonds steadied after a brutal two-day selloff. The
                10-year slipped to 5.17%, partially retracing a 20+ bp surge to 19-year highs. Markets now price a
                64% chance of another 25 bp hike in October; core PCE on Sep 30 is the next landmine.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Top catalyst</h3>
                <p className="font-medium text-foreground">Iran–Hormuz diplomacy: phased deal exploratory</p>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  Only 10 vessels transited Hormuz Wednesday vs. a 17-ship average. Reports of progress sent Brent
                  below $105 briefly. XLE is the most exposed sector to a rapid de-escalation.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sector rotation
                </h3>
                <ul className="flex flex-col">
                  {SECTORS.map((row) => (
                    <li key={row.name} className="flex justify-between gap-4 border-b border-border py-1.5 text-sm">
                      <span className="text-foreground">{row.name}</span>
                      <span className={`font-mono ${changeColor(row.up)}`}>{row.change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-xl bg-muted p-5">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Verdict</h3>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                  Risk-on
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground text-pretty">
                Risk-on, but narrowly. Technology and semis are in control as MU pre-earnings momentum builds and
                META prints 52-week highs. Yields and crude are both easing off their worst levels of the week.
                Watch the Trump–Xi weekend meeting and Iran headlines as binary catalysts.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Names to watch <span className="normal-case tracking-normal">(3 of 10)</span>
              </h3>
              <ul className="flex flex-col">
                {PLAYS.map((play) => (
                  <li key={play.ticker} className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-medium text-foreground">{play.ticker}</span>
                      <span
                        className={`font-mono text-xs font-medium ${
                          play.call === "BUY" ? "text-positive" : "text-negative"
                        }`}
                      >
                        {play.call}
                      </span>
                      <span className="text-xs text-muted-foreground">{play.conviction}</span>
                      {play.risk && (
                        <span className="rounded-full border border-negative/30 px-2 py-0.5 text-xs text-negative">
                          {play.risk}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{play.catalyst}</p>
                  </li>
                ))}
              </ul>
            </div>

            <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Generated 8:47 AM ET · Prices from Polygon · Not financial advice. Trade your own plan.
            </p>
          </div>
        </article>
      </div>
    </section>
  )
}
