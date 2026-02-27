// Custom hook for chart data management

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Timeframe } from '../../lib/stores/types';
import type { CandleData, LineData, HorizontalLineData } from './types';
import { useWebSocket } from '../../lib/data/use-websocket';
import type { NormalizedCandle } from '../../lib/data/types';
import {
  getLines,
  addLine,
  updateLine,
  removeLine,
  removeAllLines,
} from '../../lib/storage/lines-storage';
import { logger } from '../../lib/utils/logger';

// Timeframe to minutes mapping for aggregation
const TIMEFRAME_MINUTES: Record<Timeframe, number> = {
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '8h': 480,
};

// Base timeframe for WebSocket subscription (lowest granularity)
const BASE_TIMEFRAME: Timeframe = '15m';

// Binance interval string for REST API
const BINANCE_INTERVAL = '15m';

// How many base candles to prefetch from Binance REST API on mount
const HISTORY_LIMIT = 500;

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
  const totalVolume = candles.reduce((sum, c) => sum + (c.volume ?? 0), 0);

  return {
    time: lastCandle.time,
    open: firstCandle.open,
    high: Math.max(...candles.map((c) => c.high)),
    low: Math.min(...candles.map((c) => c.low)),
    close: lastCandle.close,
    volume: totalVolume > 0 ? totalVolume : undefined,
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
    volume: candle.volume,
  };
}

/**
 * Merge historical candles with a live update candle.
 * Replaces the last candle if it has the same timestamp, otherwise appends.
 * Keeps array sorted by time.
 */
function mergeCandle(base: CandleData[], live: CandleData): CandleData[] {
  if (base.length === 0) return [live];
  const last = base[base.length - 1];
  if (last.time === live.time) {
    return [...base.slice(0, -1), live];
  }
  return [...base, live];
}

/**
 * Fetch historical klines from Binance Futures REST API.
 * Returns an empty array on network failure (non-fatal).
 */
async function fetchHistoricalKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<CandleData[]> {
  try {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data: any[] = await res.json();
    return data.map((k) => ({
      time: Math.floor(k[0] / 1000) as number,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
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
  clearAllHorizontalLines: () => Promise<void>;
  refreshLines: () => Promise<void>;
} {
  const { subscribe, unsubscribe, candleData } = useWebSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horizontalLines, setHorizontalLines] = useState<HorizontalLineData[]>(
    []
  );
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Historical candles fetched from REST on mount
  const [historicalCandles, setHistoricalCandles] = useState<CandleData[]>([]);

  // Use a ref to track mounted state
  const isMountedRef = useRef(true);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    const subscription = {
      symbol: symbol.toUpperCase(),
      type: 'candle' as const,
      timeframe: BASE_TIMEFRAME,
      source: 'binance' as const,
    };

    subscribe(subscription);

    return () => {
      isMountedRef.current = false;
      unsubscribe(subscription);
    };
  }, [symbol, subscribe, unsubscribe]);

  // ── Historical klines from REST API (on symbol change) ────────────────────
  useEffect(() => {
    let cancelled = false;

    // Defer state resets to avoid synchronous setState inside effect body
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) {
        setIsLoading(true);
        setHistoricalCandles([]);
      }
    });

    fetchHistoricalKlines(symbol, BINANCE_INTERVAL, HISTORY_LIMIT).then(
      (candles) => {
        if (!cancelled && isMountedRef.current) {
          setHistoricalCandles(candles);
          if (candles.length > 0) setIsLoading(false);
        }
      }
    );

    // Fallback: stop loading spinner after 5 s even if no data
    const t = setTimeout(() => {
      if (!cancelled && isMountedRef.current) setIsLoading(false);
    }, 5000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(t);
    };
  }, [symbol]);

  // ── Merge live WebSocket candles onto historical base ──────────────────────
  const rawCandles = useMemo(() => {
    // Start from the REST-fetched historical candles
    let merged = historicalCandles;

    // Find live candles for this symbol (base timeframe) from WS state
    const live = candleData
      .filter(
        (c) =>
          c.symbol === symbol.toUpperCase() && c.timeframe === BASE_TIMEFRAME
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    // Merge each live update into the historical base
    for (const lc of live) {
      merged = mergeCandle(merged, normalizeToCandleData(lc));
    }

    return merged;
  }, [historicalCandles, candleData, symbol]);

  // ── Load horizontal lines from storage ────────────────────────────────────
  const loadHorizontalLines = useCallback(async () => {
    try {
      const lines = await getLines(symbol, timeframe);
      const lineData: HorizontalLineData[] = lines.map((line) => ({
        id: line.id,
        price: line.price,
        color: line.color,
      }));
      setHorizontalLines(lineData);
    } catch (err) {
      logger.error('Failed to load horizontal lines:', err);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      void loadHorizontalLines();
    });
    return () => cancelAnimationFrame(rafId);
  }, [loadHorizontalLines]);

  // ── Line CRUD ──────────────────────────────────────────────────────────────
  const addHorizontalLine = useCallback(
    async (price: number, color?: string) => {
      try {
        await addLine(symbol, timeframe, price, color);
        await loadHorizontalLines();
      } catch (err) {
        logger.error('Failed to add horizontal line:', err);
        setError('Failed to add horizontal line');
      }
    },
    [symbol, timeframe, loadHorizontalLines]
  );

  const removeHorizontalLine = useCallback(
    async (id: string) => {
      try {
        await removeLine(id);
        await loadHorizontalLines();
      } catch (err) {
        logger.error('Failed to remove horizontal line:', err);
        setError('Failed to remove horizontal line');
      }
    },
    [loadHorizontalLines]
  );

  const updateHorizontalLine = useCallback(
    async (id: string, updates: { price?: number; color?: string }) => {
      try {
        await updateLine(id, updates);
        await loadHorizontalLines();
      } catch (err) {
        logger.error('Failed to update horizontal line:', err);
        setError('Failed to update horizontal line');
      }
    },
    [loadHorizontalLines]
  );

  const clearAllHorizontalLines = useCallback(async () => {
    try {
      await removeAllLines(symbol, timeframe);
      await loadHorizontalLines();
    } catch (err) {
      logger.error('Failed to clear all horizontal lines:', err);
    }
  }, [symbol, timeframe, loadHorizontalLines]);

  // ── Aggregate to selected timeframe ───────────────────────────────────────
  const candles = useMemo(() => {
    if (timeframe === BASE_TIMEFRAME) return rawCandles;
    return aggregateCandles(rawCandles, timeframe, BASE_TIMEFRAME);
  }, [rawCandles, timeframe]);

  // ── EMAs ──────────────────────────────────────────────────────────────────
  const ema9 = useMemo(() => calculateEMA(candles, 9), [candles]);
  const ema21 = useMemo(() => calculateEMA(candles, 21), [candles]);

  // ── Current price from latest candle ──────────────────────────────────────
  useEffect(() => {
    if (candles.length > 0) {
      const latest = candles[candles.length - 1];
      const rafId = requestAnimationFrame(() => {
        setCurrentPrice(latest.close);
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
    clearAllHorizontalLines,
    refreshLines: loadHorizontalLines,
  };
}
