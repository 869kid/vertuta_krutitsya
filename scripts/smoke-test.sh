#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$COMPOSE_DIR"

# ── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
FAIL=0
TOTAL=0

pass() { printf "${GREEN}  ✔ %s${NC}\n" "$*"; PASS=$((PASS + 1)); TOTAL=$((TOTAL + 1)); }
fail() { printf "${RED}  ✘ %s${NC}\n" "$*"; FAIL=$((FAIL + 1)); TOTAL=$((TOTAL + 1)); }
info() { printf "${YELLOW}── %s ──${NC}\n" "$*"; }

# ── Containers running ─────────────────────────────────────────────
info "Containers"

check_container() {
  local svc="$1"
  local state
  state=$(docker compose ps --format '{{.State}}' "$svc" 2>/dev/null || echo "missing")
  if [ "$state" = "running" ]; then
    pass "$svc is running"
  else
    fail "$svc is not running (state: $state)"
  fi
}

check_container db
check_container server
check_container frontend

# ── Frontend (HTTP 200 + HTML) ─────────────────────────────────────
info "Frontend"

FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_HTTP" = "200" ]; then
  FRONTEND_BODY=$(curl -s --max-time 5 http://localhost:3000 2>/dev/null || echo "")
  if echo "$FRONTEND_BODY" | grep -qi "</html>"; then
    pass "Frontend returns 200 with HTML"
  else
    fail "Frontend returns 200 but body is not HTML"
  fi
else
  fail "Frontend returned HTTP $FRONTEND_HTTP (expected 200)"
fi

# ── API Health ─────────────────────────────────────────────────────
info "API"

HEALTH_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:8080/health 2>/dev/null || echo "000")
if [ "$HEALTH_HTTP" = "200" ]; then
  pass "API /health returns 200"
else
  fail "API /health returned HTTP $HEALTH_HTTP (expected 200)"
fi

# ── Nginx → API proxy ──────────────────────────────────────────────
info "Nginx proxy"

PROXY_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/ 2>/dev/null || echo "000")
if [ "$PROXY_HTTP" != "502" ] && [ "$PROXY_HTTP" != "503" ] && [ "$PROXY_HTTP" != "000" ]; then
  pass "Nginx proxies /api/ → API (HTTP $PROXY_HTTP)"
else
  fail "Nginx /api/ proxy returned HTTP $PROXY_HTTP (bad gateway or unreachable)"
fi

# ── WebSocket (SignalR hub) ────────────────────────────────────────
info "WebSocket"

WS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  http://localhost:3000/hubs/wheel 2>/dev/null || echo "000")

if [ "$WS_HTTP" = "101" ]; then
  pass "WebSocket upgrade to /hubs/wheel succeeded (101)"
elif [ "$WS_HTTP" != "502" ] && [ "$WS_HTTP" != "503" ] && [ "$WS_HTTP" != "000" ]; then
  pass "WebSocket endpoint /hubs/wheel reachable (HTTP $WS_HTTP — not a gateway error)"
else
  fail "WebSocket /hubs/wheel returned HTTP $WS_HTTP"
fi

# ── Database ───────────────────────────────────────────────────────
info "Database"

if docker compose exec -T db pg_isready -U vertuta &>/dev/null; then
  pass "PostgreSQL is ready (pg_isready)"
else
  fail "PostgreSQL is not ready"
fi

# ── Summary ────────────────────────────────────────────────────────
echo ""
printf "${BOLD}Results: ${GREEN}${PASS} passed${NC}"
if [ $FAIL -gt 0 ]; then
  printf ", ${RED}${FAIL} failed${NC}"
fi
printf " ${BOLD}/ ${TOTAL} total${NC}\n"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
exit 0
