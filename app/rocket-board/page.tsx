import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Radio } from "lucide-react"
import { BoardMethodology, RocketRows } from "@/components/rocket-board/board"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRocketEdition, rocketLiveEnabled } from "@/lib/morning-edition-data"
import { publicBoard, sampleBoard } from "@/lib/rocket-board"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Rocket Board | White80 Premarket Watchlist",
  description: "The five most active setups on White80’s premarket watchlist, with transparent score breakdowns and both sides of the case.",
  alternates: { canonical: "https://www.white80.io/rocket-board" },
}

export default async function RocketBoardPage() {
  let board = sampleBoard
  if (rocketLiveEnabled()) {
    try {
      const edition = await getRocketEdition(createAdminClient())
      if (edition) board = publicBoard(edition)
    } catch {
      // No valid edition available. Do not serve an unlabeled stale or fake edition.
      console.warn("Public Rocket Board edition temporarily unavailable")
    }
  }

  return <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
    <nav className="flex items-center justify-between border-b border-border pb-4 text-sm">
      <Link href="/" className="font-semibold tracking-wide">WHITE<span className="text-primary">80</span></Link>
      <Link href="/dashboard/rocket-board" className="text-foreground/75 hover:text-primary">Member board <span aria-hidden>↗</span></Link>
    </nav>
    <header className="space-y-4 py-9 sm:py-12">
      <p className="flex w-fit items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-primary">
        <Radio aria-hidden className="size-3.5" />
        {board.status === "sample" ? "Illustrative preview" : `Published edition · ${board.sessionDate}`}
      </p>
      <div className="space-y-2">
        <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">Rocket Board<span className="text-primary">.</span></h1>
        <p className="max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
          See what’s moving before the bell, why it ranked and what could send it the other way.
        </p>
      </div>
      {board.status === "sample" && <p className="text-sm text-foreground/75">Fictional tickers and simulated scores. No current market signals are shown.</p>}
    </header>
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">The top five</h2>
        <p className="font-mono text-xs text-foreground/65">PREMARKET ACTIVITY / 100</p>
      </div>
      <RocketRows rockets={board.rockets} />
      <BoardMethodology name={board.methodology} />
    </section>
    <aside className="mt-9 flex flex-col justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">Go deeper with White80 Pro</h2>
        <p className="mt-1 text-sm leading-relaxed text-foreground/75">Get the full board, quote timestamps, supporting sources and recent ranks.</p>
      </div>
      <Link href="/pricing" className="flex w-fit shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
        View membership <ArrowUpRight aria-hidden className="size-4" />
      </Link>
    </aside>
  </main>
}
