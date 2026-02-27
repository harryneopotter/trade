# Repository Guidelines

## Project Structure & Module Organization

Code lives under `src/` using a feature-first layout: `src/modules/charts`, `src/modules/watchlist`, and shared utilities in `src/lib`. Routing or shell components belong in `src/app`. Static assets (icons, manifest, service worker) sit under `public/`, while integration specs and accessibility checks belong in `tests/`. The current product spec resides in `tradedash.md`; keep it updated when new features land.

## Build, Test, and Development Commands

Run `pnpm install` once to pull dependencies. Use `pnpm dev` for Vite + React 19 local development (PWA service worker auto-refreshes). Before pushing, run `pnpm test` (unit + hooks) and `pnpm lint` (ESLint + TypeScript). Produce production bundles with `pnpm build`; artifacts drop into `dist/` for deployment to Vercel/Netlify.

## Coding Style & Naming Conventions

Stick to TypeScript with 2-space indent and semicolons on. Favor functional React components with hooks; colocate Zustand/Jotai stores next to their feature modules. Name files kebab-case (`watchlist-panel.tsx`), hooks/use stores as `useX`. Shared configs live in `src/lib/config`. Run `pnpm lint --fix` before committing; it also applies Prettier formatting.

## Testing Guidelines

Unit tests use Vitest; place specs beside code as `file.test.ts`. For end-to-end smoke flows (PWA install, offline cache), add Playwright scripts in `tests/e2e/`. Maintain >80% coverage on modules touching WebSocket/state sync. When reproducing bugs, add regression tests named after the issue (`watchlist-sync-#123.test.ts`).

## Commit & Pull Request Guidelines

Follow Conventional Commits (`feat:`, `fix:`, `chore:`). Imperative tense, 72-char subject, optional body for context. Every PR should link to the relevant roadmap item from `tradedash.md`, summarize functional changes, list test commands, and attach mobile + desktop screenshots for UI shifts. Draft PRs are fine, but move to ready once lint/tests pass.

## Security & Configuration Tips

Keep API keys out of the repo; WebSocket endpoints should load from `src/lib/config/env.ts`. Validate all user input when new drawing tools arrive, and never persist PII in IndexedDB. For Binance/Bybit sockets, throttle reconnection attempts to avoid rate limits and log failures to the browser console for quick triage.
