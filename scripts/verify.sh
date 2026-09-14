#!/usr/bin/env bash
# Live verification: polls the deployed app until the backend health check
# and the frontend both respond, or gives up. Called from the Jenkinsfile's
# final stage; exits non-zero (failing the build) if the app never comes up.
set -euo pipefail

: "${EC2_HOST:?set EC2_HOST to the instance's public IP}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-20}"
SLEEP_SECONDS="${SLEEP_SECONDS:-5}"

check() {
  local url="$1"
  curl -fsS --max-time 5 "$url" > /dev/null
}

echo "==> Verifying deployment at http://${EC2_HOST}"
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  if check "http://${EC2_HOST}:8000/health" && check "http://${EC2_HOST}/"; then
    echo "==> Backend /health and frontend / both responded (attempt ${attempt}/${MAX_ATTEMPTS})"
    curl -fsS "http://${EC2_HOST}:8000/health"
    echo
    echo "==> Live at http://${EC2_HOST}"
    exit 0
  fi
  echo "==> Not up yet (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${SLEEP_SECONDS}s..."
  sleep "${SLEEP_SECONDS}"
done

echo "==> App did not come up after $((MAX_ATTEMPTS * SLEEP_SECONDS))s - failing the build" >&2
exit 1
