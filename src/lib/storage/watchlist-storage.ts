/* eslint-disable no-console */
// Watchlist storage operations for TradeDash
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import type { WatchlistItem } from './types';

/**
 * Get all watchlist items sorted by order
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const db = await getDB();
    const items = await db.getAll('watchlist');
    // Sort by order field
    return items.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Failed to get watchlist:', error);
    throw new Error('Failed to retrieve watchlist');
  }
}

/**
 * Add a symbol to the watchlist
 * If symbol already exists, it will not be added again
 */
export async function addSymbol(symbol: string): Promise<void> {
  try {
    const db = await getDB();

    // Check if symbol already exists
    const existingIndex = db.transaction('watchlist').store.index('bySymbol');
    const existing = await existingIndex.get(symbol);

    if (existing) {
      console.log(`Symbol ${symbol} already exists in watchlist`);
      return;
    }

    // Get current max order
    const allItems = await db.getAll('watchlist');
    const maxOrder =
      allItems.length > 0
        ? Math.max(...allItems.map((item) => item.order))
        : -1;

    // Create new watchlist item
    const newItem: WatchlistItem = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      addedAt: Date.now(),
      order: maxOrder + 1,
    };

    await db.put('watchlist', newItem);
    console.log(`Added ${symbol} to watchlist`);
  } catch (error) {
    console.error(`Failed to add symbol ${symbol} to watchlist:`, error);
    throw new Error(`Failed to add symbol ${symbol}`);
  }
}

/**
 * Remove a symbol from the watchlist
 */
export async function removeSymbol(symbol: string): Promise<void> {
  try {
    const db = await getDB();

    // Find the item by symbol
    const symbolIndex = db.transaction('watchlist').store.index('bySymbol');
    const item = await symbolIndex.get(symbol.toUpperCase());

    if (!item) {
      console.log(`Symbol ${symbol} not found in watchlist`);
      return;
    }

    // Delete the item
    await db.delete('watchlist', item.id);

    // Reorder remaining items
    const remainingItems = await db.getAll('watchlist');
    const sortedItems = remainingItems.sort((a, b) => a.order - b.order);

    // Update orders to be sequential
    const tx = db.transaction('watchlist', 'readwrite');
    for (let i = 0; i < sortedItems.length; i++) {
      sortedItems[i].order = i;
      await tx.store.put(sortedItems[i]);
    }
    await tx.done;

    console.log(`Removed ${symbol} from watchlist`);
  } catch (error) {
    console.error(`Failed to remove symbol ${symbol} from watchlist:`, error);
    throw new Error(`Failed to remove symbol ${symbol}`);
  }
}

/**
 * Reorder symbols in the watchlist
 * The order of symbols in the array determines the new order
 */
export async function reorderSymbols(symbols: string[]): Promise<void> {
  try {
    const db = await getDB();

    // Get all current items
    const allItems = await db.getAll('watchlist');
    const itemMap = new Map(allItems.map((item) => [item.symbol, item]));

    // Update order based on the new symbol array
    const tx = db.transaction('watchlist', 'readwrite');

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i].toUpperCase();
      const item = itemMap.get(symbol);

      if (item) {
        item.order = i;
        await tx.store.put(item);
      }
    }

    await tx.done;
    console.log('Reordered watchlist');
  } catch (error) {
    console.error('Failed to reorder watchlist:', error);
    throw new Error('Failed to reorder watchlist');
  }
}

/**
 * Check if a symbol exists in the watchlist
 */
export async function hasSymbol(symbol: string): Promise<boolean> {
  try {
    const db = await getDB();
    const symbolIndex = db.transaction('watchlist').store.index('bySymbol');
    const item = await symbolIndex.get(symbol.toUpperCase());
    return !!item;
  } catch (error) {
    console.error(`Failed to check if symbol ${symbol} exists:`, error);
    return false;
  }
}

/**
 * Clear all items from the watchlist
 */
export async function clearWatchlist(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('watchlist');
    console.log('Cleared watchlist');
  } catch (error) {
    console.error('Failed to clear watchlist:', error);
    throw new Error('Failed to clear watchlist');
  }
}
