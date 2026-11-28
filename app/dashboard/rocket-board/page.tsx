import type { Metadata } from "next"
import Link from "next/link"
import { BoardMethodology, RocketRows } from "@/components/rocket-board/board"
import { getRocketEdition, getRocketHistory, requireMorningMembership, rocketLiveEnabled } from "@/lib/morning-edition-data"
import { memberBoard, parseDirection, parseSession, sampleBoard, type BoardDirection } from "@/lib/rocket-board"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Rocket Board Pro | White80",
  robots: { index: false, follow: false },
}
const filters: { value: BoardDirection; label: string }[] = [
  { value: "all", label: "All ranks" }, { value: "up", label: "Ahead of SPY" }, { value: "down", label: "Behind SPY" },
]

export default async function RocketBoardMemberPage({ searchParams }: {
  searchParams: Promise<{ date?: string | string[]; direction?: string | string[] }>
}) {
  const admin = await requireMorningMembership("/dashboard/rocket-board")
  const params = await searchParams
  const date = parseSession(params.date)
  const direction = parseDirection(params.direction)
  let board: ReturnType<typeof memberBoard> | null = null
  let status = rocketLiveEnabled() ? "" : "The published board hasn’t launched yet. Here’s a sample."
  if (!status) {
    try {
      const edition = params.date === undefined || date ? await getRocketEdition(admin, date ?? undefined) : null
      if (edition) {
        const history = await getRocketHistory(admin, edition.sessionDate).catch(() => [])
        board = memberBoard(edition, history, direction)
      } else status = params.date === undefined ? "No session has been published yet." : "No board was published for that session."
    } catch {
      status = "The saved board is temporarily unavailable."
    }
  }
  const sample = !rocketLiveEnabled()
  const rows = board?.rockets ?? (sample ? sampleBoard.rockets.filter((r) => direction === "all" || r.direction === direction) : [])
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-9 sm:px-8 sm:py-12">
    <nav className="flex flex-wrap justify-between gap-3 text-sm">
      <Link href={date ? `/dashboard/morning-edition?date=${date}` : "/dashboard/morning-edition"} className="text-foreground/75 hover:text-primary">← The Daily</Link>
      <Link href="/rocket-board" className="text-foreground/75 hover:text-primary">Public board ↗</Link>
    </nav>
    <header className="space-y-3 border-b border-border pb-5">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">WHITE80 PRO · PREMARKET DESK</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Rocket Board</h1>
      {board ? <p className="text-sm text-foreground/70">Published edition <time dateTime={board.sessionDate}>{board.sessionDate}</time> · Saved snapshot</p> :
        <p className="text-sm text-foreground/70">{status}</p>}
      {date && <Link href="/dashboard/rocket-board" className="text-sm text-primary underline underline-offset-4">View latest edition</Link>}
    </header>
    {(board || sample) && <>
      <nav aria-label="Filter ranks by relative performance" className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => {
          const args = new URLSearchParams()
          if (date) args.set("date", date)
          if (value !== "all") args.set("direction", value)
          const query = args.toString()
          return <Link key={value} href={`/dashboard/rocket-board${query ? "?" + query : ""}`}
            aria-current={direction === value ? "page" : undefined}
            className={`rounded-md border px-3 py-2 text-sm ${direction === value ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-foreground/75"}`}>{label}</Link>
        })}
      </nav>
      {sample && <p className="text-sm text-foreground/70">Fictional names and simulated scores. No quotes, sources or score history are shown.</p>}
      <RocketRows rockets={rows} />
      <BoardMethodology name={board?.methodology ?? sampleBoard.methodology} />
    </>}
  </main>
}
