// Horizontal lines storage operations for TradeDash
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import type { HorizontalLine } from './types';

// Default colors for horizontal lines
const DEFAULT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
];

/**
 * Get a random default color
 */
function getRandomColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

/**
 * Get all horizontal lines for a specific symbol
 */
export async function getLines(symbol: string): Promise<HorizontalLine[]> {
  try {
    const db = await getDB();
    const symbolIndex = db
      .transaction('horizontalLines')
      .store.index('bySymbol');
    const lines = await symbolIndex.getAll(symbol.toUpperCase());
    // Sort by creation time (oldest first)
    return lines.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error(`Failed to get lines for ${symbol}:`, error);
    throw new Error(`Failed to retrieve lines for ${symbol}`);
  }
}

/**
 * Add a new horizontal line for a symbol
 * Returns the created line
 */
export async function addLine(
  symbol: string,
  price: number,
  color?: string
): Promise<HorizontalLine> {
  try {
    const db = await getDB();

    const newLine: HorizontalLine = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      price,
      color: color || getRandomColor(),
      createdAt: Date.now(),
    };

    await db.put('horizontalLines', newLine);
    console.log(`Added line at ${price} for ${symbol}`);
    return newLine;
  } catch (error) {
    console.error(`Failed to add line for ${symbol}:`, error);
    throw new Error(`Failed to add line for ${symbol}`);
  }
}

/**
 * Update an existing horizontal line
 */
export async function updateLine(
  id: string,
  updates: Partial<Pick<HorizontalLine, 'price' | 'color'>>
): Promise<void> {
  try {
    const db = await getDB();

    // Get existing line
    const existingLine = await db.get('horizontalLines', id);

    if (!existingLine) {
      throw new Error(`Line with id ${id} not found`);
    }

    // Apply updates
    const updatedLine: HorizontalLine = {
      ...existingLine,
      ...updates,
    };

    await db.put('horizontalLines', updatedLine);
    console.log(`Updated line ${id}`);
  } catch (error) {
    console.error(`Failed to update line ${id}:`, error);
    throw new Error(`Failed to update line ${id}`);
  }
}

/**
 * Remove a horizontal line by its ID
 */
export async function removeLine(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('horizontalLines', id);
    console.log(`Removed line ${id}`);
  } catch (error) {
    console.error(`Failed to remove line ${id}:`, error);
    throw new Error(`Failed to remove line ${id}`);
  }
}

/**
 * Remove all horizontal lines for a specific symbol
 */
export async function removeAllLines(symbol: string): Promise<void> {
  try {
    const db = await getDB();
    const symbolIndex = db
      .transaction('horizontalLines')
      .store.index('bySymbol');
    const lines = await symbolIndex.getAll(symbol.toUpperCase());

    const tx = db.transaction('horizontalLines', 'readwrite');
    for (const line of lines) {
      await tx.store.delete(line.id);
    }
    await tx.done;

    console.log(`Removed all lines for ${symbol}`);
  } catch (error) {
    console.error(`Failed to remove all lines for ${symbol}:`, error);
    throw new Error(`Failed to remove all lines for ${symbol}`);
  }
}

/**
 * Get a single line by its ID
 */
export async function getLineById(
  id: string
): Promise<HorizontalLine | undefined> {
  try {
    const db = await getDB();
    return await db.get('horizontalLines', id);
  } catch (error) {
    console.error(`Failed to get line ${id}:`, error);
    return undefined;
  }
}

/**
 * Get all horizontal lines across all symbols
 */
export async function getAllLines(): Promise<HorizontalLine[]> {
  try {
    const db = await getDB();
    const lines = await db.getAll('horizontalLines');
    return lines.sort((a, b) => a.createdAt - b.createdAt);
  } catch (error) {
    console.error('Failed to get all lines:', error);
    throw new Error('Failed to retrieve all lines');
  }
}
