// Storage module exports for TradeDash

// Types
export type {
  WatchlistItem,
  HorizontalLine,
  UserSettings,
  ChartState,
  TradeDashDB,
} from './types';

// Database
export { initDB, getDB, closeDB, deleteDB, type TradeDashDBSchema } from './db';

// Watchlist storage
export {
  getWatchlist,
  addSymbol,
  removeSymbol,
  reorderSymbols,
  hasSymbol,
  clearWatchlist,
} from './watchlist-storage';

// Lines storage
export {
  getLines,
  addLine,
  updateLine,
  removeLine,
  removeAllLines,
  getLineById,
  getAllLines,
} from './lines-storage';

// Settings storage
export {
  getSettings,
  saveSettings,
  resetSettings,
  getSetting,
  hasSettings,
} from './settings-storage';

// Chart state storage
export {
  getChartStates,
  saveChartState,
  getChartStateByIndex,
  removeChartState,
  clearAllChartStates,
  getMostRecentChartState,
} from './chart-state-storage';
