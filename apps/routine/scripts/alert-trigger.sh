#!/usr/bin/env bash
# Fires the intraday alert scan by POSTing to /run-alerts with the Bearer secret.
# Used by the hourly Railway cron schedule during market hours.
set -euo pipefail

# Target the service itself. On Railway, the service reaches itself on $PORT.
BASE_URL="${ROUTINE_URL:-http://localhost:${PORT:-8080}}"

if [[ -z "${RUN_SECRET:-}" ]]; then
  echo "[alert-trigger] RUN_SECRET is not set; refusing to call /run-alerts." >&2
  exit 1
fi

echo "[alert-trigger] POST ${BASE_URL}/run-alerts"
curl -fsS -X POST "${BASE_URL}/run-alerts" \
  -H "Authorization: Bearer ${RUN_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
echo
echo "[alert-trigger] Triggered."
