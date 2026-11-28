export const SITE_ORIGIN = "https://www.white80.io"
export const RESEARCH_PATH = "/research"
export const PODCAST_PATH = "/the-tape-and-the-thesis"
export const SAMPLE_PATH = "/research/sample-premarket-brief"
export const METHOD_PATH = "/research/how-to-read-a-premarket-brief"

const SOURCES = ["x", "linkedin", "youtube", "spotify", "apple-podcasts", "podcast", "white80-email"]
const MEDIUMS = ["organic-social", "podcast", "email"]
const CAMPAIGNS = ["the-tape-and-the-thesis", "sample-premarket-brief", "how-to-read-a-premarket-brief"]
const PLACEMENTS = ["header", "hero", "pricing", "research", "sample", "method", "podcast"]

export type Campaign = {
  utm_source: string
  utm_medium?: string
  utm_campaign?: string
}

export function readCampaign(get: (key: string) => unknown): Campaign | null {
  const source = get("utm_source")
  if (typeof source !== "string" || !SOURCES.includes(source)) return null

  const medium = get("utm_medium")
  const campaign = get("utm_campaign")
  return {
    utm_source: source,
    ...(typeof medium === "string" && MEDIUMS.includes(medium) ? { utm_medium: medium } : {}),
    ...(typeof campaign === "string" && CAMPAIGNS.includes(campaign) ? { utm_campaign: campaign } : {}),
  }
}

export function readPlacement(value: unknown): string {
  return typeof value === "string" && PLACEMENTS.includes(value) ? value : "signup"
}

const DISTRIBUTION_PATHS = [SAMPLE_PATH, METHOD_PATH, PODCAST_PATH]

export function buildDistributionLinks(path: string) {
  if (!DISTRIBUTION_PATHS.includes(path)) throw new Error("Choose a published research or podcast companion path.")
  return [
    { source: "linkedin", medium: "organic-social" },
    { source: "x", medium: "organic-social" },
    { source: "youtube", medium: "organic-social" },
    { source: "podcast", medium: "podcast" },
    { source: "white80-email", medium: "email" },
  ].map(({ source, medium }) => {
    const url = new URL(path, SITE_ORIGIN)
    url.searchParams.set("utm_source", source)
    url.searchParams.set("utm_medium", medium)
    url.searchParams.set("utm_campaign", path.split("/").at(-1)!)
    return { source, url: url.toString() }
  })
}
