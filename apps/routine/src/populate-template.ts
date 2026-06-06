// ─── TEMPLATE POPULATION ─────────────────────────────────────────────────────
// Injects the assembled BriefOutput JSON into the HTML template by replacing the
// single __BRIEF_DATA__ placeholder. The template renders the data client-side
// (in the headless browser) into the four printed pages.

import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { BriefOutput } from "@white80/engine"

const TEMPLATE_PATH = join(__dirname, "..", "templates", "brief-template.html")
const PLACEHOLDER = "__BRIEF_DATA__"

/**
 * Read the locked HTML template and substitute the brief JSON.
 * The JSON is escaped so it can't break out of the <script> tag.
 */
export function populateTemplate(output: BriefOutput): string {
  const template = readFileSync(TEMPLATE_PATH, "utf8")
  // Escape </script and HTML-significant chars so the JSON stays inside the script tag.
  const json = JSON.stringify(output)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
  return template.replace(PLACEHOLDER, json)
}
