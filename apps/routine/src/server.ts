// ─── HTTP SERVER ─────────────────────────────────────────────────────────────
// Two endpoints:
//   GET  /health → { ok: true }                       (Railway healthcheck)
//   POST /run    → { status: "started" }              (fire-and-forget trigger)
//
// /run is protected by a Bearer token ($RUN_SECRET). It kicks the routine off in
// the background and returns immediately so the cron trigger (and Railway) never
// block on the multi-minute pipeline.

import express from "express"
import { runRoutine, runAlertScan, runPremarketRoutine } from "./index"
import { startScheduler } from "./scheduler"

const PORT = Number(process.env.PORT || 8080)
const RUN_SECRET = process.env.RUN_SECRET

const app = express()
app.use(express.json())

let running = false

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.post("/run", (req, res) => {
  // Auth: Bearer token must match RUN_SECRET.
  const auth = req.header("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!RUN_SECRET || token !== RUN_SECRET) {
    return res.status(401).json({ error: "unauthorized" })
  }

  if (running) {
    return res.status(409).json({ status: "already_running" })
  }

  // Fire-and-forget: respond immediately, run in the background.
  running = true
  res.json({ status: "started" })

  runRoutine()
    .then((r) => {
      console.log(`[server] Routine finished. PDF=${r.pdfPath} email=${r.emailId} layoutOk=${r.layoutOk}`)
    })
    .catch((err) => {
      console.error("[server] Routine failed:", err)
    })
    .finally(() => {
      running = false
    })
})

app.post("/run-alerts", async (req, res) => {
  // Auth: Bearer token must match RUN_SECRET.
  const auth = req.header("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!RUN_SECRET || token !== RUN_SECRET) {
    return res.status(401).json({ error: "unauthorized" })
  }

  try {
    const alertCount = await runAlertScan()
    res.json({ ok: true, alertCount })
  } catch (err) {
    console.error("[server] Alert scan failed:", err)
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
})

app.post("/run-premarket", async (req, res) => {
  // Auth: Bearer token must match RUN_SECRET.
  const auth = req.header("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!RUN_SECRET || token !== RUN_SECRET) {
    return res.status(401).json({ error: "unauthorized" })
  }

  try {
    await runPremarketRoutine()
    res.json({ ok: true })
  } catch (err) {
    console.error("[server] Pre-market scan failed:", err)
    res.status(500).json({ ok: false, error: (err as Error).message })
  }
})

app.listen(PORT, () => {
  console.log(`[server] White80 routine listening on :${PORT}`)
  if (!RUN_SECRET) {
    console.warn("[server] RUN_SECRET is not set — /run will reject all requests until it is.")
  }
  startScheduler()
  console.log("[server] Scheduler started.")
})
