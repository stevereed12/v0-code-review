// ─── PRE-MARKET ROUTINE ──────────────────────────────────────────────────────
// Runs at 8:00 AM ET, 30 minutes before the brief. Scans for overnight gaps /
// futures-implied moves / earnings reactions, writes the snapshot file the
// 8:30 AM brief reads as context, and emails a short pre-market alert.

import { runPremarketScan } from "@white80/engine"
import { sendPremarketEmail } from "./send-premarket-email"

export async function runPremarketRoutine(): Promise<void> {
  // runPremarketScan also writes /tmp/white80-premarket-snapshot.json.
  const snapshot = await runPremarketScan()
  console.log(
    `[premarket] Scan complete — SPY ${snapshot.spyPremarket.changePct.toFixed(2)}% QQQ ${snapshot.qqqPremarket.changePct.toFixed(2)}% gappers=${snapshot.overnightGappers.length} earnings=${snapshot.earningsReactions.length}`
  )

  try {
    const id = await sendPremarketEmail(snapshot)
    console.log(`[premarket] Emailed pre-market alert (id=${id}).`)
  } catch (err) {
    console.error("[premarket] Email failed:", err)
  }
}

// Allow `node dist/run-premarket.js` to run a single pre-market scan.
if (require.main === module) {
  runPremarketRoutine()
    .then(() => {
      console.log("[premarket] Done.")
      process.exit(0)
    })
    .catch((err) => {
      console.error("[premarket] FAILED:", err)
      process.exit(1)
    })
}
