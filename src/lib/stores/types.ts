// Store types for TradeDash

// Timeframe type
export type Timeframe = '15m' | '1h' | '4h' | '8h';

// Chart configuration for individual charts
export interface ChartConfig {
  symbol: string;
  timeframe: Timeframe;
  showEMA9: boolean;
  showEMA21: boolean;
}

// Timeframe store state and actions
export interface TimeframeState {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  nextTimeframe: () => void;
  previousTimeframe: () => void;
}

// Watchlist store state and actions
export interface WatchlistState {
  symbols: string[];
  activeSymbol: string | null;
  isLoading: boolean;
  addSymbol: (symbol: string) => Promise<void>;
  removeSymbol: (symbol: string) => Promise<void>;
  reorderSymbols: (symbols: string[]) => Promise<void>;
  setActiveSymbol: (symbol: string | null) => void;
  loadFromStorage: () => Promise<void>;
}

// Chart store state and actions
export interface ChartState {
  charts: ChartConfig[];
  setChartSymbol: (index: number, symbol: string) => Promise<void>;
  setChartTimeframe: (index: number, timeframe: Timeframe) => void;
  syncAllTimeframes: (timeframe: Timeframe) => void;
  toggleChartEMA9: (index: number) => void;
  toggleChartEMA21: (index: number) => void;
  resetToDefaults: () => void;
  loadFromStorage: () => Promise<void>;
}

// UI store state and actions
export interface UIState {
  sidebarOpen: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setConnectionStatus: (status: UIState['connectionStatus']) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
}

// Settings store state and actions
export interface SettingsState {
  defaultTimeframe: Timeframe;
  chartLayout: '2x2' | '1x4' | '4x1';
  showEMA9: boolean;
  showEMA21: boolean;
  sidebarOpen: boolean;
  updateSettings: (
    settings: Partial<
      Omit<
        SettingsState,
        | 'updateSettings'
        | 'toggleEMA9'
        | 'toggleEMA21'
        | 'setChartLayout'
        | 'loadFromStorage'
      >
    >
  ) => Promise<void>;
  toggleEMA9: () => Promise<void>;
  toggleEMA21: () => Promise<void>;
  setChartLayout: (layout: SettingsState['chartLayout']) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}
