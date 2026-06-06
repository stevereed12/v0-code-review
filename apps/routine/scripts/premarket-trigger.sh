#!/usr/bin/env bash
# Fires the pre-market scan by POSTing to /run-premarket with the Bearer secret.
# Used by the 8:00 AM ET Railway cron, 30 minutes ahead of the morning brief.
set -euo pipefail

# Target the service itself. On Railway, the service reaches itself on $PORT.
BASE_URL="${ROUTINE_URL:-http://localhost:${PORT:-8080}}"

if [[ -z "${RUN_SECRET:-}" ]]; then
  echo "[premarket-trigger] RUN_SECRET is not set; refusing to call /run-premarket." >&2
  exit 1
fi

echo "[premarket-trigger] POST ${BASE_URL}/run-premarket"
curl -fsS -X POST "${BASE_URL}/run-premarket" \
  -H "Authorization: Bearer ${RUN_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
echo
echo "[premarket-trigger] Triggered."
