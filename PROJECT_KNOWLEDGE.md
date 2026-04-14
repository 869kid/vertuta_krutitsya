# Vertuta Krutitsya — Project Knowledge

Shared knowledge base for all AI agents. Read before starting work. Updated by `vertuta-debrief` skill.

## Architecture Decisions

### Pointauc fork stripped to wheel-only (2026-04-12)
This repo is a fork of [Pointauc](https://github.com/Pointauc/pointauc_frontend) stripped of auction, overlays, integrations, tutorials, and user settings pages. Only the wheel-of-fortune functionality remains, plus new matryoshka (nested wheel) mode and history tracking. Backend is a separate .NET 9 API (`server/`).

### Equal-weight wheel segments (2026-04-12)
Wheel segments are always equal size — `amount` field on `WheelItem`/`Slot` is forced to 1. The weight/amount UI has been removed from the frontend. `defineAngle` in `BaseWheel/helpers.ts` divides 2π equally among items. `slotToWheel` in `slots.utils.ts` hardcodes `amount: 1`.

### VariantsPanel replaces ItemsPreview (2026-04-12)
The left-side panel is now `VariantsPanel` + `VariantItem` (both in `src/pages/wheel/WheelPage/`). It works directly with `Slot[]` from Redux and renders a recursive tree for matryoshka nesting. The old `ItemsPreview` is still in the codebase but disabled via `elements={{ preview: false }}` on `RandomWheel`. Each variant row shows: color dot, name, delete button, owner field, matryoshka checkbox. Child items render recursively with `+ Добавить` per level.

### Ghost add-card replaces Button+TextInput in VariantsPanel (2026-04-13)
The "add variant" UI is now a ghost card (`.addCard` in `VariantsPanel.module.css`) at the top of the scroll list instead of a separate Button + TextInput above it. The card matches `VariantItem` shape but uses `dark-7` background. It contains: an unstyled `TextInput`, an `ActionIcon` with `variant='outline'` that fills on hover (`.addCardButton` class), plus `AuthorSelect` and Matryoshka checkbox. On submit, `onAdd(name, isMultiLayer, undefined, owner)` is called with pre-filled values, then all fields reset. Files: `src/pages/wheel/WheelPage/VariantsPanel.tsx`, `VariantsPanel.module.css`.

### Real-time room sync via SignalR (2026-04-14)
Multi-client wheel synchronization implemented using SignalR hub (`server/Hubs/WheelHub.cs`) with room-based groups. Architecture: REST `POST /api/room` creates a room (with optional BCrypt password), then clients join via SignalR `JoinRoom` method. Variants are stored server-side in PostgreSQL (`Variants` table, adjacency list via `ParentId` for matryoshka nesting). Host is tracked in a static `ConcurrentDictionary<string, string>` (roomCode → connectionId) — first joiner becomes host. Only host can spin (remove variants) and delete; anyone can add. Client-side: `src/api/wheelHubApi.ts` (SignalR client), `src/reducers/Room/Room.ts` (Redux slice), `src/utils/roomVariantMapper.ts` (flat VariantDto[] ↔ tree Slot[]), `src/pages/wheel/WheelPage/RoomPanel.tsx` (create/join/leave UI). All WheelPage handlers check `if (roomCode)` — hub call or local fallback. Backward compatible: local mode works exactly as before when no room is active.

### CORS changed from AllowAnyOrigin to specific origins (2026-04-14)
`server/Program.cs` CORS policy changed from `.AllowAnyOrigin()` to `.WithOrigins(allowedOrigins).AllowCredentials()`. This is **required** for SignalR — `AllowCredentials` is incompatible with `AllowAnyOrigin`. Allowed origins default to `["http://localhost:3000", "http://localhost:5173"]` and can be overridden via `AllowedOrigins` config section in `appsettings.json`. If deploying to production, add the production URL there.

### Collapsible wheel settings panel (2026-04-13)
`WheelSettings.tsx` (`src/domains/winner-selection/wheel-of-random/settings/ui/Form/WheelSettings.tsx`) has a gear icon (`IconSettings`, `size='xl' radius='md' variant='outline'` — matching the soundtrack button style) in the top controls row. It toggles a Mantine `<Collapse>` around all settings below (Wheel Style, format, dividing, randomness source, CoreImageField). Default state is **collapsed** (`useDisclosure(false)`). The `SimpleGrid` wrapper was removed since `CoreImageField` moved inside the Collapse. The `direction` prop on `WheelSettingsProps` is still in the interface but no longer destructured or used — it can be removed from callers too.

### Controls row vertical alignment with variant cards (2026-04-13)
`.wheel-controls` in `src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.module.css` has `padding-top: 30px` to align the Spin/Duration row with the top of the variant cards on the left (accounting for the "Варианты" title height).

## Data & Formats

### Room and Variant EF entities added (2026-04-14)
`server/Models/Room.cs` — `RoomCode` (8-char uppercase, unique), `HostName`, `PasswordHash` (BCrypt, nullable), `CreatedAt`. `server/Models/Variant.cs` — `ClientId` (maps to frontend `Slot.id`), `RoomCode` (FK to Room), `ParentId` (self-FK for matryoshka tree), `Name`, `Owner`, `IsMultiLayer`, `SortOrder`. `WinRecord` gained nullable `RoomCode` field for room-scoped history. Migration: `AddRoomsAndVariants`. BCrypt.Net-Next 4.1.0 added to server csproj.

### Slot model extended with `owner` (2026-04-12)
`Slot` interface (`src/models/slot.model.ts`) now includes `owner?: string` for tracking who suggested a variant.

## Scripts & Tools

### Deep tree utilities in matryoshka.utils (2026-04-12)
`src/utils/matryoshka.utils.ts` has three new functions for operating on the slot tree without knowing the parent path:
- `updateLotInTree(lots, id, changes)` — deep search + update by id
- `removeLotByIdDeep(lots, id)` — deep search + remove by id
- `addLotToParent(lots, parentId, newSlot)` — deep search + append child

### WheelPage layout: VariantsPanel + RandomWheel side-by-side (2026-04-12)
`WheelPage.tsx` wraps the two main areas in `div.wheelLayout` (flex, `gap: 24px`). `VariantsPanel` is on the left (280–340px fixed width), `RandomWheel` fills the rest. The old `ItemsPreview` inside `RandomWheel` is disabled via `elements={{ preview: false }}`. CSS is in `WheelPage.module.css`.

### vertuta-debrief skill and project-knowledge rule (2026-04-12)
Skill at `.cursor/skills/vertuta-debrief/SKILL.md` appends session findings to `PROJECT_KNOWLEDGE.md`. Rule at `.cursor/rules/project-knowledge.mdc` (`alwaysApply: true`) forces every agent to read `PROJECT_KNOWLEDGE.md` before starting work and reminds to debrief at session end.

## Known Issues & Gotchas

### i18n `wheel.import` is an object, not a string (2026-04-12)
The key `wheel.import` in locale JSON files is a nested object (`{ title, rules, ... }`), not a leaf string. Using `t('wheel.import')` renders "[object Object]". Use `t('wheel.import.title')` or a literal string instead.

### AddLotPopover is dead code (2026-04-12)
`src/domains/winner-selection/matryoshka/AddLotPopover.tsx` is no longer imported anywhere after the VariantsPanel rework. It can be safely deleted.

## Conventions

### Import button uses literal string (2026-04-12)
The "Импорт" button in `VariantsPanel` uses a hardcoded `'Импорт'` label (not i18n) because there is no simple leaf key for "Import" in the locale files.

### Matryoshka navigation: Home/Back buttons + breadcrumb path (2026-04-13)
When inside a nested wheel, the title bar shows Home (IconHome) and Back (IconArrowLeft) `ActionIcon` buttons before the "Wheel" title. A `MatryoshkaNavigation` breadcrumb (`src/domains/winner-selection/matryoshka/MatryoshkaNavigation.tsx`) renders the path below the title. The old `MatryoshkaBreadcrumb.tsx` in the same folder is now dead code (no longer imported).

### Wheel segment click navigates into matryoshka (2026-04-13)
`onSegmentClick` prop is threaded through `BaseWheel` → `FormWheel` → `FullWheelUI` → `WheelPage`. `BaseWheel` adds a transparent overlay `div` (with `pointerEvents: 'all'`) over the canvas when `onSegmentClick` is provided. Click detection uses `atan2` for angle + compensates for GSAP rotation via `getCurrentRotation()`. Only matryoshka slots with children trigger navigation; regular segments are ignored. The wrapper div has `pointerEvents: 'none'` globally, so direct canvas clicks don't work — the overlay is required.

### soleMatryoshka auto-collapse removed (2026-04-13)
Previously, if the current level had exactly 1 multi-layer slot with children, the wheel was hidden and replaced with an "Enter" button. This `soleMatryoshka` logic in `WheelPage.tsx` was removed. The wheel + VariantsPanel now always render regardless of nesting structure.

### FullWheelUI does not auto-sync items from props (2026-04-13)
`FullWheelUI` (`src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.tsx`) stores incoming `items` prop in `useState` (line ~120) and **never updates when the prop changes**. The only way to push new items into the wheel is via the imperative `wheelController.current.setItems(...)`. Previously `WheelPage.tsx` had a broken one-time sync (`previousWheelItems.current === initialSlots` — reference equality that was true only on the first render), so adding variants via `handleAddVariant` never reached the canvas. Fixed by replacing the broken block with `useEffect(() => { wheelController.current?.setItems(wheelItems); }, [wheelItems])` in `WheelPage.tsx`. The `previousWheelItems` ref and `initialSlots` import were removed as no longer needed.

### AuthorSelect replaces TextInput for owner field (2026-04-13)
`src/shared/ui/AuthorSelect/AuthorSelect.tsx` — Mantine `Combobox`-based dropdown with predefined authors (Катя, Егор, Колян, Жека) and "Добавить автора" footer to add custom names. Custom names persist in localStorage key `pointauc_custom_authors` via `src/shared/lib/useAuthorHistory.ts` hook. Used in `VariantItem.tsx` and `AddLotPopover.tsx` (AddLotPopover is still dead code). i18n keys added under `wheel.authorSelectPlaceholder`, `wheel.addAuthor`, etc. in `en.json`/`ru.json`.

### useSyncExternalStore requires stable getSnapshot references (2026-04-13)
`useSyncExternalStore` compares snapshots via `Object.is`. If `getSnapshot` returns a new array/object reference each call (e.g. `JSON.parse(...)` or `[]` literal), React detects a "changed" store on every consistency check and enters an infinite re-render loop, crashing the app. **Always cache the parsed result** and return the same reference when the underlying data hasn't changed. See `src/shared/lib/useAuthorHistory.ts` for the correct pattern: compare the raw `localStorage.getItem()` string with a cached copy before re-parsing.

## Conventions

### Room mode is opt-in via roomCode guard pattern (2026-04-14)
All WheelPage handlers (`handleAddVariant`, `handleDeleteVariant`, `handleNextRound`) check `if (roomCode)` at the top. If truthy — hub call via `wheelHubApi`; if falsy — original local Redux/IndexedDB logic. This ensures backward compatibility. The `isReadOnly` prop (derived from `!!roomCode && !isHost`) is threaded through `VariantsPanel` → `VariantItem` to hide delete buttons for viewers.

### Host-only actions need double guard: roomCode + isHost (2026-04-14)
`handleRequestSpin` and `handleNextRound` in `WheelPage.tsx` must check `isHost` before sending `requestSpin`/`confirmRound` to the server. Without this, non-host viewers' form submit would trigger a server call that gets rejected with an error. The `onRequestSpin` prop is passed to `RandomWheel` for all room members (so the early-return in `onSpinClick` fires), but the actual `wheelHubApi.requestSpin()` call is gated by `isHost`. Same pattern for `confirmRound` inside `handleNextRound`.

### Git remotes and default branch (2026-04-13)
Remotes were reconfigured: `origin` → `https://github.com/869kid/vertuta_krutitsya.git` (push here), `upstream` → `https://github.com/Pointauc/pointauc_frontend.git` (read-only, original fork). Default branch renamed from `master` to `main`. Plain `git push` / `git pull` works against `origin/main`. The rule in `.cursor/rules/project-knowledge.mdc` also documents this.

## Scripts & Tools

### Vitest test suite added (2026-04-13)
`pnpm test` runs 165 unit tests across 9 files in `src/__tests__/`. Config at `vitest.config.ts` uses `vite-tsconfig-paths` for alias resolution, `environment: 'node'`, `globals: true`. Tests cover: matryoshka tree ops, locked percentage math, PredictionService weighted selection, wheel angle helpers, CSV/JSON parsers, archive validators, slot utils, EventQueue, and Slots reducer. All tests are pure-logic (no DOM/jsdom needed). Run time ~1.6s.

### Testing rule and stop-hook for agents (2026-04-13)
`.cursor/rules/testing.mdc` (`alwaysApply: true`) — instructs agents to run `pnpm test` before every commit and add tests for new non-trivial logic. Contains source-to-test file mapping.
`.cursor/hooks.json` — prompt hook on `stop` event. When an agent finishes and has modified `.ts/.tsx` files, the hook triggers a test run, failure analysis, and optional new test creation. `loop_limit: 3`, `timeout: 120s`.

## Known Issues & Gotchas

### getSlotFromSeed returns -1 for empty slots (2026-04-13)
`getSlotFromSeed` in `src/services/PredictionService.ts` returns -1 when the slots array is empty. Callers like `useNormalWheel` do `items[getSlotFromSeed(...)]` without guarding, which would crash at runtime. With zero-weight slots it returns 0 (first slot always "wins"), which is degenerate but not a crash.

### updateSlotAmount has no findIndex guard (2026-04-13)
Internal helper `updateSlotAmount` in `src/reducers/Slots/Slots.ts` calls `slots[findIndex(...)]` without checking for -1. If the slot id is not found, `transform(undefined)` will throw. Compare with `updateSlotIsFavorite` which does guard. This is a latent crash if a stale id is dispatched.

### normalizeSlotsChances produces NaN when total is 0 (2026-04-13)
`PredictionService.normalizeSlotsChances` in `src/services/PredictionService.ts` divides by `getTotalSize(slots)`. If all amounts are 0, every chance becomes `NaN`. Downstream code that displays or compares these values may break silently.

### Host tracking is in-memory, lost on server restart (2026-04-14)
`WheelHub.cs` stores the host connectionId in a `static ConcurrentDictionary`. If the server restarts, all host assignments are lost. The first client to reconnect after restart becomes host. This also means horizontal scaling (multiple server instances) won't work without switching to a distributed store (e.g. Redis backplane for SignalR).

### wheelHubApi listeners accumulate if not cleaned up (2026-04-14)
`RoomPanel.tsx` registers `onJoinedRoom`, `onVariantAdded`, `onVariantRemoved`, `onError` listeners in `handleCreate`/`handleJoin`. These are cleaned up via `wheelHubApi.removeAllListeners()` on leave, but if the component unmounts without calling leave (e.g. navigation away), listeners leak. Consider adding a cleanup `useEffect` return.

### FullWheelUI shuffle breaks multi-client sync (2026-04-14)
`FullWheelUI` (`src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.tsx`) shuffles wheel items with `Math.random()` via `useMemo(() => shuffle(items), [items, shouldShuffle])`. Each browser tab produces a unique segment order. In room mode this caused the wheel to visually stop on the wrong variant even though the winner ID was correct — `calculateWinnerSpinDistance` targeted the right angle for the local layout, but any timing desync between `normalizedRef` and the drawn canvas during React re-renders would shift the result to a neighboring segment. Fix: pass `shouldShuffle={false}` from `WheelPage` when `roomCode` is set. Also `distanceToItem` in `geometry.ts` uses `getRandomInclusive()` to pick a random position within the winning segment — in room mode the server-provided `seed` replaces this randomness. Both `shouldShuffle` and `seed` are only relevant for room mode; local mode is unaffected.

### JSON parser passes garbage objects through without validation (2026-04-13)
`parseJSON` in `src/domains/auction/archive/lib/parsers/jsonParser.ts` casts non-string array items directly to `ArchivedLot` without checking they have `name`/`amount` fields. Malformed JSON like `[{"garbage": true}]` will produce invalid lot objects that may cause crashes later in the pipeline.

## Open Tasks

### ~~CI workflow still references `master`~~ RESOLVED (2026-04-14)
Fixed: `deploy-production.yml` trigger changed from `master` to `main`. Duplicate YAML block removed (was 177 lines, now 89). Both production and staging workflows now pass `VITE_HISTORY_API_URL` env var to the build step.

### Room cleanup / TTL not implemented (2026-04-14)
Rooms and their variants persist in PostgreSQL indefinitely. There is no cleanup job or TTL. Old rooms accumulate over time. Consider adding a background service or scheduled task to delete rooms older than N hours.

### No double-spin guard (2026-04-14)
There is no protection against the host clicking Spin while an animation is already running. `FullWheelUI.onSpinClick` and `triggerServerSpin` do not check whether a spin is in progress. This can cause overlapping GSAP animations and potentially duplicate `ConfirmRound` calls. Consider adding an `isSpinning` flag to `Room` Redux slice or the wheel controller.

## Architecture Decisions

### Docker Compose full-stack setup (2026-04-14)
`docker-compose.yml` defines three services: `db` (PostgreSQL 16-alpine, no host port — internal only), `server` (.NET backend on 8080), `frontend` (nginx on host port 3000). Frontend nginx proxies `/api/` and `/hubs/` to `http://server:8080` (Docker network DNS). WebSocket upgrade headers are set on `/hubs/` for SignalR. `VITE_HISTORY_API_URL` build arg is empty by default — Vite builds with relative paths so the nginx proxy handles routing. `AllowedOrigins__0=http://localhost:3000` is set on the server for CORS. The root `Dockerfile` is frontend-only; `.dockerignore` excludes `server/` to avoid bloating the frontend build context.

### nginx.conf consolidated and hardened (2026-04-14)
`nginx/nginx.conf` — single server block (was duplicated). Includes gzip compression, security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), `/api/` proxy, `/hubs/` WebSocket proxy, `/assets/` aggressive caching, and `/` SPA fallback. Referenced in `Dockerfile` as `COPY nginx/nginx.conf` (was `private-nginx.conf`).

## Scripts & Tools

### .env.example documents all environment variables (2026-04-14)
Root `.env.example` documents Vite build-time vars (`VITE_HISTORY_API_URL`, `VITE_DONATEX_CLIENT_ID`), Docker Compose vars (`POSTGRES_*`), and .NET server vars (`AllowedOrigins__0`, `ConnectionStrings__DefaultConnection`). Useful for onboarding and production deploys.

### Self-hosting scripts: setup, smoke-test, teardown (2026-04-14)
`scripts/setup.sh` — one-command Linux setup: checks Docker 24+ & Compose v2, copies `.env.example` → `.env`, runs `docker compose up --build -d`, polls until all services healthy (up to 120s), runs smoke tests, prints URLs. Idempotent.
`scripts/smoke-test.sh` — 8 checks: 3 containers running, frontend HTTP 200 + HTML, API `/health` 200, nginx `/api/` proxy (not 502/503), WebSocket `/hubs/wheel` reachable, PostgreSQL `pg_isready`. Prints pass/fail summary, exits 0 or 1.
`scripts/teardown.sh` — `docker compose down` (preserves volumes); `--clean` flag adds `-v` to delete DB data.
All scripts use `#!/usr/bin/env bash`, `set -euo pipefail`, colored output, and auto-`cd` to project root via `BASH_SOURCE`. LF line endings enforced (created on Windows).

## Known Issues & Gotchas

### API_BASE used `||` instead of `??` — broke Docker builds (2026-04-14)
`src/api/wheelHubApi.ts` line 3: `VITE_HISTORY_API_URL || 'http://localhost:8080'` treated empty string (set intentionally for Docker/nginx proxy builds) as falsy, falling back to localhost. Fixed by switching to `??` (nullish coalescing). Empty string = relative URLs for nginx proxy; undefined = localhost for dev; explicit URL = that URL.

### nginx:alpine has wget but NOT curl (2026-04-14)
The `nginx:alpine` Docker image includes `wget` but not `curl`. Any in-container HTTP check (healthcheck, smoke test from inside the container) must use `wget --spider -q <url>` instead of `curl -f`. This affects `docker-compose.yml` frontend healthcheck and any future scripts that exec into the frontend container.

### Vite proxy pointed to wrong port and wrong WebSocket path (2026-04-14)
`vite.config.ts` proxy section had `http://localhost:8000` (wrong port, backend is 8080) and `/socket.io` (Socket.IO path, but app uses SignalR at `/hubs/*`). Fixed to proxy `/api` and `/hubs` (with `ws: true`) to `http://localhost:8080`. In dev mode the SignalR client builds a full URL so it bypasses the proxy, but `/api` proxy is used by REST calls with relative paths and `/hubs` proxy serves as a fallback.

## Architecture Decisions

### Backend hardened for production (2026-04-14)
`server/Program.cs` — Swagger/SwaggerUI gated behind `IsDevelopment()` so it's not exposed in production. `ForwardedHeaders` middleware added (XForwardedFor + XForwardedProto) before CORS for correct client IP/scheme behind reverse proxy. Health check endpoint at `/health` registered via `AddHealthChecks()` + `MapHealthChecks("/health")` — no external NuGet needed, uses built-in ASP.NET Core health checks. `server/Dockerfile` — runtime container runs as non-root `appuser` (adduser + USER directive). `server/appsettings.json` — `AllowedOrigins` array added with localhost defaults so the config section is explicit (previously only existed as a fallback in code).

### Server-side winner determination + spin sync (2026-04-14)
Winner selection moved from client to server for room mode. Flow: host sends `RequestSpin(roomCode, duration, parentVariantId?)` → server picks winner via `RandomNumberGenerator.GetInt32(variants.Count)` in `WheelHub.cs` → broadcasts `SpinStarted(winnerClientId, winnerId, winnerName, duration)` to all clients in room → all clients animate wheel via `triggerServerSpin` on `RandomWheelController` imperative handle (`FullWheelUI/index.tsx`). After animation, host confirms via `ConfirmRound` → server writes `WinRecord` + removes `Variant` → broadcasts `WinRecorded` + `VariantRemoved`. New DTOs: `RequestSpinRequest`, `SpinStartedResponse`, `ConfirmRoundRequest` in `server/Models/Dtos.cs`. Old `RecordWin` hub method kept for backward compat. Non-room (local) mode completely unaffected — `onRequestSpin` prop is `undefined` so `FullWheelUI.onSpinClick` uses existing client-side flow.

### FullWheelUI supports external spin triggering (2026-04-14)
`RandomWheelController` interface (`src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.tsx`) now exposes `triggerServerSpin(winnerClientId: string, duration: number): Promise<void>`. This imperatively runs `BaseWheel.spin()` + soundtrack + `onWin()` callback without going through the form submit / seed generation path. New prop `onRequestSpin?: (duration: number) => void` causes `onSpinClick` to short-circuit: calculate duration from settings, call the callback, return. Both are wired in `WheelPage.tsx` only when `roomCode` is set.

### .gitignore excludes server build artifacts (2026-04-14)
`server/bin/` and `server/obj/` were previously tracked in git (no .gitignore rule). Added both to root `.gitignore` and removed from tracking via `git rm -rf --cached`. This eliminated ~130 binary DLL/EXE/cache files from the repo. The `server/.dockerignore` already excluded these for Docker builds, but git itself was storing them.

### PowerShell does not support bash heredoc syntax (2026-04-14)
On Windows with PowerShell shell, `$(cat <<'EOF' ... EOF)` fails with parse errors. For multi-line git commit messages, use multiple `-m` flags instead: `git commit -m "title" -m "line 1" -m "line 2"`. The `&&` operator also doesn't work in older PowerShell — use `;` to chain commands. This affects both manual terminal usage and agent-generated shell commands.

### DEPLOYMENT.md comprehensive deployment guide (2026-04-14)
`DEPLOYMENT.md` in project root — covers local dev (backend via Docker Compose + frontend via Vite), full Docker stack (all 3 services), production CI/CD (GitHub Actions for production and staging), required GitHub Secrets (8 total: SSH_*, VITE_*_PRODUCTION, VITE_*_STAGING), server-side nginx example config, manual backend deployment steps, environment variable reference (Vite build-time, .NET runtime, Docker Compose), architecture diagrams (Mermaid), and troubleshooting section (CORS, WebSocket, SSG, DB, port conflicts). Cross-checked against all config files on 2026-04-14. Known limitation: the .NET backend is not deployed via CI — it's manual (Docker or direct dotnet publish).

### entry-server.tsx created for SSG prerender (2026-04-14)
`src/entry-server.tsx` was missing — referenced by `build:ssg` script (`package.json`) and consumed by `scripts/prerender.js` but never existed in the repo. Created with minimal SSR setup: `createMemoryRouter` (not `createBrowserRouter`), bare `MantineBaseProvider` (no Redux-dependent theme), fresh `QueryClient`, i18n init via `i18nInitPromise`, and `getHeadData()` that reads metadata from i18n translations. Exports `render(route)` returning `{ html, head }`.

### Microsoft.AspNetCore.OpenApi conflicts with Swashbuckle (2026-04-14)
`Microsoft.AspNetCore.OpenApi 9.0.13` pulls in `Microsoft.OpenApi 2.x` which removed types like `IOpenApiAny`, `OpenApiSchema`, etc. that `Swashbuckle.AspNetCore 10.1.7` (or its transitive deps) still reference. Server crashes at startup with `ReflectionTypeLoadException`. Fix: removed `Microsoft.AspNetCore.OpenApi` from `server/VertutaServer.csproj` — Swashbuckle provides its own OpenAPI support. `AddEndpointsApiExplorer()` in `Program.cs` still works (it's a framework method, not package-dependent).

### Dockerfile syntax directive requires network access (2026-04-14)
`# syntax=docker/dockerfile:1.7` at top of root `Dockerfile` forces Docker BuildKit to pull the frontend image from `registry-1.docker.io`. Fails in offline/DNS-restricted environments with "no such host". Removed — default BuildKit (bundled with Docker Desktop) handles all features used in the Dockerfile.

### tsconfig target/lib bumped to ES2022 (2026-04-14)
`tsconfig.json` had `"target": "ES2020"` / `"lib": ["ES2020", ...]`. The `.at()` array method (used in `matryoshka.utils.test.ts`, `wheelHelpers.test.ts`, `VariantItem.tsx`) requires ES2022. Build fails with `TS2550: Property 'at' does not exist`. Fixed by changing both `target` and `lib` to `ES2022`.

### slot.name is nullable — guard with ?? '' (2026-04-14)
`Slot.name` in `src/models/slot.model.ts` can be `null`. In `VariantItem.tsx`, `useState(slot.name)` creates `string | null` state, causing TS errors on `.trim()` and `<TextInput value={...}>`. All usages of `slot.name` as initial/reset value need `?? ''` fallback. Same pattern applies anywhere `Slot` fields are used as form state.

### Self-Hosting section added to DEPLOYMENT.md (2026-04-14)
New section between "Full Docker Stack" and "Production Deployment (CI/CD)". Covers: system requirements (Linux, Docker 24+, 2 GB RAM, 5 GB disk), quick start via `scripts/setup.sh` (3 commands), helper scripts table, `.env` configuration (especially `POSTGRES_PASSWORD`), port customization with CORS reminder, reverse proxy examples for both Caddy (3-line auto-HTTPS) and nginx (with WebSocket upgrade headers for SignalR), update procedure (`git pull` + rebuild, auto-migrations), database backup/restore via `pg_dump`/`psql` through `docker compose exec`, and uninstall instructions using `scripts/teardown.sh --clean`.

### Self-hosting helper scripts (2026-04-14)
Three bash scripts in `scripts/` for one-command self-hosting:
- `scripts/setup.sh` — checks Docker ≥ 24 and Compose v2, creates `.env` from `.env.example` if missing, runs `docker compose up --build -d`, waits up to 120 s for all services to become healthy, then calls `smoke-test.sh`. Exits non-zero on any failure.
- `scripts/smoke-test.sh` — verifies all 3 containers are running, frontend returns 200 with HTML, API `/health` returns 200, nginx proxies `/api/` correctly, WebSocket upgrade on `/hubs/wheel` works, and PostgreSQL responds to `pg_isready`. Prints pass/fail summary.
- `scripts/teardown.sh` — stops containers via `docker compose down`. With `--clean` flag also removes volumes (deletes database data).

### Frontend healthcheck added to docker-compose.yml (2026-04-14)
`docker-compose.yml` frontend service now has a healthcheck: `wget --spider -q http://localhost:80` (interval 5s, timeout 5s, retries 3). Uses `wget` because `nginx:alpine` ships with wget but not curl. All three services (db, server, frontend) now have healthchecks, enabling `setup.sh` to poll for full-stack readiness.

### Deterministic wheel sync in room mode: no-shuffle + server seed (2026-04-14)
In room mode, `FullWheelUI`'s `shuffle()` is disabled (`shouldShuffle={false}` passed from `WheelPage.tsx` when `roomCode` is truthy) so all clients display segments in the same order (sorted by name via `filteredItems`). Additionally, the server generates a random `seed` (double [0,1)) in `WheelHub.RequestSpin` and broadcasts it in `SpinStartedResponse`. Clients use this seed in `distanceToItem()` (`geometry.ts`) instead of `Math.random()` to compute an identical stop position within the winning segment. Together these ensure all clients render the same wheel layout and animate to the exact same final rotation. Files changed: `server/Models/Dtos.cs` (added `Seed` to `SpinStartedResponse`), `server/Hubs/WheelHub.cs` (seed generation), `src/api/wheelHubApi.ts` (`seed` in `SpinStartedDto`), `src/domains/winner-selection/wheel-of-random/lib/geometry.ts` (optional `seed` param on `distanceToItem`/`calculateWinnerSpinDistance`), `BaseWheel.tsx` (`seed` in `SpinParams`), `FullWheelUI/index.tsx` (`triggerServerSpin` accepts seed), `WheelPage.tsx` (passes seed + `shouldShuffle={false}`).

### historyApi.ts had same `||` fallback bug as wheelHubApi (2026-04-14)
`src/api/historyApi.ts` line 3 had `import.meta.env.VITE_HISTORY_API_URL || 'http://localhost:8080'` — empty string from Docker build fell through to localhost, breaking API calls through ngrok/nginx proxy. Fixed to `|| ''` so relative `/api/*` paths route through nginx. Same root cause as the `wheelHubApi.ts` fix documented above.

## Known Issues & Gotchas

### StatsController EF Core LINQ translation failure (2026-04-14)
`server/Controllers/StatsController.cs` — `GroupBy().OrderByDescending(g => g.Count()).Take().ToDictionaryAsync(g => g.Key, g => g.Count())` cannot be translated to SQL by Npgsql/EF Core. The `g.Count()` inside `ToDictionaryAsync` value selector is the problem. Fix: project to anonymous type via `.Select(g => new { g.Key, Count = g.Count() })` first, then `.ToListAsync()`, then in-memory `.ToDictionary()`. This pattern applies to any EF Core `GroupBy` + aggregate + `ToDictionary` chain.

### UpdateVariant hub method — room-mode variant editing (2026-04-14)
`handleUpdateVariant` in `WheelPage.tsx` was local-only (Redux `updateLotInTree` + `setSlots`). In room mode, renaming a child variant or toggling matryoshka would revert on the next `onVariantAdded`/`onVariantRemoved` event because the tree is rebuilt from `currentVariants` (server data). Fix: added `UpdateVariant` method to `server/Hubs/WheelHub.cs` (updates `Name`, `Owner`, `IsMultiLayer` in DB, broadcasts `VariantUpdated` to room group), `updateVariant()` to `src/api/wheelHubApi.ts`, `onVariantUpdated` listener registration in `RoomPanel.tsx`, and `handleUpdateVariant` now calls `wheelHubApi.updateVariant()` when `roomCode` is set. DTO: `UpdateVariantRequest` in `server/Models/Dtos.cs` — all fields except `RoomCode`/`VariantId` are nullable (partial update).
