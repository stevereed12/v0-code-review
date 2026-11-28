import Link from "next/link"
import { ResearchIntro, ResearchNext, ResearchShell } from "@/components/newsletter/public-research"
import { METHOD_PATH, SAMPLE_PATH } from "@/lib/growth"
import { publicMetadata } from "@/lib/public-metadata"

export const metadata = publicMetadata(
  METHOD_PATH,
  "How to Read a Premarket Brief | White 80 Research",
  "A four-step guide to reading an equity premarket brief, from futures and overnight catalysts to liquidity, risk and confirmation after the open.",
  "article",
)

const STEPS = [
  {
    title: "Start with the market, then check what is leading.",
    body: "Read index futures alongside rates, the dollar and sector moves. A rising index can mask narrow leadership. Write down whether a stock is moving with its sector or on news specific to the company.",
  },
  {
    title: "Separate the price move from the explanation.",
    body: "A gap tells you a stock moved, not why. Look for a timestamped earnings release, filing, company announcement or other identifiable catalyst. If you cannot verify one, label the cause unknown instead of backfilling a story.",
  },
  {
    title: "Write down the risk before the bell.",
    body: "Premarket liquidity can be thin. Check whether the quoted spread, trading volume or a scheduled release makes the initial read unreliable. Name the observation that would invalidate it before you see the next price move.",
  },
  {
    title: "Use the open to check the thesis.",
    body: "Compare the early session with your premarket notes. Did the move hold when participation widened? Did sector leadership change? Record what confirmed the original read, what contradicted it, and what you still do not know.",
  },
]

export default function PremarketGuidePage() {
  return (
    <ResearchShell>
      <ResearchIntro label="White 80 Research Guide" title="How to read a premarket brief">
        The goal is to arrive at the open with a view you can test, not a list of tickers you feel obliged to trade.
      </ResearchIntro>
      <ol className="mx-auto grid max-w-6xl gap-5 px-4 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-6 max-w-6xl px-4">
        <Link href={SAMPLE_PATH} className="underline underline-offset-4">See the format in an archived White 80 brief</Link>
      </p>
      <ResearchNext placement="method" />
    </ResearchShell>
  )
}
