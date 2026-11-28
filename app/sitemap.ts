import type { MetadataRoute } from "next"
import { METHOD_PATH, PODCAST_PATH, RESEARCH_PATH, SAMPLE_PATH, SITE_ORIGIN } from "@/lib/growth"

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", RESEARCH_PATH, SAMPLE_PATH, METHOD_PATH, PODCAST_PATH].map((path) => ({
    url: `${SITE_ORIGIN}${path}`,
  }))
}
