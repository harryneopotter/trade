// Unit tests for DataService pure functions
import { describe, it, expect } from 'vitest';
import { DataService } from '../lib/data/data-service';
import type { NormalizedCandle } from '../lib/data/types';

function makeCandle(
  overrides: Partial<NormalizedCandle> = {}
): NormalizedCandle {
  return {
    symbol: 'BTCUSDT',
    timeframe: '15m',
    timestamp: Date.now(),
    open: 100,
    high: 110,
    low: 90,
    close: 105,
    volume: 1000,
    isClosed: true,
    source: 'binance',
    ...overrides,
  };
}

// ── calculateEMA ────────────────────────────────────────────────────────────

describe('DataService.calculateEMA', () => {
  it('returns empty array when not enough candles for the period', () => {
    const candles = [makeCandle(), makeCandle()];
    expect(DataService.calculateEMA(candles, 9)).toHaveLength(0);
  });

  it('returns values for each candle once period is reached', () => {
    const candles = Array.from({ length: 20 }, (_, i) =>
      makeCandle({ close: 100 + i })
    );
    const ema = DataService.calculateEMA(candles, 9);
    // Output length = candles.length - period + 1 = 20 - 9 + 1 = 12
    expect(ema).toHaveLength(12);
  });

  it('converges toward a constant close price series', () => {
    // When every close is the same value the EMA should equal that value
    const price = 50000;
    const candles = Array.from({ length: 100 }, () =>
      makeCandle({ close: price })
    );
    const ema = DataService.calculateEMA(candles, 9);
    const lastEMA = ema[ema.length - 1];
    expect(lastEMA).toBeCloseTo(price, 2);
  });

  it('EMA 9 reacts faster than EMA 21 to a price jump', () => {
    // Flat series then a spike
    const flat = Array.from({ length: 50 }, () => makeCandle({ close: 100 }));
    const spike = Array.from({ length: 10 }, () => makeCandle({ close: 200 }));
    const candles = [...flat, ...spike];

    const ema9 = DataService.calculateEMA(candles, 9);
    const ema21 = DataService.calculateEMA(candles, 21);

    // After 10 bars of spike, EMA9 should be closer to 200 than EMA21
    const last9 = ema9[ema9.length - 1];
    const last21 = ema21[ema21.length - 1];
    expect(last9).toBeGreaterThan(last21);
  });
});

// ── aggregateCandles ────────────────────────────────────────────────────────

function makeTimedCandle(
  openTimeMs: number,
  overrides: Partial<NormalizedCandle> = {}
): NormalizedCandle {
  return makeCandle({
    timestamp: openTimeMs,
    ...overrides,
  });
}

describe('DataService.aggregateCandles', () => {
  it('returns input unchanged when target equals source timeframe', () => {
    const candles = [makeCandle(), makeCandle()];
    const result = DataService.aggregateCandles(candles, '15m');
    expect(result).toEqual(candles);
  });

  it('returns empty when input is empty', () => {
    expect(DataService.aggregateCandles([], '1h')).toHaveLength(0);
  });

  it('aggregates four 15m candles into one 1h candle', () => {
    // Four consecutive 15-minute candles starting at the top of an hour
    const base = new Date('2024-01-01T08:00:00Z').getTime();
    const candles = [0, 15, 30, 45].map((minuteOffset, i) =>
      makeTimedCandle(base + minuteOffset * 60 * 1000, {
        timeframe: '15m',
        open: 100 + i,
        high: 110 + i,
        low: 90 + i,
        close: 104 + i,
        volume: 100,
      })
    );

    const result = DataService.aggregateCandles(candles, '1h');
    expect(result).toHaveLength(1);

    const agg = result[0];
    expect(agg.open).toBe(100); // first open
    expect(agg.close).toBe(107); // last close (104 + 3)
    expect(agg.high).toBe(113); // max high (110 + 3)
    expect(agg.low).toBe(90); // min low (90 + 0)
    expect(agg.volume).toBe(400); // summed volume
  });
});

// ── cache ───────────────────────────────────────────────────────────────────

describe('DataService cache', () => {
  it('stores and retrieves candles by symbol+timeframe', () => {
    DataService.clearCache();
    const candle = makeCandle({ symbol: 'ETHUSDT', timeframe: '1h' });
    DataService.addCandleToCache(candle);

    const result = DataService.getCandlesFromCache('ETHUSDT', '1h');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('ETHUSDT');
  });

  it('does not mix candles from different timeframes', () => {
    DataService.clearCache();
    DataService.addCandleToCache(makeCandle({ timeframe: '1h' }));
    DataService.addCandleToCache(makeCandle({ timeframe: '4h' }));

    expect(DataService.getCandlesFromCache('BTCUSDT', '1h')).toHaveLength(1);
    expect(DataService.getCandlesFromCache('BTCUSDT', '4h')).toHaveLength(1);
    expect(DataService.getCandlesFromCache('BTCUSDT', '15m')).toHaveLength(0);
  });

  it('updates an existing candle with the same timestamp', () => {
    DataService.clearCache();
    const ts = Date.now();
    DataService.addCandleToCache(makeCandle({ timestamp: ts, close: 100 }));
    DataService.addCandleToCache(makeCandle({ timestamp: ts, close: 105 }));

    const result = DataService.getCandlesFromCache('BTCUSDT', '15m');
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(105);
  });
});
