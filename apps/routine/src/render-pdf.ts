// ─── PDF RENDERING ───────────────────────────────────────────────────────────
// Renders the populated HTML to a 4-page A4 PDF via headless Chromium (Playwright).

import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp"

function dateStamp(): string {
  return new Date().toISOString().split("T")[0] // YYYY-MM-DD
}

/**
 * Render the given HTML string to a PDF on disk and return its path.
 * Output: $OUTPUT_DIR/white80-brief-YYYY-MM-DD.pdf
 */
export async function renderPDF(html: string): Promise<string> {
  const outPath = join(OUTPUT_DIR, `white80-brief-${dateStamp()}.pdf`)

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle" })
    // The template renders synchronously via inline script; give layout a beat to settle.
    await page.waitForTimeout(300)

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    })

    writeFileSync(outPath, pdf)
    return outPath
  } finally {
    await browser.close()
  }
}
