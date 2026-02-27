# Build Plan: Personal Multi-Chart Crypto Perps Dashboard

## Overview

Goal: deliver a PWA that mirrors the current 4-chart workflow with watchlist, synced timeframes, EMA overlays, and offline resilience. Stack: React 19 + Vite + TypeScript, TradingView Lightweight Charts, Zustand (state), IndexedDB/localStorage persistence, Binance Futures WebSocket primary with Bybit fallback. Hosting target: Vercel/Netlify static deploy.

## Architecture Foundations

- `src/app` shell renders responsive 2×2 grid with service worker bootstrap.
- Feature modules under `src/modules/{charts,watchlist,timeframe,indicators,settings}`; shared utilities in `src/lib`.
- Data layer encapsulated in `src/lib/data` exposing WebSocket hooks, reconnection w/ exponential backoff, and Bybit fallback toggle.
- Persistence helpers in `src/lib/storage` abstract IndexedDB + localStorage for settings, watchlist, and horizontal line annotations.
- `public/` contains manifest, icons, and offline fallback page; service worker pre-caches static assets and last known candle cache.

## User Stories & Success Criteria

| ID                           | User Story                                                                                          | Success Criteria                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| US-01 Layout                 | As a trader, I want a responsive 2×2 grid that keeps all four charts visible on desktop and mobile. | Layout renders <1s, min chart height 250px, mobile quadrants each occupy 25% viewport, Lighthouse responsive score ≥95.             |
| US-02 Settings Persistence   | As a user, I need indicator and theme toggles to persist between sessions.                          | IndexedDB read/write <50ms, reload restores toggles, cache clear resets state.                                                      |
| US-03 Watchlist Sync         | As a trader, I want a watchlist of 10–30 symbols that syncs across charts on tap.                   | Add/remove <100ms, tap updates all charts within 200ms, persisted offline, handles empty state gracefully.                          |
| US-04 Realtime Data          | As a user, I want live price and 24h change updates.                                                | WebSocket refresh every ≤2s, reconnect within 5s, auto failover to Bybit after 3 failed attempts.                                   |
| US-05 Chart Rendering        | As a trader, I want four synchronized charts with EMA9/EMA21 overlays.                              | 200 candles render under 600 MB RAM, indicator toggles apply <100ms, time axis stays in sync.                                       |
| US-06 Horizontal Lines       | As a user, I want to add/remove labeled horizontal lines per symbol/timeframe.                      | Click adds/removes line, persisted per symbol/timeframe, reload restores lines within 150ms.                                        |
| US-07 Timeframe Control      | As a trader, I want a global timeframe selector (15m/1h/4h/8h).                                     | Selector updates charts <150ms, aggregated 8h candles when absent, loading states prevent double triggers.                          |
| US-08 Offline/PWA            | As a mobile user, I want an installable app that works offline for 15 minutes.                      | Manifest passes Lighthouse PWA audit, service worker caches last 200 candles + static assets, offline visits show cached dashboard. |
| US-09 Extensible Indicators  | As a developer, I want a pluggable indicator interface for future RSI/MACD.                         | New indicator requires <50 LOC, config stored in `src/modules/indicators`, toggles persisted.                                       |
| US-10 Security & Performance | As a maintainer, I need safe reconnections and validated user input.                                | Reconnects throttled to ≤5/min, only valid Binance symbols accepted, no console warnings/errors in production build.                |

## Task Breakdown & Estimates

| Phase                 | Task                                                                                                                              | Estimate |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1 Scaffold            | Initialize Vite + React 19 + TS + PWA plugin, set up pnpm scripts, configure ESLint/Prettier, add base routing + layout scaffold. | 1.5 days |
| 1 Env Config          | Implement `src/lib/config/env.ts`, document API endpoints, set up `.env.example`.                                                 | 0.5 day  |
| 2 Data Layer          | Build Binance WebSocket client with reconnect/backoff, Bybit fallback, normalized candle payloads, typed hooks.                   | 2 days   |
| 2 Persistence         | Create storage helpers for watchlist, settings, lines; add IndexedDB schema + migrations.                                         | 1 day    |
| 3 Watchlist Module    | UI list with add/remove, real-time price/24h change display, tap-to-sync charts, offline snapshot handling.                       | 1.5 days |
| 3 Timeframe Control   | Global selector component + Zustand slice to broadcast timeframe to charts, loading states.                                       | 0.5 day  |
| 4 Charts Module       | Render four Lightweight charts, integrate indicators, shared cursor/time sync, responsive grid behavior.                          | 3 days   |
| 4 Horizontal Lines    | Add drawing interactions, persistence per symbol/timeframe, undo/remove UX.                                                       | 1 day    |
| 5 PWA & Offline       | Service worker caching strategy, manifest tuning, offline fallback page, Lighthouse audits.                                       | 1.5 days |
| 5 Testing             | Vitest unit coverage (>80% for data + store modules), Playwright smoke tests for watchlist/timeframe/offline install.             | 2 days   |
| 6 Polish & Deployment | Performance profiling (RAM, load time), finalize docs, set up Vercel/Netlify pipeline, write release checklist.                   | 1 day    |

Total estimated effort: ~15 days (one engineer). Adjust for parallelization if needed.

## Dependencies & Notes

- Need Binance Futures WebSocket credentials (public) and optional Bybit backup endpoints configured before Phase 2.
- TradingView Lightweight Charts license (OSS) verified; ensure theme aligns with dark mode spec.
- Coordinate with design for mobile spacing before final polish. Update `tradedash.md` after each completed phase.
