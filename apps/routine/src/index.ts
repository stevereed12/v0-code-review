// ─── ROUTINE ORCHESTRATION ───────────────────────────────────────────────────
// The end-to-end morning job: run the full pipeline → validate completeness →
// inject into the HTML template → render PDF → verify layout → email the brief.
//
// Exposed as runRoutine() so both the HTTP server (POST /run) and the
// `run-once` script can invoke it.

import type { BriefOutput, PipelineOptions } from "@white80/engine"
import { runPipeline } from "@white80/engine"
import { completenessCheck } from "./completeness"
import { populateTemplate } from "./populate-template"
import { renderPDF } from "./render-pdf"
import { verifyLayout } from "./verify-layout"
import { sendEmail } from "./send-email"
import { generateXPost } from "./generate-x-post"

export interface RoutineResult {
  output: BriefOutput
  pdfPath: string
  xPost: string
  emailId: string
  layoutOk: boolean
}

/**
 * Run the full automated routine. Throws if the pipeline fails, completeness
 * fails, or the email can't be sent. Layout warnings do not abort delivery.
 */
export async function runRoutine(options: PipelineOptions = {}): Promise<RoutineResult> {
  const startedAt = Date.now()
  console.log("[routine] Starting full pipeline…")

  // 1. Run all seven agents.
  const output = await runPipeline(options)
  console.log(
    `[routine] Pipeline complete — tier1=${output.tier1.length} signals=${output.signals.length} scout=${output.scout.length}`
  )

  // 2. Gate: completeness (throws on failure).
  completenessCheck(output)
  console.log("[routine] Completeness check passed.")

  // 3. Inject into the locked HTML template.
  const html = populateTemplate(output)

  // 4. Render the 4-page PDF.
  const pdfPath = await renderPDF(html)
  console.log(`[routine] Rendered PDF → ${pdfPath}`)

  // 5. Verify layout (warn only).
  const layout = await verifyLayout(pdfPath)

  // 6. X post draft.
  const xPost = generateXPost(output)

  // 7. Email everything.
  const emailId = await sendEmail({ output, pdfPath, xPost })
  console.log(`[routine] Email sent (id=${emailId}).`)

  console.log(`[routine] Done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`)
  return { output, pdfPath, xPost, emailId, layoutOk: layout.ok }
}

// Allow `node dist/index.js` to run the routine once (used by the run-once script).
if (require.main === module) {
  runRoutine()
    .then((r) => {
      console.log(`[routine] Success. PDF: ${r.pdfPath}, email: ${r.emailId}`)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[routine] FAILED:", err)
      process.exit(1)
    })
}
