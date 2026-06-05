// ─── LAYOUT VERIFICATION ─────────────────────────────────────────────────────
// Sanity-checks the rendered PDF: expects 4 pages and a file size > 50 KB.
// Logs warnings but never throws — a layout quirk should not block delivery.

import { statSync, readFileSync } from "node:fs"
import { PDFDocument } from "pdf-lib"

const EXPECTED_PAGES = 4
const MIN_BYTES = 50 * 1024 // 50 KB

export interface LayoutReport {
  path: string
  pages: number
  bytes: number
  ok: boolean
  warnings: string[]
}

/** Verify the PDF at `pdfPath`. Returns a report; logs warnings; does NOT throw. */
export async function verifyLayout(pdfPath: string): Promise<LayoutReport> {
  const warnings: string[] = []
  let pages = 0
  let bytes = 0

  try {
    bytes = statSync(pdfPath).size
    if (bytes < MIN_BYTES) {
      warnings.push(`PDF is only ${(bytes / 1024).toFixed(1)} KB (expected > 50 KB) — may be empty or under-rendered.`)
    }

    const doc = await PDFDocument.load(readFileSync(pdfPath))
    pages = doc.getPageCount()
    if (pages !== EXPECTED_PAGES) {
      warnings.push(`PDF has ${pages} pages (expected ${EXPECTED_PAGES}) — layout may have shifted.`)
    }
  } catch (err) {
    warnings.push(`Could not inspect PDF: ${(err as Error).message}`)
  }

  const ok = warnings.length === 0
  for (const w of warnings) console.warn(`[verify-layout] ${w}`)
  if (ok) console.log(`[verify-layout] OK — ${pages} pages, ${(bytes / 1024).toFixed(1)} KB`)

  return { path: pdfPath, pages, bytes, ok, warnings }
}
