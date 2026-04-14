---
name: code-review
description: Review the vertuta_krutitsya codebase for bugs, dead code, missing error handling, and agent-confusing patterns. Use when the user asks to review code, find bugs, check quality, or mentions "проверь код", "code review", "найди баги", "ревью", "что сломано".
---

# Code Review

Systematic review of the vertuta_krutitsya codebase (React/TypeScript frontend + .NET 9 backend with SignalR).

## Key Files to Review

### Frontend (priority order)
1. `src/pages/wheel/WheelPage/WheelPage.tsx` — main page, SignalR connection, all handlers
2. `src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.tsx` — wheel rendering, spin logic
3. `src/api/wheelHubApi.ts` — SignalR client
4. `src/pages/wheel/WheelPage/VariantsPanel.tsx` — variant list UI
5. `src/pages/wheel/WheelPage/VariantItem.tsx` — individual variant
6. `src/utils/roomVariantMapper.ts` — flat DTO ↔ tree Slot[] conversion
7. `src/reducers/Slots/Slots.ts` — Redux state
8. `src/pages/history/HistoryDashboard.tsx` — history page

### Backend
1. `server/Hubs/WheelHub.cs` — SignalR hub (all real-time logic)
2. `server/Program.cs` — server configuration
3. `server/Controllers/` — REST endpoints
4. `server/Models/` — EF entities and DTOs

## Review Checklist

For each file, check:

- [ ] **Logic bugs** — race conditions, null/undefined, missing guards
- [ ] **Dead code** — unused imports, exports, functions, components
- [ ] **Error handling** — SignalR disconnect recovery, API failures, edge cases
- [ ] **Type safety** — `any` types, missing null checks, unsafe casts
- [ ] **Performance** — unnecessary re-renders, missing memoization, N+1 queries
- [ ] **i18n compliance** — hardcoded user-visible strings (should use `t()`)
- [ ] **Security** — input validation, exposed secrets, SQL injection

## Known Agent-Confusing Patterns

These patterns frequently trip up agents. Note them when found:

1. **Dual state**: `serverVariantsRef` (flat DTO[]) and Redux `slots` (tree Slot[]) represent the same data. Both must be updated on any change.
2. **FullWheelUI ignores prop changes**: Items are copied to `useState` on mount. Only `wheelController.current.setItems()` updates the wheel.
3. **onRequestSpin short-circuit**: When provided, `onSpinClick` returns immediately after calling callback — no local spin logic runs.
4. **Vestigial Slots exports**: Only `setSlots`/`setSlotsInitialized`/`createSlot` are used. ~16 other actions are dead code from Pointauc auction.
5. **Dual history sources**: Local Redux `matryoshka.history` vs server `WinRecords`. `HistoryPanel` has a `showServer` toggle.

## Output Format

Organize findings by severity:

### Critical (must fix)
File, line range, description, suggested fix

### Important (should fix)
File, description, impact

### Dead Code (can remove)
File/component, reason it's dead

### Improvements (nice to have)
File, what could be better
