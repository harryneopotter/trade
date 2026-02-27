# TradeDash — Next Steps for Coding Agent

This file is for a coding agent to take the project from **current broken WIP** to **build-clean baseline**.

## Context Snapshot

- Repo: `/home/sachin/work/trade`
- Stack: React + TypeScript + Vite
- Current blockers:
  - `pnpm build` fails with TypeScript errors (mainly horizontal line chart code)
  - `pnpm lint` fails with Prettier + TS + ESLint issues
- Current branch state: no commits yet (everything untracked)

---

## Mission

Fix the project to a verifiable baseline:

1. `pnpm build` passes
2. `pnpm lint` passes (or warnings only; no errors)
3. App runs (`pnpm dev`) without runtime crashes in chart module
4. Document what changed and why

---

## Phase 0 — Setup & Safety

1. Use this repo as workdir.
2. Create a working branch for traceability:
   - `git checkout -b fix/build-lint-stabilization`
3. Capture baseline outputs into files:
   - `pnpm build > .agent-build-before.log 2>&1 || true`
   - `pnpm lint > .agent-lint-before.log 2>&1 || true`

Definition of done for this phase: branch created + baseline logs saved.

---

## Phase 1 — Unblock TypeScript Build (highest priority)

Focus files from current errors:

- `src/modules/charts/horizontal-line-manager.ts`
- `src/modules/charts/tradingview-chart.tsx`
- `src/modules/charts/use-horizontal-lines.ts`
- `src/modules/charts/line-controls.tsx`

### 1.1 Fix Lightweight Charts v5 typing mismatch

Symptoms seen:

- `color` property rejected in a generic `SeriesDefinition`
- `ISeriesApi<keyof SeriesOptionsMap...>` incompatible with expected line series type

Likely cause:

- Using generic `addSeries(...)` or broad series typing where explicit line series API is required.

Required fix:

- Refactor to explicit line series creation APIs and explicit line series types.
- Ensure horizontal-line series variables are typed as line series only.
- Remove assumptions that any `IChartApi` can `getSeries()` (unsupported in current typings).

Expected outcome:

- No TS errors around `color` in series options.
- No TS errors around series API incompatibility.

### 1.2 Resolve missing props / API drift between components

Symptoms:

- `updateHorizontalLine` missing from hook return in `tradingview-chart.tsx`
- `horizontalLines` prop mismatch in `ChartHeaderProps`

Required fix:

- Align component contract across:
  - `use-chart-data.ts`
  - `tradingview-chart.tsx`
  - `chart-header.tsx` + `types.ts`
- Either add missing function/props where intended, or remove stale references if feature moved.
- Keep behavior coherent (line updates should still work from UI controls if feature exists).

Expected outcome:

- All cross-file type contracts compile cleanly.

### 1.3 Remove TS strictness blockers

Symptoms:

- Unused imports/vars (e.g., `ISeriesApi`, `symbol`)
- implicit `any` in callbacks
- `null` vs `undefined` mismatches

Required fix:

- Remove dead imports/vars.
- Add explicit callback typings.
- Normalize optional return values to expected union types.

Expected outcome:

- `pnpm build` completes successfully.

---

## Phase 2 — Lint/Prettier stabilization

Once build is green, handle lint errors.

### 2.1 Autofix first

Run:

- `pnpm lint:fix`
- `pnpm format`

### 2.2 Manual cleanup

Address remaining lint errors manually, especially in:

- `use-horizontal-lines.ts`
- `line-controls.tsx`
- `tradingview-chart.tsx`
- `vite.config.ts`

Important:

- `no-console` currently emits many warnings. Keep warnings acceptable for now unless policy requires zero warnings.
- Do not suppress errors blindly; prefer code-level fixes.

Expected outcome:

- `pnpm lint` returns zero errors.

---

## Phase 3 — Runtime sanity checks

1. Start dev server: `pnpm dev`
2. Validate manually (or script if available):
   - App loads without blank screen
   - 2x2 charts render
   - WebSocket data updates candles
   - Add/remove horizontal line works
   - No crash when changing timeframe/symbol (if supported)

Capture any remaining runtime issues in `HISTORY.md` under a new dated section.

---

## Phase 4 — Deliverables

Create/update these artifacts:

1. `HISTORY.md` with:
   - exact fixes
   - files changed
   - before/after status
2. `next-steps.md` (this file) checkboxes updated to done
3. Optional: `.agent-summary.md` with concise handoff

Also record final command outputs:

- `pnpm build > .agent-build-after.log 2>&1`
- `pnpm lint > .agent-lint-after.log 2>&1`

---

## Execution Checklist

- [x] Branch created (`fix/build-lint-stabilization`)
- [x] Baseline logs captured
- [x] TypeScript build errors fixed
- [x] `pnpm build` passes
- [x] Lint errors fixed (warnings acceptable unless specified)
- [x] `pnpm lint` passes with zero errors
- [x] Runtime chart sanity checks done
- [x] `HISTORY.md` updated with changes
- [x] After logs captured

## Phase 2-4 Complete ✅

All phases completed. Build passes, lint has zero errors (98 warnings acceptable), dev server verified.

### Deliverables

- `.agent-lint-after.log` - Final lint output (0 errors, 98 warnings)
- `.agent-build-after.log` - Final build output (successful)
- `HISTORY.md` - Updated with Phase 2-4 section dated 2026-02-27

---

## Notes for Agent Behavior

- Prioritize correctness over cosmetic refactors.
- Keep changes surgical in chart module first.
- Avoid broad rewrites unless absolutely necessary.
- If a design decision is ambiguous (e.g., whether `ChartHeader` should own line state), pick one approach and document rationale in `HISTORY.md`.
