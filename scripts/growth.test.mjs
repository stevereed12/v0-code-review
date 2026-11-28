import assert from "node:assert/strict"
import { test } from "node:test"
import { buildDistributionLinks, readCampaign, readPlacement, SAMPLE_PATH, SITE_ORIGIN } from "../lib/growth.ts"
import { joinResearchList } from "../app/actions/research-signup.ts"

test("distribution URLs round-trip into supported attribution", () => {
  for (const { source, url } of buildDistributionLinks(SAMPLE_PATH)) {
    const link = new URL(url)
    assert.equal(link.origin, SITE_ORIGIN)
    assert.equal(link.pathname, SAMPLE_PATH)
    assert.equal(readCampaign((key) => link.searchParams.get(key)).utm_source, source)
  }
  assert.throws(() => buildDistributionLinks("https://other.example/private"))
})

test("unrecognized campaign fields and placements are not passed through", () => {
  const values = new URLSearchParams("utm_source=linkedin&utm_medium=person%40example.net&utm_campaign=arbitrary")
  assert.deepEqual(readCampaign((key) => values.get(key)), { utm_source: "linkedin" })
  assert.equal(readCampaign(() => "person@example.net"), null)
  assert.equal(readPlacement("podcast"), "podcast")
  assert.equal(readPlacement("person@example.net"), "signup")
})

test("free signup handles validation, provider enrollment, opt-out and unavailable states", async (context) => {
  const key = "RESEND_RESEARCH_API_KEY"
  const segment = "RESEND_RESEARCH_SEGMENT_ID"
  const originalEnv = { [key]: process.env[key], [segment]: process.env[segment] }
  context.after(() => {
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  })

  const calls = []
  let contact = null
  let outcome = 200
  context.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname
    calls.push([options.method, path, options.body ? JSON.parse(options.body) : null])
    if (options.method === "GET") {
      return contact === null
        ? Response.json({ name: "not_found", statusCode: 404 }, { status: 404 })
        : Response.json(contact)
    }
    return outcome === 200
      ? Response.json({ id: "contact-test" })
      : Response.json({ name: "application_error", statusCode: outcome }, { status: outcome })
  })
  const submit = (address, honeypot = "") => {
    const form = new FormData()
    form.set("email", address)
    form.set("company", honeypot)
    return joinResearchList("idle", form)
  }

  delete process.env[key]
  delete process.env[segment]
  assert.equal(await submit("person@example.net"), "unavailable")
  process.env[key] = "re_test"
  process.env[segment] = "segment-test"
  assert.equal(await submit("invalid"), "invalid")
  assert.equal(await submit("person@example.net", "bot"), "received")
  assert.equal(calls.length, 0)

  assert.equal(await submit(" Person+Brief@Example.net "), "saved")
  assert.deepEqual(calls, [
    ["GET", "/contacts/person%2Bbrief%40example.net", null],
    ["POST", "/contacts", { email: "person+brief@example.net", segments: [{ id: "segment-test" }] }],
  ])

  calls.length = 0
  contact = { id: "existing-contact", unsubscribed: true }
  assert.equal(await submit("person@example.net"), "received")
  assert.equal(calls.length, 1)

  calls.length = 0
  contact = { id: "existing-contact", unsubscribed: false }
  assert.equal(await submit("person@example.net"), "saved")
  assert.deepEqual(calls.at(-1), ["POST", "/contacts/existing-contact/segments/segment-test", null])

  outcome = 409
  assert.equal(await submit("person@example.net"), "received")
  outcome = 503
  assert.equal(await submit("person@example.net"), "unavailable")
})
