import { NEWSLETTER } from "@/lib/newsletter"

const INCLUDED = [
  "Premarket brief, every trading day",
  "Morning confirmation brief",
  "Risk flags on every gapper",
  "Delivered to your inbox",
]

export function PricingSection() {
  const price = NEWSLETTER.priceInCents / 100

  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border px-4 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-xl flex-col gap-3">
          <h2 className="font-display text-5xl text-foreground text-balance md:text-6xl">ONE PLAN. THE WHOLE READ.</h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            No tiers, no upsells. Try it for {NEWSLETTER.trialDays} days. If it doesn&apos;t earn a place in your
            morning, cancel before the trial ends and you won&apos;t be charged.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-6 border border-primary/40 bg-card p-8">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-7xl leading-none text-foreground">${price}</span>
            <span className="font-mono text-sm text-muted-foreground">/ month</span>
          </div>
          <p className="font-mono text-xs tracking-wider text-primary">
            {NEWSLETTER.trialDays}-DAY FREE TRIAL · CANCEL ANYTIME
          </p>
          <ul className="flex flex-col gap-3 border-t border-border pt-6">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#signup"
            className="bg-primary px-6 py-4 text-center font-mono text-sm tracking-wider text-primary-foreground transition-colors hover:bg-primary/85"
          >
            START 7-DAY FREE TRIAL
          </a>
        </div>
      </div>
    </section>
  )
}
