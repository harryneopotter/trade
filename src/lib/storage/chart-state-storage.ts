/* eslint-disable no-console */
// Chart state storage operations for TradeDash
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db';
import type { ChartState } from './types';

/**
 * Get all chart states sorted by chart index
 */
export async function getChartStates(): Promise<ChartState[]> {
  try {
    const db = await getDB();
    const chartIndexIndex = db
      .transaction('chartState')
      .store.index('byChartIndex');
    const states = await chartIndexIndex.getAll();
    // Sort by chart index
    return states.sort((a, b) => a.chartIndex - b.chartIndex);
  } catch (error) {
    console.error('Failed to get chart states:', error);
    throw new Error('Failed to retrieve chart states');
  }
}

/**
 * Save or update chart state for a specific chart index
 * If a state for this chart index exists, it will be updated
 */
export async function saveChartState(
  chartIndex: number,
  symbol: string
): Promise<void> {
  try {
    const db = await getDB();

    // Check if a state for this chart index already exists
    const chartIndexIndex = db
      .transaction('chartState')
      .store.index('byChartIndex');
    const existingState = await chartIndexIndex.get(chartIndex);

    const chartState: ChartState = {
      id: existingState?.id || uuidv4(),
      chartIndex,
      symbol: symbol.toUpperCase(),
      lastViewedAt: Date.now(),
    };

    await db.put('chartState', chartState);
    console.log(`Saved chart state for chart ${chartIndex}: ${symbol}`);
  } catch (error) {
    console.error(`Failed to save chart state for chart ${chartIndex}:`, error);
    throw new Error(`Failed to save chart state for chart ${chartIndex}`);
  }
}

/**
 * Get chart state for a specific chart index
 */
export async function getChartStateByIndex(
  chartIndex: number
): Promise<ChartState | undefined> {
  try {
    const db = await getDB();
    const chartIndexIndex = db
      .transaction('chartState')
      .store.index('byChartIndex');
    return await chartIndexIndex.get(chartIndex);
  } catch (error) {
    console.error(`Failed to get chart state for chart ${chartIndex}:`, error);
    return undefined;
  }
}

/**
 * Remove chart state for a specific chart index
 */
export async function removeChartState(chartIndex: number): Promise<void> {
  try {
    const db = await getDB();

    // Find the state by chart index
    const chartIndexIndex = db
      .transaction('chartState')
      .store.index('byChartIndex');
    const state = await chartIndexIndex.get(chartIndex);

    if (state) {
      await db.delete('chartState', state.id);
      console.log(`Removed chart state for chart ${chartIndex}`);
    }
  } catch (error) {
    console.error(
      `Failed to remove chart state for chart ${chartIndex}:`,
      error
    );
    throw new Error(`Failed to remove chart state for chart ${chartIndex}`);
  }
}

/**
 * Remove all chart states
 */
export async function clearAllChartStates(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('chartState');
    console.log('Cleared all chart states');
  } catch (error) {
    console.error('Failed to clear all chart states:', error);
    throw new Error('Failed to clear all chart states');
  }
}

/**
 * Get the most recently viewed chart state
 */
export async function getMostRecentChartState(): Promise<
  ChartState | undefined
> {
  try {
    const states = await getChartStates();
    if (states.length === 0) {
      return undefined;
    }
    // Sort by lastViewedAt descending and return the first
    return states.sort((a, b) => b.lastViewedAt - a.lastViewedAt)[0];
  } catch (error) {
    console.error('Failed to get most recent chart state:', error);
    return undefined;
  }
}
