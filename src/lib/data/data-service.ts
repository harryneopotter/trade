// Data Service Layer for TradeDash
// Provides caching, aggregation, and additional data processing

import { ENV_CONFIG } from '../config/env';
import type { NormalizedCandle, NormalizedTicker } from './types';

// In-memory cache for candles and tickers
let candleCache: Record<string, NormalizedCandle[]> = {};
let tickerCache: Record<string, NormalizedTicker> = {};

// Cache key generation
const getCandleCacheKey = (symbol: string, timeframe: string) =>
  `${symbol}_${timeframe}`;

// Add candle to cache
const addCandleToCache = (candle: NormalizedCandle) => {
  const key = getCandleCacheKey(candle.symbol, candle.timeframe);

  if (!candleCache[key]) {
    candleCache[key] = [];
  }

  // Check if candle already exists (update if it does)
  const existingIndex = candleCache[key].findIndex(
    (c) => c.timestamp === candle.timestamp
  );

  if (existingIndex !== -1) {
    candleCache[key][existingIndex] = candle;
  } else {
    candleCache[key].push(candle);
  }

  // Limit cache size
  if (candleCache[key].length > ENV_CONFIG.MAX_CACHED_CANDLES) {
    candleCache[key] = candleCache[key].slice(-ENV_CONFIG.MAX_CACHED_CANDLES);
  }
};

// Add ticker to cache
const addTickerToCache = (ticker: NormalizedTicker) => {
  tickerCache[ticker.symbol] = ticker;
};

// Get candles from cache
const getCandlesFromCache = (symbol: string, timeframe: string) => {
  const key = getCandleCacheKey(symbol, timeframe);
  return candleCache[key] || [];
};

// Get ticker from cache
const getTickerFromCache = (symbol: string) => {
  return tickerCache[symbol];
};

// Clear cache (useful when switching symbols or on manual refresh)
const clearCache = () => {
  candleCache = {};
  tickerCache = {};
};

// Aggregate candles to higher timeframes (e.g., 1h to 4h, 8h)
const aggregateCandles = (
  candles: NormalizedCandle[],
  targetTimeframe: string
): NormalizedCandle[] => {
  if (candles.length === 0) return [];

  // Determine aggregation factor based on timeframes
  const timeframeMap: Record<string, number> = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '8h': 480,
    '1d': 1440,
  };

  const sourceTimeframe = candles[0].timeframe;
  const sourceMinutes = timeframeMap[sourceTimeframe] || 60;
  const targetMinutes = timeframeMap[targetTimeframe] || 60;
  const aggregationFactor = targetMinutes / sourceMinutes;

  if (aggregationFactor <= 1) {
    return candles; // No aggregation needed
  }

  const aggregated: NormalizedCandle[] = [];
  let currentAggregation: {
    candles: NormalizedCandle[];
    startTime: number;
  } | null = null;

  for (const candle of candles) {
    const candleTime = new Date(candle.timestamp);
    const minutes = candleTime.getMinutes();
    const hours = candleTime.getHours();

    // Determine aggregation bucket based on target timeframe
    let bucketStart: number;

    if (targetTimeframe === '4h') {
      const hourBucket = Math.floor(hours / 4) * 4;
      bucketStart = new Date(candleTime).setHours(hourBucket, 0, 0, 0);
    } else if (targetTimeframe === '8h') {
      const hourBucket = Math.floor(hours / 8) * 8;
      bucketStart = new Date(candleTime).setHours(hourBucket, 0, 0, 0);
    } else if (targetTimeframe === '1d') {
      bucketStart = new Date(candleTime).setHours(0, 0, 0, 0);
    } else {
      // For other timeframes, use simple aggregation
      const minutesBucket = Math.floor(minutes / targetMinutes) * targetMinutes;
      bucketStart = new Date(candleTime).setMinutes(minutesBucket, 0, 0);
    }

    if (!currentAggregation || currentAggregation.startTime !== bucketStart) {
      // Start new aggregation bucket
      if (currentAggregation) {
        // Finalize previous bucket
        aggregated.push(
          createAggregatedCandle(currentAggregation.candles, targetTimeframe)
        );
      }
      currentAggregation = {
        candles: [candle],
        startTime: bucketStart,
      };
    } else {
      // Add to current bucket
      currentAggregation.candles.push(candle);
    }
  }

  // Finalize last bucket
  if (currentAggregation) {
    aggregated.push(
      createAggregatedCandle(currentAggregation.candles, targetTimeframe)
    );
  }

  return aggregated;
};

// Create aggregated candle from multiple candles
const createAggregatedCandle = (
  candles: NormalizedCandle[],
  timeframe: string
): NormalizedCandle => {
  if (candles.length === 0) {
    throw new Error('No candles to aggregate');
  }

  const firstCandle = candles[0];
  const lastCandle = candles[candles.length - 1];

  return {
    symbol: firstCandle.symbol,
    timeframe,
    timestamp: lastCandle.timestamp, // Use last candle's timestamp
    open: firstCandle.open,
    high: Math.max(...candles.map((c) => c.high)),
    low: Math.min(...candles.map((c) => c.low)),
    close: lastCandle.close,
    volume: candles.reduce((sum, c) => sum + c.volume, 0),
    isClosed: true, // Aggregated candles are always closed
    source: firstCandle.source,
  };
};

// Calculate technical indicators
const calculateEMA = (
  candles: NormalizedCandle[],
  period: number
): number[] => {
  if (candles.length < period) return [];

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let previousEMA = sum / period;
  ema.push(previousEMA);

  // Calculate EMA for remaining candles
  for (let i = period; i < candles.length; i++) {
    const currentEMA =
      (candles[i].close - previousEMA) * multiplier + previousEMA;
    ema.push(currentEMA);
    previousEMA = currentEMA;
  }

  return ema;
};

// Calculate RSI (Relative Strength Index)
const calculateRSI = (
  candles: NormalizedCandle[],
  period: number
): number[] => {
  if (candles.length < period + 1) return [];

  const rsi: number[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i].close - candles[i - 1].close);
  }

  // Calculate initial average gains and losses
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate initial RSI
  let rs = avgGain / avgLoss;
  let currentRSI = 100 - 100 / (1 + rs);
  rsi.push(currentRSI);

  // Calculate RSI for remaining periods
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgGain / avgLoss;
    currentRSI = 100 - 100 / (1 + rs);
    rsi.push(currentRSI);
  }

  return rsi;
};

// Public API
export const DataService = {
  addCandleToCache,
  addTickerToCache,
  getCandlesFromCache,
  getTickerFromCache,
  clearCache,
  aggregateCandles,
  calculateEMA,
  calculateRSI,

  // Helper method to get EMA values for a symbol/timeframe
  getEMA: (symbol: string, timeframe: string, period: number) => {
    const candles = getCandlesFromCache(symbol, timeframe);
    return calculateEMA(candles, period);
  },

  // Helper method to get RSI values for a symbol/timeframe
  getRSI: (symbol: string, timeframe: string, period: number) => {
    const candles = getCandlesFromCache(symbol, timeframe);
    return calculateRSI(candles, period);
  },
};
