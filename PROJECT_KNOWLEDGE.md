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

### Collapsible wheel settings panel (2026-04-13)
`WheelSettings.tsx` (`src/domains/winner-selection/wheel-of-random/settings/ui/Form/WheelSettings.tsx`) has a gear icon (`IconSettings`, `size='xl' radius='md' variant='outline'` — matching the soundtrack button style) in the top controls row. It toggles a Mantine `<Collapse>` around all settings below (Wheel Style, format, dividing, randomness source, CoreImageField). Default state is **collapsed** (`useDisclosure(false)`). The `SimpleGrid` wrapper was removed since `CoreImageField` moved inside the Collapse. The `direction` prop on `WheelSettingsProps` is still in the interface but no longer destructured or used — it can be removed from callers too.

### Controls row vertical alignment with variant cards (2026-04-13)
`.wheel-controls` in `src/domains/winner-selection/wheel-of-random/ui/FullWheelUI/index.module.css` has `padding-top: 30px` to align the Spin/Duration row with the top of the variant cards on the left (accounting for the "Варианты" title height).

## Data & Formats

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

### JSON parser passes garbage objects through without validation (2026-04-13)
`parseJSON` in `src/domains/auction/archive/lib/parsers/jsonParser.ts` casts non-string array items directly to `ArchivedLot` without checking they have `name`/`amount` fields. Malformed JSON like `[{"garbage": true}]` will produce invalid lot objects that may cause crashes later in the pipeline.

## Open Tasks

### CI workflow still references `master` (2026-04-13)
`.github/workflows/deploy-production.yml` triggers on `push.branches: [master]`. Now that the default branch is `main`, the workflow will never trigger. Change the trigger to `main` when ready to use CI.
