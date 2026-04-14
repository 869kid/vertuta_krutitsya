---
name: docker-verify
description: Verify Docker Compose deployment by building, waiting for health, and running smoke tests. Use when the user asks to check Docker, test containers, verify deployment, rebuild, or mentions "проверь докер", "docker up", "запусти контейнеры", "проверь деплой", "smoke test".
---

# Docker Verify

Build and verify the full Docker Compose stack (PostgreSQL + .NET backend + nginx frontend).

## Prerequisites

- Docker Desktop must be running. Check with `docker info`. If it fails, ask the user to start Docker Desktop.
- Working directory must be the project root (where `docker-compose.yml` lives).

## Procedure

1. **Build and start** all services:

```bash
docker compose up --build -d
```

2. **Wait for health** — poll until all 3 containers report healthy (up to 120s):

```bash
for i in $(seq 1 24); do
  status=$(docker compose ps --format json | jq -r '.Health // .State' 2>/dev/null || docker compose ps)
  echo "Check $i/24: $status"
  if docker compose ps | grep -q "(unhealthy)\|Exit"; then
    echo "UNHEALTHY — check logs"
    docker compose logs --tail=30
    break
  fi
  all_healthy=$(docker compose ps --format '{{.Health}}' 2>/dev/null | grep -v healthy | wc -l)
  if [ "$all_healthy" -eq 0 ] 2>/dev/null; then
    echo "All services healthy"
    break
  fi
  sleep 5
done
```

3. **Run smoke tests** if `scripts/smoke-test.sh` exists:

```bash
bash scripts/smoke-test.sh
```

If the script doesn't exist, do manual checks:
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → expect 200
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health` → expect 200

4. **Report results** — summarize which services are up, any failures, and suggest fixes.

## Common Failures

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `no such host` on build | Docker syntax directive or DNS issue | Remove `# syntax=` from Dockerfile |
| Frontend 502 | Backend not ready yet | Wait longer, check `docker compose logs server` |
| DB connection refused | PostgreSQL not healthy | Check `docker compose logs db` |
| CORS errors in browser | `AllowedOrigins` missing the frontend URL | Update `AllowedOrigins__0` in `docker-compose.yml` |
| `nginx:alpine` curl fails | Alpine has wget, not curl | Use `wget --spider -q` |

## After Verification

If everything is healthy, report the URLs:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/health
- Direct backend: http://localhost:8080/health
