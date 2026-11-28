import { ResearchIntro, ResearchNext, ResearchShell } from "@/components/newsletter/public-research"
import { SampleBrief } from "@/components/newsletter/sample-brief"
import { SAMPLE_PATH } from "@/lib/growth"
import { publicMetadata } from "@/lib/public-metadata"

export const metadata = publicMetadata(
  SAMPLE_PATH,
  "Sample Premarket Brief · September 25, 2026 | White 80",
  "See what a White 80 premarket brief looks like. This historical excerpt covers macro, an overnight catalyst, sector rotation and watchlist risks.",
  "article",
)

export default function SamplePremarketBriefPage() {
  return (
    <ResearchShell>
      <ResearchIntro label="From the archive · September 25, 2026" title="Sample White 80 premarket brief">
        See how the desk organized the overnight moves, catalysts and risks on one trading morning. This excerpt
        is historical, not a current market view or trade recommendation.
      </ResearchIntro>
      <SampleBrief />
      <ResearchNext placement="sample" />
    </ResearchShell>
  )
}
