import Link from "next/link"
import { ResearchIntro, ResearchNext, ResearchShell } from "@/components/newsletter/public-research"
import { METHOD_PATH, PODCAST_PATH, RESEARCH_PATH, SAMPLE_PATH } from "@/lib/growth"
import { publicMetadata } from "@/lib/public-metadata"

export const metadata = publicMetadata(
  RESEARCH_PATH,
  "Premarket Research & Daily Brief Samples | White 80",
  "Read a White 80 premarket brief sample, learn how the desk reads catalysts and risk, and explore The Tape & The Thesis.",
)

const READS = [
  {
    href: SAMPLE_PATH,
    label: "Historical sample · September 25, 2026",
    title: "Inside a White 80 premarket brief",
    description: "Read the macro pulse, top catalyst, sector rotation and a sample of the watchlist from one archived morning.",
  },
  {
    href: METHOD_PATH,
    label: "Research guide",
    title: "How to read a premarket brief",
    description: "Separate a price move from its catalyst, then spell out what would change your read after the open.",
  },
  {
    href: PODCAST_PATH,
    label: "Podcast companion",
    title: "The Tape & The Thesis",
    description: "Read the companion notes and follow the evidence behind a market thesis.",
  },
]

export default function ResearchPage() {
  return (
    <ResearchShell>
      <ResearchIntro label="White 80 Research" title="Read the work behind the brief.">
        Public samples and guides on what moved, why it matters, and what would change the read.
      </ResearchIntro>
      <ul className="mx-auto grid max-w-6xl gap-5 px-4 md:grid-cols-3">
        {READS.map((read) => (
          <li key={read.href} className="rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-xs text-muted-foreground">{read.label}</p>
            <h2 className="mt-3 text-xl font-semibold">
              <Link href={read.href} className="underline decoration-border underline-offset-4 hover:decoration-current">{read.title}</Link>
            </h2>
            <p className="mt-3 text-muted-foreground">{read.description}</p>
          </li>
        ))}
      </ul>
      <ResearchNext placement="research" />
    </ResearchShell>
  )
}
