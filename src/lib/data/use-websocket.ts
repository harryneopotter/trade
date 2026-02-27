// React Hook for WebSocket Data Consumption

import { useState, useEffect, useCallback } from 'react';
import { WebSocketClient } from './websocket-client';
import type {
  NormalizedCandle,
  NormalizedTicker,
  WebSocketStatus,
  WebSocketEvent,
} from './types';

export const useWebSocket = () => {
  const [status, setStatus] = useState<WebSocketStatus>(
    WebSocketClient.getStatus()
  );
  const [candleData, setCandleData] = useState<NormalizedCandle[]>([]);
  const [tickerData, setTickerData] = useState<NormalizedTicker[]>([]);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);

  // Initialize WebSocket connection on mount
  useEffect(() => {
    WebSocketClient.init();

    // Set up event listener
    const eventListener = (event: WebSocketEvent) => {
      setEvents((prev) => [...prev.slice(-9), event]); // Keep last 10 events
      setStatus(WebSocketClient.getStatus());
    };

    // Set up data listener
    const dataListener = (data: NormalizedCandle | NormalizedTicker) => {
      if ('timeframe' in data) {
        // Candle data
        setCandleData((prev) => {
          const existingIndex = prev.findIndex(
            (c) =>
              c.symbol === data.symbol &&
              c.timeframe === data.timeframe &&
              c.timestamp === data.timestamp
          );

          if (existingIndex !== -1) {
            // Update existing candle
            return prev.map((c) =>
              c.symbol === data.symbol &&
              c.timeframe === data.timeframe &&
              c.timestamp === data.timestamp
                ? data
                : c
            );
          } else {
            // Add new candle
            return [...prev, data].slice(-1000); // Keep last 1000 candles
          }
        });
      } else {
        // Ticker data
        setTickerData((prev) => {
          const existingIndex = prev.findIndex((t) => t.symbol === data.symbol);

          if (existingIndex !== -1) {
            // Update existing ticker
            return prev.map((t) => (t.symbol === data.symbol ? data : t));
          } else {
            // Add new ticker
            return [...prev, data];
          }
        });
      }
    };

    const eventUnsubscribe = WebSocketClient.addEventListener(eventListener);
    const dataUnsubscribe = WebSocketClient.addDataListener(dataListener);

    return () => {
      eventUnsubscribe();
      dataUnsubscribe();
    };
  }, []);

  // Subscribe to data streams
  const subscribe = useCallback(
    (subscription: {
      symbol: string;
      type: 'candle' | 'ticker';
      timeframe?: string;
      source?: 'binance' | 'bybit';
    }) => {
      WebSocketClient.subscribe({
        symbol: subscription.symbol,
        type: subscription.type,
        timeframe: subscription.timeframe || '1h',
        source: subscription.source || 'binance',
      });
    },
    []
  );

  // Unsubscribe from data streams
  const unsubscribe = useCallback(
    (subscription: {
      symbol: string;
      type: 'candle' | 'ticker';
      timeframe?: string;
      source?: 'binance' | 'bybit';
    }) => {
      WebSocketClient.unsubscribe({
        symbol: subscription.symbol,
        type: subscription.type,
        timeframe: subscription.timeframe || '1h',
        source: subscription.source || 'binance',
      });
    },
    []
  );

  // Get candle data for specific symbol and timeframe
  const getCandles = useCallback(
    (symbol: string, timeframe: string) => {
      return candleData.filter(
        (c) => c.symbol === symbol && c.timeframe === timeframe
      );
    },
    [candleData]
  );

  // Get ticker data for specific symbol
  const getTicker = useCallback(
    (symbol: string) => {
      return tickerData.find((t) => t.symbol === symbol);
    },
    [tickerData]
  );

  return {
    status,
    candleData,
    tickerData,
    events,
    subscribe,
    unsubscribe,
    getCandles,
    getTicker,
  };
};
