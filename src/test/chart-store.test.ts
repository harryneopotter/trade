// Integration tests for the chart Zustand store
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock the storage layer so tests don't need IndexedDB ──────────────────
vi.mock('../lib/storage/chart-state-storage', () => ({
  getChartStates: vi.fn().mockResolvedValue([]),
  saveChartState: vi.fn().mockResolvedValue(undefined),
}));

// Import AFTER mocks are established
import { useChartStore } from '../lib/stores/chart-store';

describe('useChartStore', () => {
  beforeEach(() => {
    // Reset store to defaults before each test
    useChartStore.setState({
      charts: [
        { symbol: 'BTCUSDT', timeframe: '1h', showEMA9: true, showEMA21: true },
        { symbol: 'ETHUSDT', timeframe: '1h', showEMA9: true, showEMA21: true },
        { symbol: 'SOLUSDT', timeframe: '1h', showEMA9: true, showEMA21: true },
        { symbol: 'BNBUSDT', timeframe: '1h', showEMA9: true, showEMA21: true },
      ],
    });
  });

  it('initialises with 4 default charts', () => {
    const { charts } = useChartStore.getState();
    expect(charts).toHaveLength(4);
    expect(charts[0].symbol).toBe('BTCUSDT');
    expect(charts[3].symbol).toBe('BNBUSDT');
  });

  it('setChartSymbol updates the symbol for the given index', async () => {
    await useChartStore.getState().setChartSymbol(0, 'xrpusdt');
    const { charts } = useChartStore.getState();
    expect(charts[0].symbol).toBe('XRPUSDT'); // normalised to uppercase
    // Other charts unchanged
    expect(charts[1].symbol).toBe('ETHUSDT');
  });

  it('setChartSymbol ignores out-of-range index', async () => {
    const before = useChartStore.getState().charts.map((c) => c.symbol);
    await useChartStore.getState().setChartSymbol(99, 'XRPUSDT');
    const after = useChartStore.getState().charts.map((c) => c.symbol);
    expect(after).toEqual(before);
  });

  it('syncAllTimeframes updates every chart', () => {
    useChartStore.getState().syncAllTimeframes('4h');
    const { charts } = useChartStore.getState();
    expect(charts.every((c) => c.timeframe === '4h')).toBe(true);
  });

  it('toggleChartEMA9 flips the EMA9 flag for the given chart', () => {
    useChartStore.getState().toggleChartEMA9(1);
    expect(useChartStore.getState().charts[1].showEMA9).toBe(false);
    useChartStore.getState().toggleChartEMA9(1);
    expect(useChartStore.getState().charts[1].showEMA9).toBe(true);
  });

  it('toggleChartEMA21 flips the EMA21 flag for the given chart', () => {
    useChartStore.getState().toggleChartEMA21(2);
    expect(useChartStore.getState().charts[2].showEMA21).toBe(false);
  });

  it('resetToDefaults restores the four default symbols', () => {
    useChartStore.getState().setChartSymbol(0, 'XRPUSDT');
    useChartStore.getState().resetToDefaults();
    expect(useChartStore.getState().charts[0].symbol).toBe('BTCUSDT');
  });
});
