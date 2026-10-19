import { NEWSLETTER } from "@/lib/newsletter"

const INCLUDED = [
  "Premarket brief, every trading day",
  "Morning confirmation brief",
  "Risk spelled out on every name",
  "Delivered to your inbox",
]

export function PricingSection() {
  const price = NEWSLETTER.priceInCents / 100

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance md:text-4xl">
            One plan. The whole read.
          </h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            No tiers, no upsells. Try it for {NEWSLETTER.trialDays} days. If it doesn&apos;t earn a place in your
            morning, cancel before the trial ends and you won&apos;t be charged.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tracking-tight text-foreground">${price}</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {NEWSLETTER.trialDays}-day free trial · Cancel anytime
            </p>
          </div>
          <ul className="flex flex-col gap-3 border-t border-border pt-6">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#signup"
            className="rounded-full bg-primary px-6 py-3.5 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
          >
            Start 7-day free trial
          </a>
        </div>
      </div>
    </section>
  )
}
