#!/usr/bin/env bash
# Live verification: polls the deployed Render services until the backend
# health check and the frontend both respond, or gives up. Called from the
# Jenkinsfile's final stage; exits non-zero (failing the build) if the app
# never comes up - e.g. Render is still mid-build after terraform apply
# creates/updates the services (a first deploy can take a few minutes).
set -euo pipefail

: "${BACKEND_URL:?set BACKEND_URL (terraform output backend_url)}"
: "${FRONTEND_URL:?set FRONTEND_URL (terraform output frontend_url)}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_SECONDS="${SLEEP_SECONDS:-10}"

check() {
  local url="$1"
  curl -fsS --max-time 10 "$url" > /dev/null
}

echo "==> Verifying deployment: backend=${BACKEND_URL} frontend=${FRONTEND_URL}"
for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  if check "${BACKEND_URL}/health" && check "${FRONTEND_URL}/"; then
    echo "==> Backend /health and frontend / both responded (attempt ${attempt}/${MAX_ATTEMPTS})"
    curl -fsS "${BACKEND_URL}/health"
    echo
    echo "==> Live at ${FRONTEND_URL}"
    exit 0
  fi
  echo "==> Not up yet (attempt ${attempt}/${MAX_ATTEMPTS}, Render may still be building), retrying in ${SLEEP_SECONDS}s..."
  sleep "${SLEEP_SECONDS}"
done

echo "==> App did not come up after $((MAX_ATTEMPTS * SLEEP_SECONDS))s - failing the build" >&2
exit 1
