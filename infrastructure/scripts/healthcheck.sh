#!/usr/bin/env bash
# healthcheck.sh — Verify all services are running
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" &>/dev/null; then
    echo "  ✓ $name"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "==> BlockCoin Health Check — $(date)"
echo ""

echo "--- Services ---"
check "PM2 BlockCoin-api"    "pm2 show BlockCoin-api | grep -q 'online'"
check "PM2 BlockCoin-web"    "pm2 show BlockCoin-web | grep -q 'online'"
check "PM2 BlockCoin-worker" "pm2 show BlockCoin-worker | grep -q 'online'"

echo ""
echo "--- API ---"
check "API /health"          "curl -sf $API_URL/health | grep -q 'ok'"

echo ""
echo "--- Web ---"
check "Web reachable"        "curl -sf $WEB_URL | grep -q 'BlockCoin'"

echo ""
echo "--- Database ---"
check "PostgreSQL"           "pg_isready -h localhost -p 5432"

echo ""
echo "--- Redis ---"
check "Redis ping"           "redis-cli ping | grep -q 'PONG'"

echo ""
echo "==> Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
