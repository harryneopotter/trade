// Custom hook for chart data management

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Timeframe } from '../../lib/stores/types';
import type { CandleData, LineData, HorizontalLineData } from './types';
import { useWebSocket } from '../../lib/data/use-websocket';
import { DataService } from '../../lib/data/data-service';
import type { NormalizedCandle } from '../../lib/data/types';
import {
  getLines,
  addLine,
  updateLine,
  removeLine,
} from '../../lib/storage/lines-storage';

// Timeframe to minutes mapping for aggregation
const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '8h': 480,
};

// Base timeframe for WebSocket subscription (lowest granularity)
const BASE_TIMEFRAME: Timeframe = '15m';

/**
 * Calculate EMA values from candle data
 */
function calculateEMA(candles: CandleData[], period: number): LineData[] {
  if (candles.length < period) return [];

  const ema: LineData[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let previousEMA = sum / period;
  ema.push({
    time: candles[period - 1].time,
    value: previousEMA,
  });

  // Calculate EMA for remaining candles
  for (let i = period; i < candles.length; i++) {
    const currentEMA =
      (candles[i].close - previousEMA) * multiplier + previousEMA;
    ema.push({
      time: candles[i].time,
      value: currentEMA,
    });
    previousEMA = currentEMA;
  }

  return ema;
}

/**
 * Aggregate candles to a higher timeframe
 */
function aggregateCandles(
  candles: CandleData[],
  targetTimeframe: Timeframe,
  baseTimeframe: Timeframe = BASE_TIMEFRAME
): CandleData[] {
  if (candles.length === 0) return [];
  if (targetTimeframe === baseTimeframe) return candles;

  const baseMinutes = TIMEFRAME_MINUTES[baseTimeframe];
  const targetMinutes = TIMEFRAME_MINUTES[targetTimeframe];
  const aggregationFactor = targetMinutes / baseMinutes;

  if (aggregationFactor <= 1) return candles;

  const aggregated: CandleData[] = [];
  let currentBucket: CandleData[] = [];
  let bucketStartTime: number | null = null;

  for (const candle of candles) {
    const candleDate = new Date(candle.time * 1000);
    let bucketStart: number;

    // Calculate bucket start based on target timeframe
    if (targetTimeframe === '4h') {
      const hours = candleDate.getUTCHours();
      const bucketHour = Math.floor(hours / 4) * 4;
      bucketStart = new Date(candleDate).setUTCHours(bucketHour, 0, 0, 0);
    } else if (targetTimeframe === '8h') {
      const hours = candleDate.getUTCHours();
      const bucketHour = Math.floor(hours / 8) * 8;
      bucketStart = new Date(candleDate).setUTCHours(bucketHour, 0, 0, 0);
    } else if (targetTimeframe === '1h') {
      bucketStart = new Date(candleDate).setUTCMinutes(0, 0, 0);
    } else {
      bucketStart = candle.time * 1000;
    }

    if (bucketStartTime === null || bucketStart !== bucketStartTime) {
      // Finalize previous bucket
      if (currentBucket.length > 0) {
        aggregated.push(createAggregatedCandle(currentBucket));
      }
      // Start new bucket
      currentBucket = [candle];
      bucketStartTime = bucketStart;
    } else {
      currentBucket.push(candle);
    }
  }

  // Finalize last bucket
  if (currentBucket.length > 0) {
    aggregated.push(createAggregatedCandle(currentBucket));
  }

  return aggregated;
}

/**
 * Create an aggregated candle from multiple candles
 */
function createAggregatedCandle(candles: CandleData[]): CandleData {
  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  return {
    time: lastCandle.time,
    open: firstCandle.open,
    high: Math.max(...candles.map((c) => c.high)),
    low: Math.min(...candles.map((c) => c.low)),
    close: lastCandle.close,
  };
}

/**
 * Convert normalized candle to chart candle format
 */
function normalizeToCandleData(candle: NormalizedCandle): CandleData {
  return {
    time: Math.floor(candle.timestamp / 1000),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

/**
 * Hook for managing chart data including candles, EMAs, and horizontal lines
 */
export function useChartData(
  symbol: string,
  timeframe: Timeframe
): {
  candles: CandleData[];
  ema9: LineData[];
  ema21: LineData[];
  horizontalLines: HorizontalLineData[];
  isLoading: boolean;
  error: string | null;
  currentPrice: number | null;
  addHorizontalLine: (price: number, color?: string) => Promise<void>;
  removeHorizontalLine: (id: string) => Promise<void>;
  updateHorizontalLine: (
    id: string,
    updates: { price?: number; color?: string }
  ) => Promise<void>;
  refreshLines: () => Promise<void>;
} {
  const { subscribe, unsubscribe, getCandles } = useWebSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horizontalLines, setHorizontalLines] = useState<HorizontalLineData[]>(
    []
  );
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [rawCandles, setRawCandles] = useState<CandleData[]>([]);

  // Use refs to track mounted state and prevent memory leaks
  const isMountedRef = useRef(true);
  const subscriptionRef = useRef<{
    symbol: string;
    timeframe: Timeframe;
  } | null>(null);

  // Subscribe to WebSocket data on mount and when symbol/timeframe changes
  useEffect(() => {
    isMountedRef.current = true;

    // Use requestAnimationFrame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      setIsLoading(true);
      setError(null);
    });

    // Subscribe to base timeframe for data
    const subscription = {
      symbol: symbol.toUpperCase(),
      type: 'candle' as const,
      timeframe: BASE_TIMEFRAME,
      source: 'binance' as const,
    };

    subscriptionRef.current = { symbol, timeframe };
    subscribe(subscription);

    // Load initial data from cache
    const loadInitialData = () => {
      try {
        const cachedCandles = DataService.getCandlesFromCache(
          symbol.toUpperCase(),
          BASE_TIMEFRAME
        );

        if (cachedCandles.length > 0 && isMountedRef.current) {
          const candleData = cachedCandles.map(normalizeToCandleData);
          setRawCandles(candleData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load cached data:', err);
      }
    };

    loadInitialData();

    // Simulate loading complete after a timeout if no data arrives
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafId);
      clearTimeout(loadingTimeout);
      unsubscribe(subscription);
    };
  }, [symbol, timeframe, subscribe, unsubscribe]);

  // Poll for new candle data from WebSocket
  useEffect(() => {
    const intervalId = setInterval(() => {
      const candles = getCandles(symbol.toUpperCase(), BASE_TIMEFRAME);
      if (candles.length > 0) {
        const candleData = candles.map(normalizeToCandleData);
        setRawCandles(candleData);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [getCandles, symbol]);

  // Load horizontal lines from storage
  const loadHorizontalLines = useCallback(async () => {
    try {
      const lines = await getLines(symbol);
      const lineData: HorizontalLineData[] = lines.map((line) => ({
        id: line.id,
        price: line.price,
        color: line.color,
      }));
      setHorizontalLines(lineData);
    } catch (err) {
      console.error('Failed to load horizontal lines:', err);
    }
  }, [symbol]);

  // Load horizontal lines on mount and symbol change
  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      void loadHorizontalLines();
    });

    return () => cancelAnimationFrame(rafId);
  }, [loadHorizontalLines]);

  // Add a horizontal line
  const addHorizontalLine = useCallback(
    async (price: number, color?: string) => {
      try {
        await addLine(symbol, price, color);
        await loadHorizontalLines();
      } catch (err) {
        console.error('Failed to add horizontal line:', err);
        setError('Failed to add horizontal line');
      }
    },
    [symbol, loadHorizontalLines]
  );

  // Remove a horizontal line
  const removeHorizontalLine = useCallback(
    async (id: string) => {
      try {
        await removeLine(id);
        await loadHorizontalLines();
      } catch (err) {
        console.error('Failed to remove horizontal line:', err);
        setError('Failed to remove horizontal line');
      }
    },
    [loadHorizontalLines]
  );

  // Update a horizontal line
  const updateHorizontalLine = useCallback(
    async (id: string, updates: { price?: number; color?: string }) => {
      try {
        await updateLine(id, updates);
        await loadHorizontalLines();
      } catch (err) {
        console.error('Failed to update horizontal line:', err);
        setError('Failed to update horizontal line');
      }
    },
    [loadHorizontalLines]
  );

  // Aggregate candles if needed
  const candles = useMemo(() => {
    if (timeframe === BASE_TIMEFRAME) {
      return rawCandles;
    }
    return aggregateCandles(rawCandles, timeframe, BASE_TIMEFRAME);
  }, [rawCandles, timeframe]);

  // Calculate EMAs
  const ema9 = useMemo(() => {
    return calculateEMA(candles, 9);
  }, [candles]);

  const ema21 = useMemo(() => {
    return calculateEMA(candles, 21);
  }, [candles]);

  // Update current price from latest candle using requestAnimationFrame
  useEffect(() => {
    if (candles.length > 0) {
      const latestCandle = candles[candles.length - 1];
      const rafId = requestAnimationFrame(() => {
        setCurrentPrice(latestCandle.close);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [candles]);

  return {
    candles,
    ema9,
    ema21,
    horizontalLines,
    isLoading,
    error,
    currentPrice,
    addHorizontalLine,
    removeHorizontalLine,
    updateHorizontalLine,
    refreshLines: loadHorizontalLines,
  };
}
