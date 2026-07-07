import { TrendingUp, TrendingDown, Target, ShieldAlert } from "lucide-react"

/**
 * SAMPLE THESIS SHOWCASE
 * ----------------------
 * This is a REPRESENTATIVE, ILLUSTRATIVE example of the format White 80 produces.
 * It is clearly labeled as a sample and is NOT a real trade recommendation.
 *
 * TO SWAP IN REAL OUTPUT: replace the `SAMPLE` object below with an actual thesis
 * your tool generated. Keep the "SAMPLE OUTPUT" label unless the content is a real,
 * dated call you are comfortable publishing.
 */
const SAMPLE = {
  ticker: "NVDA",
  price: "$174.20",
  bias: "BULLISH",
  bull: [
    "Data-center revenue re-accelerating on next-gen GPU demand",
    "Reclaimed the 50-day moving average with expanding volume",
    "Call skew building into the next earnings catalyst",
  ],
  bear: [
    "Extended above the 20-day; short-term overbought on RSI",
    "Macro/rate headlines can compress high-multiple names fast",
  ],
  levels: {
    support: "$168.50",
    resistance: "$182.00",
  },
  options: "Mar 21 $180C — defined-risk directional structure, IV-aware sizing",
}

export function ThesisShowcase() {
  return (
    <section className="py-20 px-4 border-t border-[#262620]">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl text-[#f4f0e6] mb-2">SEE IT WORK</h2>
        <p className="font-mono text-xs tracking-[0.2em] text-[#6e6a5e] mb-12 max-w-2xl">
          EVERY THESIS, THE SAME DEPTH — BULL CASE, BEAR CASE, LEVELS, AND STRUCTURE.
        </p>

        <div className="bg-[#141411] border border-[#262620]">
          {/* Terminal-style header */}
          <div className="flex items-center justify-between border-b border-[#262620] px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-[#c8ff00] animate-pulse" />
              <span className="font-display text-2xl tracking-wide text-[#f4f0e6]">{SAMPLE.ticker}</span>
              <span className="font-mono text-sm text-[#6e6a5e]">{SAMPLE.price}</span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#c8ff00] border border-[#c8ff00]/30 px-2 py-1">
              {SAMPLE.bias}
            </span>
          </div>

          <div className="p-5 grid md:grid-cols-2 gap-5">
            {/* Bull */}
            <div className="bg-[#0a0a0a] border border-[#262620] p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#c8ff00]" aria-hidden="true" />
                <h3 className="font-mono text-[#c8ff00] text-xs tracking-[0.2em]">BULL CASE</h3>
              </div>
              <ul className="text-sm text-[#f4f0e6] space-y-2">
                {SAMPLE.bull.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c8ff00] mt-1.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bear */}
            <div className="bg-[#0a0a0a] border border-[#262620] p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-[#f87171]" aria-hidden="true" />
                <h3 className="font-mono text-[#f87171] text-xs tracking-[0.2em]">BEAR CASE</h3>
              </div>
              <ul className="text-sm text-[#f4f0e6] space-y-2">
                {SAMPLE.bear.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-[#f87171] mt-1.5 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Levels */}
            <div className="bg-[#0a0a0a] border border-[#262620] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-[#facc15]" aria-hidden="true" />
                <h3 className="font-mono text-[#facc15] text-xs tracking-[0.2em]">KEY LEVELS</h3>
              </div>
              <div className="flex items-center justify-between font-mono text-sm">
                <div>
                  <p className="text-[#6e6a5e] text-[11px] tracking-wider mb-1">SUPPORT</p>
                  <p className="text-[#f4f0e6]">{SAMPLE.levels.support}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#6e6a5e] text-[11px] tracking-wider mb-1">RESISTANCE</p>
                  <p className="text-[#f4f0e6]">{SAMPLE.levels.resistance}</p>
                </div>
              </div>
            </div>

            {/* Options structure */}
            <div className="bg-[#0a0a0a] border border-[#262620] p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-[#fb923c]" aria-hidden="true" />
                <h3 className="font-mono text-[#fb923c] text-xs tracking-[0.2em]">OPTIONS STRUCTURE</h3>
              </div>
              <p className="text-sm text-[#f4f0e6] leading-relaxed">{SAMPLE.options}</p>
            </div>
          </div>

          {/* Honest label */}
          <div className="border-t border-[#262620] px-5 py-3">
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#6e6a5e]">
              SAMPLE OUTPUT — ILLUSTRATIVE FORMAT ONLY. NOT A TRADE RECOMMENDATION OR FINANCIAL ADVICE.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
