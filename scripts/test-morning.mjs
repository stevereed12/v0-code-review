import { mkdtempSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const dir = mkdtempSync(join(root, ".white80-test-"))
const tsc = join(root, "node_modules", "typescript", "bin", "tsc")
try {
  for (const args of [
    [tsc, "--project", "tests/morning-tsconfig.json", "--outDir", dir],
    ["--test", join(dir, "tests", "morning-ingest.test.js"), join(dir, "tests", "rocket-board.test.js")],
  ]) {
    const r = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" })
    if (r.status !== 0) { process.exitCode = r.status ?? 1; break }
  }
} finally {
  rmSync(dir, { force: true, recursive: true })
}
