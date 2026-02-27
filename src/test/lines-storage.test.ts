// Unit tests for horizontal lines storage helpers
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock IndexedDB (idb) — we use a simple in-memory Map ──────────────────
const store = new Map<string, object>();

vi.mock('../lib/storage/db', () => ({
  getDB: vi.fn().mockResolvedValue({
    put: vi.fn().mockImplementation((_storeName: string, value: { id: string }) => {
      store.set(value.id, value);
      return Promise.resolve(value.id);
    }),
    get: vi.fn().mockImplementation((_storeName: string, id: string) => {
      return Promise.resolve(store.get(id));
    }),
    delete: vi.fn().mockImplementation((_storeName: string, id: string) => {
      store.delete(id);
      return Promise.resolve();
    }),
    transaction: vi.fn().mockImplementation(() => ({
      store: {
        index: vi.fn().mockReturnValue({
          getAll: vi.fn().mockImplementation((symbol: string) =>
            Promise.resolve(
              Array.from(store.values()).filter(
                (v: object) => (v as { symbol: string }).symbol === symbol
              )
            )
          ),
        }),
        delete: vi.fn().mockImplementation((id: string) => {
          store.delete(id);
          return Promise.resolve();
        }),
      },
      done: Promise.resolve(),
    })),
  }),
}));

import {
  getLines,
  addLine,
  updateLine,
  removeLine,
  removeAllLines,
} from '../lib/storage/lines-storage';

describe('lines-storage', () => {
  beforeEach(() => store.clear());

  it('addLine creates a line with correct symbol and timeframe', async () => {
    const line = await addLine('BTCUSDT', '1h', 50000, '#ff0000');
    expect(line.symbol).toBe('BTCUSDT');
    expect(line.timeframe).toBe('1h');
    expect(line.price).toBe(50000);
    expect(line.color).toBe('#ff0000');
    expect(line.id).toBeTruthy();
  });

  it('getLines filters by symbol and timeframe', async () => {
    await addLine('BTCUSDT', '1h', 50000);
    await addLine('BTCUSDT', '4h', 51000); // different timeframe
    await addLine('ETHUSDT', '1h', 3000);  // different symbol

    const lines1h = await getLines('BTCUSDT', '1h');
    expect(lines1h).toHaveLength(1);
    expect(lines1h[0].price).toBe(50000);
  });

  it('getLines treats legacy records (no timeframe) as 1h', async () => {
    // Simulate a legacy record stored without a timeframe field
    const legacyId = 'legacy-id-1';
    store.set(legacyId, {
      id: legacyId,
      symbol: 'BTCUSDT',
      price: 48000,
      color: '#ccc',
      createdAt: Date.now(),
      // no timeframe field
    });

    const lines = await getLines('BTCUSDT', '1h');
    expect(lines.some((l) => l.price === 48000)).toBe(true);
  });

  it('removeLine deletes the line from storage', async () => {
    const line = await addLine('BTCUSDT', '1h', 50000);
    await removeLine(line.id);
    const lines = await getLines('BTCUSDT', '1h');
    expect(lines).toHaveLength(0);
  });

  it('updateLine changes price and color', async () => {
    const line = await addLine('BTCUSDT', '1h', 50000, '#aaa');
    await updateLine(line.id, { price: 55000, color: '#0f0' });

    const updated = store.get(line.id) as { price: number; color: string };
    expect(updated.price).toBe(55000);
    expect(updated.color).toBe('#0f0');
  });

  it('removeAllLines only removes lines for the given symbol+timeframe', async () => {
    await addLine('BTCUSDT', '1h', 50000);
    await addLine('BTCUSDT', '4h', 51000);

    await removeAllLines('BTCUSDT', '1h');

    const remaining1h = await getLines('BTCUSDT', '1h');
    const remaining4h = await getLines('BTCUSDT', '4h');

    expect(remaining1h).toHaveLength(0);
    expect(remaining4h).toHaveLength(1);
  });
});
