# Vertuta Krutitsya — Project Knowledge

Shared knowledge base for all AI agents. Read before starting work. Updated by `vertuta-debrief` skill.

## Architecture Decisions

### Pointauc fork stripped to wheel-only (2026-04-12)
Fork of [Pointauc](https://github.com/Pointauc/pointauc_frontend) stripped of auction, overlays, integrations, tutorials, and user settings. Only wheel-of-fortune remains, plus matryoshka (nested wheel) mode and history tracking. Backend is a separate .NET 9 API (`server/`).

### Equal-weight wheel segments (2026-04-12)
Segments are always equal size — `amount` forced to 1. Weight/amount UI removed. `defineAngle` in `BaseWheel/helpers.ts` divides 2π equally. `variantsToSlots` in `roomVariantMapper.ts` hardcodes `amount: 1`.

### VariantsPanel replaces ItemsPreview (2026-04-12)
Left panel is `VariantsPanel` + `VariantItem` (`src/pages/wheel/WheelPage/`). Renders a recursive `Slot[]` tree from Redux. `ItemsPreview` is disabled via `elements={{ preview: false }}` on `RandomWheel`. Each row: color dot, name (click-to-rename), delete button, owner field, matryoshka checkbox. Children render recursively with `+ Добавить` per level.

### Ghost add-card in VariantsPanel (2026-04-13)
Add-variant UI is a ghost card (`.addCard` in `VariantsPanel.module.css`) at the top of the scroll list. Contains: unstyled `TextInput`, `ActionIcon variant='outline'` (`.addCardButton`), `AuthorSelect`, and Matryoshka checkbox. On submit: `onAdd(name, isMultiLayer, undefined, owner)`, then fields reset.

### Multi-room removed — single permanent DEFAULT room (2026-04-14)
All clients auto-join the `DEFAULT` room on SignalR connect (`WheelHub.OnConnectedAsync`). No host/viewer distinction — everyone can add, delete, and spin. `WheelPage.tsx` auto-connects on mount via `wheelHubApi.connect()` and always routes through `wheelHubApi` — no local Redux fallback. `shouldShuffle={false}` is hardcoded. `serverVariantsRef` (flat `VariantDto[]`) is maintained by listener callbacks and used for `clientId → variantId` lookups when calling `removeVariant`/`updateVariant`/`confirmRound`. Removed: `RoomPanel.tsx`, `RoomController.cs`, host tracking, `isReadOnly` prop, roomCode guards, BCrypt dependency.

### Server-side winner determination + spin sync (2026-04-14)
Flow: client sends `RequestSpin(duration, parentVariantId?)` → server picks winner via `RandomNumberGenerator.GetInt32(variants.Count)` + generates `seed` (double [0,1)) → broadcasts `SpinStarted(winnerClientId, winnerId, winnerName, duration, seed)` → all clients call `triggerServerSpin()` on `RandomWheelController`. After animation, client confirms via `ConfirmRound` → server writes `WinRecord` + removes `Variant` → broadcasts `WinRecorded` + `VariantRemoved`. `shouldShuffle={false}` + server seed ensures identical animation on all clients.

### CORS requires specific origins + AllowCredentials (2026-04-14)
`server/Program.cs` uses `.WithOrigins(allowedOrigins).AllowCredentials()`. Required for SignalR. Defaults: `["http://localhost:3000", "http://localhost:5173"]`; override via `AllowedOrigins` array in `appsettings.json`.

### Docker Compose full-stack setup (2026-04-14)
Three services: `db` (PostgreSQL 16-alpine), `server` (port 8080), `frontend` (nginx on 3000). Nginx proxies `/api/` and `/hubs/` (with WebSocket upgrade) to `http://server:8080`. `VITE_HISTORY_API_URL=""` → relative paths → nginx routing. **Dev workflow is `docker compose up --build` — Vite dev server is NOT used.** Code changes require rebuild.

### Backend hardened for production (2026-04-14)
`Program.cs`: Swagger gated behind `IsDevelopment()`, `ForwardedHeaders` middleware before CORS, health check at `/health`. `server/Dockerfile`: non-root `appuser`. `appsettings.json`: `AllowedOrigins` array explicit.

### FullWheelUI external spin triggering (2026-04-14)
`RandomWheelController` exposes `triggerServerSpin(winnerClientId, duration, seed)`. `onRequestSpin` prop causes `onSpinClick` to short-circuit: calculate duration, call callback, return — none of the local seed/spin logic runs.

### Collapsible wheel settings panel (2026-04-13)
`WheelSettings.tsx` has a gear icon toggling a `<Collapse>` around all settings (default: collapsed).

### Matryoshka navigation (2026-04-13)
Home and Back `ActionIcon` buttons in title bar when inside matryoshka. `MatryoshkaNavigation` breadcrumb renders path below title. Segment click navigates into multi-layer slots via `onSegmentClick` threaded through `BaseWheel` → `FormWheel` → `FullWheelUI` → `WheelPage`.

### entry-server.tsx for SSG (2026-04-14)
`src/entry-server.tsx` — needed by `build:ssg`/`scripts/prerender.js`. Uses `createMemoryRouter`, bare `MantineBaseProvider`, fresh `QueryClient`.

### Microsoft.AspNetCore.OpenApi removed (2026-04-14)
Conflicts with Swashbuckle (`ReflectionTypeLoadException`). Removed from `VertutaServer.csproj`. Swashbuckle provides its own OpenAPI support.

## Data & Formats

### Room and Variant EF entities (2026-04-14)
`Room.cs` — `RoomCode` (8-char uppercase), `HostName`, `PasswordHash` (nullable, field kept in schema but unused), `CreatedAt`. `Variant.cs` — `ClientId`, `RoomCode` (FK), `ParentId` (self-FK for matryoshka tree), `Name`, `Owner`, `IsMultiLayer`, `SortOrder`. `WinRecord` has nullable `RoomCode`. Migration: `AddRoomsAndVariants`.

### Slot model (2026-04-12 / 2026-04-14)
`Slot` interface (`src/models/slot.model.ts`) includes `owner?: string`. `slot.name` can be `null` — always guard with `?? ''` in form state and string operations. `createSlot` default: `amount: null`; room mapper sets `amount: 1`.

### roomVariantMapper utilities (2026-04-14)
`src/utils/roomVariantMapper.ts` — `variantsToSlots(variants)`: builds `Slot` tree from flat `VariantDto[]` adjacency list. `findVariantIdByClientId(variants, clientId)`: resolves server-side `id` for hub calls.

## Scripts & Tools

### Vitest test suite (2026-04-13)
`pnpm test` runs 165 unit tests in `src/__tests__/`. Config: `vitest.config.ts`, `environment: 'node'`, `globals: true`. `.cursor/rules/testing.mdc` enforces running tests before commits. `.cursor/hooks.json` `stop` hook auto-runs tests when `.ts/.tsx` files modified.

### Self-hosting scripts (2026-04-14)
`scripts/setup.sh` — checks Docker >= 24 & Compose v2, copies `.env.example` → `.env`, `docker compose up --build -d`, polls up to 120s, runs smoke tests. `scripts/smoke-test.sh` — 8 checks (containers, frontend HTTP 200, API `/health`, nginx proxy, WebSocket, PostgreSQL). `scripts/teardown.sh` — `docker compose down`; `--clean` deletes DB data.

### Environment and deployment docs (2026-04-14)
`.env.example` documents all env vars. `DEPLOYMENT.md` covers local dev, Docker stack, CI/CD, GitHub Secrets, nginx config, troubleshooting.

### Git remotes (2026-04-13)
`origin` → `https://github.com/869kid/vertuta_krutitsya.git`. `upstream` → Pointauc (read-only). Default branch: `main`.

### vertuta-debrief skill (2026-04-12)
`.cursor/skills/vertuta-debrief/SKILL.md` appends session findings here. `.cursor/rules/project-knowledge.mdc` forces every agent to read this file first.

## Conventions

### Import button uses literal string (2026-04-12)
`VariantsPanel` uses hardcoded `'Импорт'` label because `wheel.import` is a nested object (not a leaf key).

### AuthorSelect for owner field (2026-04-13)
`src/shared/ui/AuthorSelect/AuthorSelect.tsx` — Mantine `Combobox` with predefined authors (Катя, Егор, Колян, Жека) + custom names in `localStorage` key `pointauc_custom_authors` via `useAuthorHistory.ts`.

### useSyncExternalStore requires stable getSnapshot (2026-04-13)
If `getSnapshot` returns a new reference each call, React infinite re-renders. Cache parsed result; return same reference when raw data unchanged. Pattern: `src/shared/lib/useAuthorHistory.ts`.

### PowerShell incompatibilities (2026-04-14)
`$(cat <<'EOF' ... EOF)` fails in PowerShell. Use multiple `-m` flags for multi-line git commits. `&&` may fail — use `;`.

## Known Issues & Gotchas

### i18n `wheel.import` is a nested object (2026-04-12)
`t('wheel.import')` renders "[object Object]". Use `t('wheel.import.title')` or a literal string.

### FullWheelUI stores items in useState — use imperative setItems (2026-04-13)
`FullWheelUI` never updates the canvas from prop changes. Push new items via `wheelController.current.setItems(items)`. `WheelPage.tsx` does this in `useEffect(() => { wheelController.current?.setItems(wheelItems); }, [wheelItems])`.

### JSON parser passes unvalidated objects (2026-04-13)
`parseJSON` in `src/domains/auction/archive/lib/parsers/jsonParser.ts` casts array items to `ArchivedLot` without checking for `name`/`amount` fields.

### API_BASE: use `??` not `||` (2026-04-14)
`wheelHubApi.ts` uses `?? 'http://localhost:8080'` — empty string preserved for nginx proxy. `historyApi.ts` uses `|| ''`. **Never** use `|| 'http://localhost:8080'` — empty string from Docker build is intentional.

### nginx:alpine has wget but NOT curl (2026-04-14)
Use `wget --spider -q <url>` for in-container HTTP checks.

### Vite proxy config (2026-04-14)
Proxies `/api` and `/hubs` (with `ws: true`) to `http://localhost:8080`. SignalR client in dev mode builds full URL (bypasses proxy); REST calls use relative paths.

### tsconfig must be ES2022 (2026-04-14)
Required for `.at()` array method used in tests and `VariantItem.tsx`.

### ConfirmRound now passes sessionId (2026-04-15, fixed)
`WheelHub.ConfirmRound` accepts `SessionId` from client. Client passes `historyApi.getSessionId()`. Hub creates/finds Session record automatically. Win records now appear in session-based queries.

### SignalR reconnect re-syncs variant state (2026-04-15, fixed)
`wheelHubApi` uses `connection.onreconnected()` to invoke `GetCurrentState()` hub method, re-syncing `serverVariantsRef` and Redux `slots` after any disconnect.

### Cascade delete broadcasts all children (2026-04-15, fixed)
`RemoveVariant` now collects all descendant IDs via `GetDescendantIds()` and broadcasts `VariantRemoved` for each child before the parent.

## Open Tasks

### Variants accumulate indefinitely (2026-04-14)
Variants not consumed by spins persist in PostgreSQL forever. No TTL or cleanup job.

### Unused Slots reducer actions (2026-04-15)
~13 exported actions (`addSlotAmount`, `setSlotExtra`, `mergeLot`, `setLockedPercentage`, etc.) are legacy from Pointauc auction. They have test coverage in `slotsReducer.test.ts` but are unused in production code. Low priority — keep for now.
