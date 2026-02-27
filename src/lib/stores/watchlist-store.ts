// Watchlist store for TradeDash
import { create } from 'zustand';
import type { WatchlistState } from './types';
import {
  getWatchlist,
  addSymbol as addSymbolToStorage,
  removeSymbol as removeSymbolFromStorage,
  reorderSymbols as reorderSymbolsInStorage,
} from '../storage/watchlist-storage';

// Default watchlist symbols
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: [...DEFAULT_SYMBOLS],
  activeSymbol: DEFAULT_SYMBOLS[0] || null,
  isLoading: false,

  addSymbol: async (symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (!upperSymbol) return;

    const { symbols } = get();
    if (symbols.includes(upperSymbol)) {
      console.log(`Symbol ${upperSymbol} already in watchlist`);
      return;
    }

    set({ isLoading: true });
    try {
      await addSymbolToStorage(upperSymbol);
      set((state) => ({
        symbols: [...state.symbols, upperSymbol],
        isLoading: false,
      }));
    } catch (error) {
      console.error(`Failed to add symbol ${upperSymbol}:`, error);
      set({ isLoading: false });
      throw error;
    }
  },

  removeSymbol: async (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    const { symbols, activeSymbol } = get();

    if (!symbols.includes(upperSymbol)) {
      console.log(`Symbol ${upperSymbol} not in watchlist`);
      return;
    }

    set({ isLoading: true });
    try {
      await removeSymbolFromStorage(upperSymbol);

      const newSymbols = symbols.filter((s) => s !== upperSymbol);
      let newActiveSymbol = activeSymbol;

      // If we removed the active symbol, select another one
      if (activeSymbol === upperSymbol && newSymbols.length > 0) {
        newActiveSymbol = newSymbols[0];
      } else if (newSymbols.length === 0) {
        newActiveSymbol = null;
      }

      set({
        symbols: newSymbols,
        activeSymbol: newActiveSymbol,
        isLoading: false,
      });
    } catch (error) {
      console.error(`Failed to remove symbol ${upperSymbol}:`, error);
      set({ isLoading: false });
      throw error;
    }
  },

  reorderSymbols: async (newOrder: string[]) => {
    const upperOrder = newOrder.map((s) => s.toUpperCase());
    set({ isLoading: true });
    try {
      await reorderSymbolsInStorage(upperOrder);
      set({ symbols: upperOrder, isLoading: false });
    } catch (error) {
      console.error('Failed to reorder symbols:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  setActiveSymbol: (symbol: string | null) => {
    const { symbols } = get();
    // Only set if symbol is null or exists in the watchlist
    if (symbol === null || symbols.includes(symbol.toUpperCase())) {
      set({ activeSymbol: symbol ? symbol.toUpperCase() : null });
    }
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const watchlistItems = await getWatchlist();
      const loadedSymbols = watchlistItems.map((item) => item.symbol);

      if (loadedSymbols.length > 0) {
        set({
          symbols: loadedSymbols,
          activeSymbol: loadedSymbols[0],
          isLoading: false,
        });
      } else {
        // If no stored watchlist, save defaults to storage
        for (const symbol of DEFAULT_SYMBOLS) {
          try {
            await addSymbolToStorage(symbol);
          } catch (error) {
            console.error(`Failed to save default symbol ${symbol}:`, error);
          }
        }
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load watchlist from storage:', error);
      set({ isLoading: false });
    }
  },
}));
