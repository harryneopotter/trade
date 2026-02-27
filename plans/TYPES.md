# TradeDash Type Definitions

This document contains the TypeScript type definitions for all modules in the TradeDash implementation.

## Table of Contents

1. [Timeframe Module](#timeframe-module)
2. [Watchlist Module](#watchlist-module)
3. [Charts Module](#charts-module)
4. [Indicators Module](#indicators-module)
5. [UI Module](#ui-module)
6. [Settings Module](#settings-module)
7. [Storage Module](#storage-module)
8. [Root Store](#root-store)

---

## Timeframe Module

```typescript
// src/modules/timeframe/types.ts

export type Timeframe = '15m' | '1h' | '4h' | '8h';

export interface TimeframeState {
  currentTimeframe: Timeframe;
  availableTimeframes: Timeframe[];
  setTimeframe: (timeframe: Timeframe) => void;
}
```

---

## Watchlist Module

```typescript
// src/modules/watchlist/types.ts

import type { NormalizedTicker } from '../src/lib/data/types';

export interface WatchlistState {
  symbols: string[];
  activeSymbol: string;
  tickers: Record<string, NormalizedTicker>;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  setActiveSymbol: (symbol: string) => void;
  updateTicker: (ticker: NormalizedTicker) => void;
  reorderSymbols: (symbols: string[]) => void;
}

export interface WatchlistItemProps {
  symbol: string;
  ticker: NormalizedTicker | undefined;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  existingSymbols: string[];
}

export interface SymbolSearchResult {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  popularity: number;
}
```

---

## Charts Module

```typescript
// src/modules/charts/types.ts

import type { ISeriesApi, IChartApi, LineStyle } from 'lightweight-charts';
import type { Timeframe } from '../timeframe/types';

export interface HorizontalLine {
  id: string;
  price: number;
  color: string;
  width: number;
  style: LineStyle;
  label: string;
  draggable: boolean;
}

export interface ChartIndicators {
  ema9: boolean;
  ema21: boolean;
}

export interface ChartConfig {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  indicators: ChartIndicators;
  horizontalLines: HorizontalLine[];
}

export interface ChartState {
  charts: ChartConfig[];
  setChartSymbol: (chartId: string, symbol: string) => void;
  setChartTimeframe: (chartId: string, timeframe: Timeframe) => void;
  toggleIndicator: (chartId: string, indicator: 'ema9' | 'ema21') => void;
  addHorizontalLine: (
    chartId: string,
    line: Omit<HorizontalLine, 'id'>
  ) => void;
  removeHorizontalLine: (chartId: string, lineId: string) => void;
  updateHorizontalLine: (
    chartId: string,
    lineId: string,
    updates: Partial<HorizontalLine>
  ) => void;
  syncAllChartsTimeframe: (timeframe: Timeframe) => void;
  syncAllChartsSymbol: (symbol: string) => void;
}

export interface ChartProps {
  chartId: string;
  symbol: string;
  timeframe: Timeframe;
  indicators: ChartIndicators;
  horizontalLines: HorizontalLine[];
  onSymbolChange: (symbol: string) => void;
  onHorizontalLineAdd: (price: number) => void;
  onHorizontalLineMove: (lineId: string, price: number) => void;
  onHorizontalLineRemove: (lineId: string) => void;
}

export interface ChartHeaderProps {
  chartId: string;
  symbol: string;
  timeframe: Timeframe;
  indicators: ChartIndicators;
  onSymbolChange: (symbol: string) => void;
  onIndicatorToggle: (indicator: 'ema9' | 'ema21') => void;
}
```

---

## Indicators Module

```typescript
// src/modules/indicators/types.ts

export interface IndicatorConfig {
  id: string;
  name: string;
  type: 'overlay' | 'oscillator';
  defaultVisible: boolean;
  options: Record<string, unknown>;
}

export interface EMAConfig extends IndicatorConfig {
  period: number;
  color: string;
  width: number;
}

export interface IndicatorToggleProps {
  indicator: 'ema9' | 'ema21';
  isActive: boolean;
  onToggle: () => void;
}
```

---

## UI Module

```typescript
// src/modules/ui/types.ts

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  isMobile: boolean;
  connectionStatus: ConnectionStatus;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setIsMobile: (isMobile: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}
```

---

## Settings Module

```typescript
// src/modules/settings/types.ts

export interface ChartSettings {
  candleType: 'candlestick' | 'heikinashi';
  showVolume: boolean;
  priceScaleMode: 'normal' | 'logarithmic';
}

export interface IndicatorDefaults {
  ema9: { color: string; width: number };
  ema21: { color: string; width: number };
}

export interface SettingsState {
  chartSettings: ChartSettings;
  indicatorDefaults: IndicatorDefaults;
  updateChartSettings: (settings: Partial<ChartSettings>) => void;
  updateIndicatorDefaults: (
    indicator: string,
    settings: Record<string, unknown>
  ) => void;
}
```

---

## Storage Module

```typescript
// src/lib/storage/types.ts

import type {
  HorizontalLine,
  ChartIndicators,
} from '../../modules/charts/types';
import type {
  ChartSettings,
  IndicatorDefaults,
} from '../../modules/settings/types';

export interface WatchlistStorageData {
  id: 'watchlist';
  symbols: string[];
  activeSymbol: string;
  lastUpdated: number;
}

export interface HorizontalLinesStorageData {
  key: string; // `${symbol}_${chartId}`
  symbol: string;
  chartId: string;
  lines: HorizontalLine[];
  lastUpdated: number;
}

export interface SettingsStorageData {
  id: 'settings';
  chartSettings: ChartSettings;
  indicatorDefaults: IndicatorDefaults;
  lastUpdated: number;
}

export interface ChartStateStorageData {
  chartId: string;
  symbol: string;
  indicators: ChartIndicators;
  lastUpdated: number;
}
```

---

## Root Store

```typescript
// src/lib/store/types.ts

import type { WatchlistState } from '../../modules/watchlist/types';
import type { TimeframeState } from '../../modules/timeframe/types';
import type { ChartState } from '../../modules/charts/types';
import type { UIState } from '../../modules/ui/types';
import type { SettingsState } from '../../modules/settings/types';

export interface RootStore {
  watchlist: WatchlistState;
  timeframe: TimeframeState;
  charts: ChartState;
  ui: UIState;
  settings: SettingsState;
}
```

---

## Additional Types

### Chart Event Types

```typescript
// For horizontal line interactions
export interface ChartMouseEvent {
  time: number;
  point: { x: number; y: number };
  price: number;
}

export interface LineDragEvent {
  lineId: string;
  newPrice: number;
}
```

### WebSocket Integration Types

```typescript
// For store integration with WebSocket
export interface WebSocketSubscriptionConfig {
  symbol: string;
  type: 'candle' | 'ticker';
  timeframe?: string;
}
```

### Responsive Breakpoints

```typescript
// src/lib/config/breakpoints.ts

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const BREAKPOINTS: BreakpointConfig = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};
```
