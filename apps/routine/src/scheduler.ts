import cron from "node-cron"
import { runRoutine, runAlertScan, runPremarketRoutine } from "./index"

/**
 * All times are ET (America/New_York). node-cron supports the timezone option.
 *
 * Schedule:
 * - 8:00 AM ET Mon-Fri: pre-market scan
 * - 8:30 AM ET Mon-Fri: full morning brief
 * - 9:30 AM–3:30 PM ET Mon-Fri (hourly): intraday alert scans
 */
export function startScheduler(): void {
  const tz = { timezone: "America/New_York" }

  // Pre-market scan — 8:00 AM ET
  cron.schedule(
    "0 8 * * 1-5",
    async () => {
      console.log("[scheduler] Pre-market scan starting…")
      try {
        await runPremarketRoutine()
        console.log("[scheduler] Pre-market scan complete.")
      } catch (err) {
        console.error("[scheduler] Pre-market scan failed:", err)
      }
    },
    tz,
  )

  // Morning brief — 8:30 AM ET
  cron.schedule(
    "30 8 * * 1-5",
    async () => {
      console.log("[scheduler] Morning brief starting…")
      try {
        await runRoutine()
        console.log("[scheduler] Morning brief complete.")
      } catch (err) {
        console.error("[scheduler] Morning brief failed:", err)
      }
    },
    tz,
  )

  // Intraday alerts — hourly 9:30 AM through 3:30 PM ET
  const alertTimes = [
    "30 9 * * 1-5",
    "30 10 * * 1-5",
    "30 11 * * 1-5",
    "30 12 * * 1-5",
    "30 13 * * 1-5",
    "30 14 * * 1-5",
    "30 15 * * 1-5",
  ]

  for (const schedule of alertTimes) {
    cron.schedule(
      schedule,
      async () => {
        console.log("[scheduler] Alert scan starting…")
        try {
          const count = await runAlertScan()
          console.log(`[scheduler] Alert scan complete — ${count} alert(s).`)
        } catch (err) {
          console.error("[scheduler] Alert scan failed:", err)
        }
      },
      tz,
    )
  }

  console.log("[scheduler] All schedules registered (timezone: America/New_York).")
}
