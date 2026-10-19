import { DELIVERY } from "@/lib/newsletter"

export function Hero() {
  return (
    <section className="px-4 pb-16 pt-14 md:pb-24 md:pt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-6">
          <p className="text-sm font-medium text-muted-foreground">The daily premarket brief</p>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance md:text-6xl">
            Intelligence is the{" "}
            <span className="bg-accent px-1.5 text-accent-foreground [box-decoration-break:clone]">position.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            A premarket brief in your inbox before the bell: futures and macro, overnight catalysts, sector
            rotation, and the names worth watching, each with the risk spelled out. Then a confirmation brief
            once the open settles.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <a
              href="#signup"
              className="rounded-full bg-primary px-7 py-3.5 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-85"
            >
              Start 7-day free trial
            </a>
            <p className="text-sm text-muted-foreground">$49/month after the trial. Cancel anytime.</p>
          </div>
        </div>

        <aside className="flex max-w-sm flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Every trading day</p>
          <p className="leading-relaxed text-foreground text-pretty">
            Walk into the open with the read already done.
          </p>
          <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Premarket brief</dt>
              <dd className="font-mono text-foreground">{DELIVERY.premarket}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Confirmation brief</dt>
              <dd className="font-mono text-foreground">{DELIVERY.confirmation}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}
