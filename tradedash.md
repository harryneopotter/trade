<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# \# MVP Product Requirements Document

**Personal Multi-Chart Crypto Perps Dashboard**
(Working title: “My4Charts” or “BreakoutLite”)

### 1. Goal of the MVP

Build a lightweight, personal-use, mobile-first (PWA) dashboard that replicates ~80–90% of the daily experience shown in your screenshots, while being:

- cheaper than TradingView long-term (ideally \$0 recurring)
- more flexible in layout/watchlist
- future-proof for gradual feature additions without major rewrites

### 2. MVP Core Scope – must have for first usable version

| \#  | Feature                               | Acceptance criteria / expected behavior                                                                                 | Priority | Estimated complexity |
| :-- | :------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- | :------- | :------------------- |
| 1   | 4 synced charts visible at once       | Grid layout (2×2), resizable panels (desktop), fixed ratio mobile. All charts show same symbol \& timeframe by default. | ★★★★★    | medium               |
| 2   | Watchlist (10–30 symbols)             | List like your screenshot: symbol, last price, 24h % change. Tap to load into all 4 charts. Persisted locally.          | ★★★★★    | low                  |
| 3   | Real-time price \& candle updates     | Smooth updates via websocket (Binance public as primary). At least 1h candles + volume bars.                            | ★★★★★    | medium-high          |
| 4   | Timeframe switching                   | Global selector: 15m, 1h, 4h, 8h (native where available, aggregated otherwise). Affects all 4 charts.                  | ★★★★½    | medium               |
| 5   | Basic indicators (start with 2)       | EMA9 + EMA21 on main chart (overlay). Toggleable.                                                                       | ★★★★     | medium               |
| 6   | Mobile-first PWA                      | Installable, works offline (cached last data), responsive portrait \& landscape. Dark mode only.                        | ★★★★½    | medium               |
| 7   | Lightweight on desktop with many tabs | Target RAM usage < 600 MB with 4 charts open. Fast startup after first load.                                            | ★★★★     | ongoing              |
| 8   | Simple horizontal price lines         | Click to add/remove horizontal line + label on any chart. Persisted per symbol/timeframe.                               | ★★★      | medium               |

### 3. Explicit non-goals for MVP (save for later)

- Sub-1 minute timeframes
- RSI, MACD, Bollinger, VWAP, etc. (add gradually)
- Alerts / notifications
- Multiple independent timeframes per chart
- Order book / depth / funding rate pane
- Backtesting / strategy tester
- Multi-exchange symbol normalization (use Binance symbols as canonical for MVP)
- Custom drawing tools beyond horizontals
- Light mode / themes
- User accounts / cloud sync

### 4. Technical \& Architectural Guidelines for future expansion

| Area                      | MVP choice / recommendation                                  | Why this choice helps future expansion                                    |
| :------------------------ | :----------------------------------------------------------- | :------------------------------------------------------------------------ |
| Frontend framework        | React 19 + Vite + TypeScript                                 | Fast HMR, small bundle, huge ecosystem for later features                 |
| Charting library          | TradingView Lightweight Chart (open-source)                  | Very close visual match, good perf, well-documented, community extensions |
| State management          | Zustand (or Jotai) + URL sync for symbol/timeframe           | Easy to scale to more complex state without boilerplate                   |
| Data layer                | WebSocket → in-memory cache → chart feed                     | Easy to swap to Redis / IndexedDB / Supabase later                        |
| Primary data source       | Binance public WebSocket (klines, trades, tickers)           | Most complete free coverage, generous limits, easy to add Bybit/OKX later |
| Backup / fallback         | Bybit public WS (at least for tickers)                       | Redundancy without paid tier                                              |
| Persistence               | IndexedDB + localStorage                                     | Survives browser close/reopen, easy to upgrade to cloud sync later        |
| Build \& deployment       | Vite PWA plugin → static host (Vercel/Netlify/GitHub Pages)  | Zero server cost for MVP, trivial to move to own VPS later                |
| Folder / module structure | Feature-based + shared utils (charts / data / ui / services) | Scales well when adding indicators, alerts, new data sources              |

### 5. Rough phased roadmap after MVP (not commitment, just direction)

| Phase | Name                      | Rough content                                                              | Estimated effort |
| :---- | :------------------------ | :------------------------------------------------------------------------- | :--------------- |
| 1     | Polish \& comfort         | RSI/MACD, better reconnect, mobile UX polish, 4h/8h aggregation if needed  | 4–12 weeks       |
| 2     | Reliability               | Multiple exchange fallback, offline mode improvements, error reporting     | 4–10 weeks       |
| 3     | Expansion                 | Alerts (price cross), more indicators, per-chart timeframe, custom layouts | 2–8 months       |
| 4     | Serious trading (if ever) | Sub-1min, tick-level, orderbook, paid normalized feed, backtesting basics  | 6–18+ months     |

### 6. Success criteria for MVP release (when can you call it “good enough to use daily”)

- Can load your current watchlist in < 5 seconds (cached)
- 4 charts update smoothly on 1h timeframe with EMA9/21
- Watchlist tap → instant symbol change across all charts
- Survives phone sleep / browser tab suspension reasonably
- Feels lighter/faster than official TradingView mobile app on your iQOO 15
- Uses < 600 MB RAM on desktop with 4 charts open
- No critical websocket disconnects longer than ~15–30 seconds during normal market hours

I understand the vision here—this is a solid MVP spec for a personal crypto perps dashboard that trades breadth for depth, focusing on your specific daily workflow (4 charts, watchlist, basic indicators, mobile-first PWA).

Let me clarify a few things before I propose a build plan and architecture:

## Clarifying Questions

1. **Data source preference / redundancy:**
   - You've listed Binance + Bybit as fallback. Do you want automatic fallover (if Binance WS drops, switch to Bybit), or explicit manual switching?
   - Any preference between Binance Futures (`fstream.binance.com`) vs Spot (`stream.binance.com`) for klines/tickers? (I assume Futures since you mentioned "perps")
2. **Chart library visual fidelity:**
   - TradingView Lightweight Chart is the spec choice, but it's lighter than what you showed in your screenshots. Are you okay with a more minimalist chart UI (no fancy animations, volume bars in grayscale), or should I explore slightly heavier alternatives like `Chart.js` or `Recharts` that might give you closer visual parity?
   - Do you need point-and-click drawing tools (trend lines, boxes) in MVP, or just horizontal lines + labels?
3. **Mobile experience specifics:**
   - Tap-to-switch chart? Or swipe between 4 charts one-by-one on mobile?
   - Portrait mode: all 4 charts stacked vertically (tall scroll), or 2×2 with zoom/scroll?
4. **Persistence \& offline:**
   - How long should offline data be cached? (e.g., can the app work offline for 30 mins with last-seen prices, or full chart history?)
   - Should watchlist/lines persist across sessions automatically, or only on deliberate "save"?
5. **Performance baseline:**
   - Your iQOO 15 has a solid chipset—should I target 60 FPS on all animations, or is 30–45 FPS acceptable if it saves RAM?
   - Is 600 MB RAM ceiling firm, or soft target? (affects whether we cache full 1h history vs rolling window)
6. **Indicators \& extensibility:**
   - EMA9/21 only for MVP, understood. But should the indicator system be architected so you can add RSI/MACD/BB later with <1 hour of work per indicator?
   - Do you want visual indicator settings (color, thickness, opacity) persisted, or hardcoded?
7. **Deployment \& hosting:**
   - Vercel/Netlify (easiest, free, no server ops)?
   - Or your own VPS with a lightweight backend (Go/Node) for future API extensions?
   - PWA installable locally vs web-only initially?

---

# 1. automatic sounds good. yeah futures is fine.

2. can I see a version of both? and for now, just lines and labels are fine
3. either will do. all 4 charts occupying 25% of the screen each.
4. As long as it is needed, 15 mins may be? persists across sessions automatically
5. yeah if it helps with RAM. soft target
6. correct. persisted.
7. can be anything.. will see when it is done. but backend if needed can be handled. no worries. either is fine
