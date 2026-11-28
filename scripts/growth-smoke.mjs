import assert from "node:assert/strict"
import { METHOD_PATH, PODCAST_PATH, RESEARCH_PATH, SAMPLE_PATH, SITE_ORIGIN } from "../lib/growth.ts"

const origin = new URL(process.argv[2] ?? "http://localhost:3000").origin
const publicPaths = ["/", RESEARCH_PATH, SAMPLE_PATH, METHOD_PATH, PODCAST_PATH]
const titles = new Set()

for (const path of publicPaths) {
  const response = await fetch(origin + path)
  assert.equal(response.status, 200, path)
  const html = await response.text()
  const head = html.split("</head>")[0]
  const title = head.match(/<title>([^<]+)<\/title>/)?.[1]
  const canonical = head.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
  assert.ok(title && canonical, path)
  assert.equal(new URL(canonical).href, new URL(path, SITE_ORIGIN).href, path)
  assert.match(head, /name="robots" content="index, follow"/)
  assert.doesNotMatch(head, /name="robots" content="[^"]*noindex/)
  assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i)
  assert.match(head, /property="og:title"/)
  assert.ok(html.includes("/#signup"), path)
  if (process.argv.includes("--expect-signup")) assert.ok(html.includes('id="research-email-address"'), path)
  titles.add(title)
}
assert.equal(titles.size, publicPaths.length)

const robots = await fetch(origin + "/robots.txt")
assert.equal(robots.status, 200)
assert.ok((await robots.text()).includes("Sitemap: " + SITE_ORIGIN + "/sitemap.xml"))

const sitemap = await fetch(origin + "/sitemap.xml")
assert.equal(sitemap.status, 200)
const urls = Array.from((await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1])
assert.deepEqual(urls.sort(), publicPaths.map((path) => new URL(path, SITE_ORIGIN).href).sort())

for (const path of ["/auth/login", "/subscribed", "/checkout/success"]) {
  const response = await fetch(origin + path, { redirect: "manual" })
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow", path)
  if (path !== "/auth/login") assert.equal(response.headers.get("referrer-policy"), "no-referrer", path)
}

const pricing = await fetch(origin + "/pricing", { redirect: "manual" })
assert.equal(pricing.status, 307)
const signup = new URL(pricing.headers.get("location"), origin)
assert.equal(signup.pathname + signup.hash, "/#signup")
console.log("Public pages, metadata, sitemap, excluded routes and pricing redirect passed.")
