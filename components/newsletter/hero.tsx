import { DELIVERY } from "@/lib/newsletter"

export function Hero() {
  return (
    <section className="px-4 pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-8">
          <p className="font-mono text-xs tracking-[0.25em] text-primary">
            THE DAILY PREMARKET BRIEF
          </p>
          <h1 className="font-display text-6xl leading-[0.9] text-foreground text-balance sm:text-7xl md:text-8xl lg:text-9xl">
            INTELLIGENCE IS THE <span className="text-primary">POSITION</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            A premarket brief in your inbox before the bell — futures, overnight catalysts, the gappers that
            matter and the risk flags on each. Then a confirmation brief once the open settles. Walk into the
            open with the read.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#signup"
              className="bg-primary px-8 py-4 text-center font-mono text-sm tracking-wider text-primary-foreground transition-colors hover:bg-primary/85"
            >
              START 7-DAY FREE TRIAL
            </a>
            <p className="font-mono text-xs text-muted-foreground">$49/month after the trial. Cancel anytime.</p>
          </div>
        </div>

        <aside className="flex max-w-sm flex-col gap-5 border border-border bg-card p-6 lg:mb-2">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">THE CALL</span>
            <span className="font-display text-2xl tracking-wide text-primary">WHITE 80</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground text-pretty">
            In football, the audible is called at the line. The quarterback sees something the defense
            doesn&apos;t and changes the play before the snap.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            The brief is your look at the line before the market snaps at 9:30.
          </p>
          <dl className="flex flex-col gap-2 border-t border-border pt-4 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Premarket brief</dt>
              <dd className="text-foreground">{DELIVERY.premarket}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Confirmation brief</dt>
              <dd className="text-foreground">{DELIVERY.confirmation}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  )
}
