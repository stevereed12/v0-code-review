import { DELIVERY, NEWSLETTER } from "@/lib/newsletter"

const QUESTIONS = [
  {
    q: "When do the briefs arrive?",
    a: `Every trading day. The premarket brief lands by ${DELIVERY.premarket} and the confirmation brief by ${DELIVERY.confirmation}. No briefs on weekends or market holidays.`,
  },
  {
    q: "How are they delivered?",
    a: "By email, to the address you sign up with. Nothing to install and no accounts to connect.",
  },
  {
    q: "Can I cancel?",
    a: `Yes, anytime. Cancel during the ${NEWSLETTER.trialDays}-day trial and you won't be charged. Cancel after and you keep access through the end of your billing period.`,
  },
  {
    q: "What happens after the free trial?",
    a: "Your subscription continues at $49/month on the card you added at checkout, unless you cancel first.",
  },
  {
    q: "Is this financial advice?",
    a: "No. White 80 is a market research newsletter for informational purposes only. It is not personalized investment advice and nothing in it is a recommendation to buy or sell any security. Trading involves risk, including loss of principal. Make your own decisions.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border px-4 py-20 md:py-28">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:gap-20">
        <h2 className="font-display text-5xl text-foreground md:text-6xl lg:w-72 lg:shrink-0">QUESTIONS</h2>
        <div className="flex flex-1 flex-col border-t border-border">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-foreground [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{item.q}</span>
                <span
                  className="font-mono text-lg text-primary transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
