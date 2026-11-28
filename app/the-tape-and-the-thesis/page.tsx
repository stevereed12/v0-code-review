import Link from "next/link"
import { ResearchIntro, ResearchNext, ResearchShell } from "@/components/newsletter/public-research"
import { METHOD_PATH, PODCAST_PATH, SAMPLE_PATH } from "@/lib/growth"
import { publicMetadata } from "@/lib/public-metadata"

export const metadata = publicMetadata(
  PODCAST_PATH,
  "The Tape & The Thesis | White 80 Podcast Companion",
  "The research companion to White 80’s The Tape & The Thesis. Start with the premarket reading guide and an archived brief.",
)

export default function TapeAndThesisPage() {
  return (
    <ResearchShell>
      <ResearchIntro label="White 80 Podcast Companion" title="The Tape & The Thesis">
        The tape is what traded. The thesis is the explanation you can test. Use these companion reads to
        check the difference before the bell and revisit it after the open.
      </ResearchIntro>
      <section className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">Start with the research</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            Before listening or reading, note the move and the evidence for it separately. After the open, ask which
            observations supported the story and which would have made you change your mind.
          </p>
          <ul className="mt-5 grid gap-3">
            <li><Link href={METHOD_PATH} className="underline underline-offset-4">How to read a premarket brief</Link></li>
            <li><Link href={SAMPLE_PATH} className="underline underline-offset-4">Read an archived White 80 brief</Link></li>
          </ul>
        </div>
      </section>
      <ResearchNext placement="podcast" />
    </ResearchShell>
  )
}
