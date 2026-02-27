// Custom hook for watchlist data management
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebSocket } from '../../lib/data/use-websocket';
import type { WatchlistItemData } from './types';
import type { NormalizedTicker } from '../../lib/data/types';

interface WatchlistDataMap {
  [symbol: string]: WatchlistItemData;
}

export function useWatchlistData(symbols: string[]) {
  const [watchlistData, setWatchlistData] = useState<WatchlistDataMap>({});
  const { subscribe, unsubscribe, getTicker, tickerData } = useWebSocket();
  const subscribedSymbols = useRef<Set<string>>(new Set());

  // Compute isSubscribed based on symbols length
  const isSubscribed = useMemo(() => symbols.length > 0, [symbols.length]);

  // Subscribe to ticker updates for all watchlist symbols
  useEffect(() => {
    if (symbols.length === 0) {
      return;
    }

    // Subscribe to new symbols
    symbols.forEach((symbol) => {
      if (!subscribedSymbols.current.has(symbol)) {
        subscribe({
          symbol,
          type: 'ticker',
          source: 'binance',
        });
        subscribedSymbols.current.add(symbol);
      }
    });

    // Unsubscribe from symbols no longer in watchlist
    const currentSubscribed = new Set(subscribedSymbols.current);
    currentSubscribed.forEach((symbol) => {
      if (!symbols.includes(symbol)) {
        unsubscribe({
          symbol,
          type: 'ticker',
          source: 'binance',
        });
        subscribedSymbols.current.delete(symbol);

        // Remove from local data
        setWatchlistData((prev) => {
          const updated = { ...prev };
          delete updated[symbol];
          return updated;
        });
      }
    });

    // Cleanup on unmount — capture the ref object (not .current) to satisfy
    // react-hooks/exhaustive-deps: the Set is mutable, so we want the current
    // contents at cleanup time via the same ref object.
    const subscribedRef = subscribedSymbols;
    return () => {
      subscribedRef.current.forEach((symbol) => {
        unsubscribe({
          symbol,
          type: 'ticker',
          source: 'binance',
        });
      });
      subscribedRef.current.clear();
    };
  }, [symbols, subscribe, unsubscribe]);

  // Update watchlist data when ticker data changes - use layout effect pattern
  const pendingTickerData = useRef<NormalizedTicker[]>([]);

  useEffect(() => {
    if (tickerData.length === 0) return;
    pendingTickerData.current = tickerData;

    // Schedule state update in next tick to avoid synchronous setState
    const timeoutId = setTimeout(() => {
      setWatchlistData((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        pendingTickerData.current.forEach((ticker: NormalizedTicker) => {
          if (symbols.includes(ticker.symbol)) {
            const existing = updated[ticker.symbol];

            // Only update if data has changed
            if (
              !existing ||
              existing.price !== ticker.lastPrice ||
              existing.priceChangePercent !== ticker.priceChangePercent
            ) {
              updated[ticker.symbol] = {
                symbol: ticker.symbol,
                price: ticker.lastPrice,
                priceChangePercent: ticker.priceChangePercent,
                high24h: ticker.highPrice24h,
                low24h: ticker.lowPrice24h,
                volume24h: ticker.volume24h,
                lastUpdated: Date.now(),
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [tickerData, symbols]);

  // Get data for a specific symbol (fallback to cached data)
  const getSymbolData = useCallback(
    (symbol: string): WatchlistItemData | null => {
      // First check local state
      const localData = watchlistData[symbol];
      if (localData) return localData;

      // Fallback to WebSocket ticker data
      const ticker = getTicker(symbol);
      if (ticker) {
        return {
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          priceChangePercent: ticker.priceChangePercent,
          high24h: ticker.highPrice24h,
          low24h: ticker.lowPrice24h,
          volume24h: ticker.volume24h,
          lastUpdated: Date.now(),
        };
      }

      return null;
    },
    [watchlistData, getTicker]
  );

  // Refresh data for all symbols
  const refreshData = useCallback(() => {
    symbols.forEach((symbol) => {
      const ticker = getTicker(symbol);
      if (ticker) {
        setWatchlistData((prev) => ({
          ...prev,
          [symbol]: {
            symbol: ticker.symbol,
            price: ticker.lastPrice,
            priceChangePercent: ticker.priceChangePercent,
            high24h: ticker.highPrice24h,
            low24h: ticker.lowPrice24h,
            volume24h: ticker.volume24h,
            lastUpdated: Date.now(),
          },
        }));
      }
    });
  }, [symbols, getTicker]);

  return {
    watchlistData,
    isSubscribed,
    getSymbolData,
    refreshData,
  };
}
