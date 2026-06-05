#!/usr/bin/env bash
# Fires the routine by POSTing to /run with the Bearer secret.
# Used by the Railway cron schedule. The endpoint is fire-and-forget, so this
# returns as soon as the routine has been kicked off.
set -euo pipefail

# Target the service itself. On Railway, the service reaches itself on $PORT.
BASE_URL="${ROUTINE_URL:-http://localhost:${PORT:-8080}}"

if [[ -z "${RUN_SECRET:-}" ]]; then
  echo "[cron-trigger] RUN_SECRET is not set; refusing to call /run." >&2
  exit 1
fi

echo "[cron-trigger] POST ${BASE_URL}/run"
curl -fsS -X POST "${BASE_URL}/run" \
  -H "Authorization: Bearer ${RUN_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}'
echo
echo "[cron-trigger] Triggered."
