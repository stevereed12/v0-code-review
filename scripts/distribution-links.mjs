import { buildDistributionLinks, PODCAST_PATH } from "../lib/growth.ts"

try {
  const links = buildDistributionLinks(process.argv[2] ?? PODCAST_PATH)
  for (const { source, url } of links) console.log(`${source}\t${url}`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
