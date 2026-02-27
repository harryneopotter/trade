// Store exports for TradeDash

// Types
export type {
  Timeframe,
  ChartConfig,
  TimeframeState,
  WatchlistState,
  ChartState,
  UIState,
  SettingsState,
} from './types';

// Import stores for initialization
import { initTimeframeStore } from './timeframe-store';
import { useWatchlistStore } from './watchlist-store';
import { useChartStore } from './chart-store';
import { initUIStore } from './ui-store';
import { useSettingsStore } from './settings-store';

// Re-export stores
export { useTimeframeStore, initTimeframeStore } from './timeframe-store';
export { useWatchlistStore } from './watchlist-store';
export { useChartStore } from './chart-store';
export { useUIStore, initUIStore } from './ui-store';
export { useSettingsStore } from './settings-store';

// Initialize all stores from storage
export async function initializeStores(): Promise<void> {
  await Promise.all([
    initTimeframeStore(),
    initUIStore(),
    useSettingsStore.getState().loadFromStorage(),
    useWatchlistStore.getState().loadFromStorage(),
    useChartStore.getState().loadFromStorage(),
  ]);
  console.log('All stores initialized');
}
