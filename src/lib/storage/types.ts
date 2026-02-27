// Storage Types for TradeDash

/**
 * Watchlist item stored in IndexedDB
 */
export interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: number;
  order: number;
}

/**
 * Horizontal line stored in IndexedDB
 */
export interface HorizontalLine {
  id: string;
  symbol: string;
  timeframe?: string; // e.g. '15m', '1h', '4h', '8h' — optional for backward compat
  price: number;
  color: string;
  createdAt: number;
}

/**
 * User settings stored in IndexedDB
 */
export interface UserSettings {
  id: 'user-settings';
  defaultTimeframe: '15m' | '1h' | '4h' | '8h';
  chartLayout: '2x2' | '1x4' | '4x1';
  showEMA9: boolean;
  showEMA21: boolean;
  sidebarOpen: boolean;
  lastUpdated: number;
}

/**
 * Chart state stored in IndexedDB
 */
export interface ChartState {
  id: string;
  chartIndex: number;
  symbol: string;
  lastViewedAt: number;
}

/**
 * Database schema type definitions for idb
 */
export interface TradeDashDB {
  watchlist: WatchlistItem;
  horizontalLines: HorizontalLine;
  settings: UserSettings;
  chartState: ChartState;
}
