#!/usr/bin/env bash
set -euo pipefail

COMPOSE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$COMPOSE_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CLEAN=false
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    *)
      printf "${RED}Unknown flag: %s${NC}\n" "$arg"
      echo "Usage: teardown.sh [--clean]"
      echo "  --clean   Remove volumes (deletes database data)"
      exit 1
      ;;
  esac
done

if [ "$CLEAN" = true ]; then
  printf "${YELLOW}Stopping containers and removing volumes…${NC}\n"
  docker compose down -v
  printf "${GREEN}Done. All containers stopped, volumes removed (database data deleted).${NC}\n"
else
  printf "${YELLOW}Stopping containers…${NC}\n"
  docker compose down
  printf "${GREEN}Done. Containers stopped. Database data preserved in Docker volume.${NC}\n"
  echo "  To also delete data: bash scripts/teardown.sh --clean"
fi
