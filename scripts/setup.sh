#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$COMPOSE_DIR"

# ── Colors ──────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { printf "${GREEN}[OK]${NC}    %s\n" "$*"; }
fail() { printf "${RED}[FAIL]${NC}  %s\n" "$*"; }
warn() { printf "${YELLOW}[WARN]${NC}  %s\n" "$*"; }
info() { printf "${CYAN}[INFO]${NC}  %s\n" "$*"; }

# ── Docker binary ───────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  fail "Docker is not installed."
  echo "  Install: https://docs.docker.com/engine/install/"
  exit 1
fi
ok "Docker found: $(docker --version)"

# ── Docker Compose v2 ──────────────────────────────────────────────
if ! docker compose version &>/dev/null; then
  fail "'docker compose' (v2 plugin) is not available."
  echo "  Install: https://docs.docker.com/compose/install/linux/"
  exit 1
fi
ok "Docker Compose found: $(docker compose version --short)"

# ── Minimum Docker version 24+ ─────────────────────────────────────
DOCKER_VER=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0.0.0")
DOCKER_MAJOR=${DOCKER_VER%%.*}
if [ "$DOCKER_MAJOR" -lt 24 ] 2>/dev/null; then
  fail "Docker version $DOCKER_VER is too old. Minimum required: 24.x"
  echo "  Upgrade: https://docs.docker.com/engine/install/"
  exit 1
fi
ok "Docker version $DOCKER_VER (>= 24)"

# ── Docker daemon running ──────────────────────────────────────────
if ! docker info &>/dev/null; then
  fail "Docker daemon is not running."
  echo "  Try: sudo systemctl start docker"
  exit 1
fi
ok "Docker daemon is running"

# ── .env file ──────────────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  warn "Created .env from .env.example"
  warn "Consider changing POSTGRES_PASSWORD in .env before going to production!"
else
  ok ".env already exists"
fi

# ── Build & start ──────────────────────────────────────────────────
info "Building and starting containers…"
echo ""
if ! docker compose up --build -d 2>&1; then
  fail "docker compose up failed. Recent logs:"
  echo ""
  docker compose logs --tail=40
  exit 1
fi
echo ""
ok "Containers started"

# ── Wait for healthy ───────────────────────────────────────────────
MAX_WAIT=120
POLL_INTERVAL=3
elapsed=0

info "Waiting for all services to become healthy (up to ${MAX_WAIT}s)…"

all_healthy() {
  local svc_count healthy_or_running
  svc_count=$(docker compose ps --services 2>/dev/null | wc -l)
  [ "$svc_count" -eq 0 ] && return 1
  # Count services that are Up and either healthy or have no healthcheck
  healthy_or_running=$(docker compose ps 2>/dev/null \
    | tail -n +2 \
    | grep -cE '\(healthy\)|Up[^(]*$' || true)
  [ "$healthy_or_running" -ge "$svc_count" ]
}

while [ $elapsed -lt $MAX_WAIT ]; do
  if all_healthy; then
    echo ""
    ok "All services are healthy"
    break
  fi
  sleep "$POLL_INTERVAL"
  elapsed=$((elapsed + POLL_INTERVAL))
  printf "."
done

if [ $elapsed -ge $MAX_WAIT ]; then
  echo ""
  fail "Timed out waiting for services to become healthy."
  echo ""
  docker compose ps
  echo ""
  docker compose logs --tail=20
  exit 1
fi

# ── Smoke test ─────────────────────────────────────────────────────
echo ""
info "Running smoke tests…"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -x "$SCRIPT_DIR/smoke-test.sh" ]; then
  bash "$SCRIPT_DIR/smoke-test.sh"
  SMOKE_EXIT=$?
else
  warn "smoke-test.sh not found or not executable — skipping"
  SMOKE_EXIT=0
fi

# ── Summary ────────────────────────────────────────────────────────
echo ""
printf "${BOLD}════════════════════════════════════════════${NC}\n"
echo ""
if [ $SMOKE_EXIT -eq 0 ]; then
  ok "Setup complete!"
else
  warn "Setup complete but some smoke tests failed."
fi
echo ""
info "Frontend:  http://localhost:3000"
info "API:       http://localhost:8080"
info "Health:    http://localhost:8080/health"
echo ""
info "Stop:      bash scripts/teardown.sh"
info "Logs:      docker compose logs -f"
printf "${BOLD}════════════════════════════════════════════${NC}\n"

exit $SMOKE_EXIT
