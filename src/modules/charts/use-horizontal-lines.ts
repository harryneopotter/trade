/* eslint-disable no-console */
// Enhanced hook for horizontal lines management in TradeDash
// Provides CRUD operations, click handling, and context menu support

import { useState, useCallback, useEffect, useRef } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { HorizontalLineData } from './types';
import type { HorizontalLine } from '../../lib/storage/types';
import {
  getLines,
  addLine,
  updateLine,
  removeLine,
  removeAllLines,
} from '../../lib/storage/lines-storage';
import { HorizontalLineManager } from './horizontal-line-manager';

// Default line color
const DEFAULT_LINE_COLOR = '#f59e0b'; // amber-500

// Maximum lines per symbol
const MAX_LINES_PER_SYMBOL = 10;

/**
 * Hook for managing horizontal lines for a specific symbol + timeframe
 */
export function useHorizontalLines(symbol: string, timeframe: string) {
  const [lines, setLines] = useState<HorizontalLineData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lines from storage
  const loadLines = useCallback(async () => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);

    try {
      const storedLines = await getLines(symbol, timeframe);
      const lineData: HorizontalLineData[] = storedLines.map((line) => ({
        id: line.id,
        price: line.price,
        color: line.color,
      }));
      setLines(lineData);
    } catch (err) {
      console.error('Failed to load horizontal lines:', err);
      setError('Failed to load horizontal lines');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe]);

  // Load lines on mount and symbol change
  useEffect(() => {
    void loadLines();
  }, [loadLines]);

  return {
    lines,
    isLoading,
    error,
    refreshLines: loadLines,
  };
}

/**
 * Hook for adding a new horizontal line
 */
export function useAddHorizontalLine() {
  const [isAdding, setIsAdding] = useState(false);

  const addHorizontalLine = useCallback(
    async (
      symbol: string,
      timeframe: string,
      price: number,
      color?: string
    ): Promise<HorizontalLine | null> => {
      setIsAdding(true);

      try {
        // Check current line count
        const currentLines = await getLines(symbol, timeframe);
        if (currentLines.length >= MAX_LINES_PER_SYMBOL) {
          console.warn(
            `Maximum ${MAX_LINES_PER_SYMBOL} lines allowed per symbol`
          );
          return null;
        }

        const newLine = await addLine(
          symbol,
          timeframe,
          price,
          color || DEFAULT_LINE_COLOR
        );
        return newLine;
      } catch (err) {
        console.error('Failed to add horizontal line:', err);
        return null;
      } finally {
        setIsAdding(false);
      }
    },
    []
  );

  return { addHorizontalLine, isAdding };
}

/**
 * Hook for removing a horizontal line
 */
export function useRemoveHorizontalLine() {
  const [isRemoving, setIsRemoving] = useState(false);

  const removeHorizontalLine = useCallback(
    async (id: string): Promise<boolean> => {
      setIsRemoving(true);

      try {
        await removeLine(id);
        return true;
      } catch (err) {
        console.error('Failed to remove horizontal line:', err);
        return false;
      } finally {
        setIsRemoving(false);
      }
    },
    []
  );

  return { removeHorizontalLine, isRemoving };
}

/**
 * Hook for updating a horizontal line
 */
export function useUpdateHorizontalLine() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateHorizontalLine = useCallback(
    async (
      id: string,
      updates: { price?: number; color?: string }
    ): Promise<boolean> => {
      setIsUpdating(true);

      try {
        await updateLine(id, updates);
        return true;
      } catch (err) {
        console.error('Failed to update horizontal line:', err);
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return { updateHorizontalLine, isUpdating };
}

/**
 * Hook for clearing all lines for a symbol
 */
export function useClearAllLines() {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllLines = useCallback(
    async (symbol: string): Promise<boolean> => {
      setIsClearing(true);

      try {
        await removeAllLines(symbol);
        return true;
      } catch (err) {
        console.error('Failed to clear all lines:', err);
        return false;
      } finally {
        setIsClearing(false);
      }
    },
    []
  );

  return { clearAllLines, isClearing };
}

/**
 * Options for the useChartHorizontalLines hook
 */
export interface UseChartHorizontalLinesOptions {
  symbol: string;
  timeframe: string;
  chart: IChartApi | null;
  candleSeries?: ISeriesApi<'Candlestick'> | null;
  candles: { time: number }[];
  enabled?: boolean;
}

/**
 * Comprehensive hook for horizontal lines with chart integration
 * Handles click-to-add, context menu, and chart synchronization
 */
export function useChartHorizontalLines({
  symbol,
  timeframe,
  chart,
  candleSeries,
  candles,
  enabled = true,
}: UseChartHorizontalLinesOptions) {
  const [lines, setLines] = useState<HorizontalLineData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShiftHint, setShowShiftHint] = useState(false);

  const lineManagerRef = useRef<HorizontalLineManager | null>(null);
  const isShiftPressedRef = useRef(false);

  // Initialize line manager when chart is available
  useEffect(() => {
    if (!chart) return;

    lineManagerRef.current = new HorizontalLineManager(chart);

    return () => {
      lineManagerRef.current?.dispose();
      lineManagerRef.current = null;
    };
  }, [chart]);

  // Load lines from storage
  const loadLines = useCallback(async () => {
    if (!symbol || !enabled) return;

    setIsLoading(true);
    try {
      const storedLines = await getLines(symbol, timeframe);
      const lineData: HorizontalLineData[] = storedLines.map((line) => ({
        id: line.id,
        price: line.price,
        color: line.color,
      }));
      setLines(lineData);
    } catch (err) {
      console.error('Failed to load horizontal lines:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, enabled]);

  // Load lines on mount and symbol change
  useEffect(() => {
    void loadLines();
  }, [loadLines]);

  // Sync lines with chart when lines or candles change
  useEffect(() => {
    if (!lineManagerRef.current || candles.length === 0) return;

    const timeRange = {
      start: candles[0].time,
      end: candles[candles.length - 1].time,
    };

    lineManagerRef.current.syncLines(lines, timeRange);
  }, [lines, candles]);

  // Add a new line
  const addHorizontalLine = useCallback(
    async (
      price: number,
      color?: string
    ): Promise<HorizontalLineData | null> => {
      if (!symbol) return null;

      // Check line limit
      if (lines.length >= MAX_LINES_PER_SYMBOL) {
        console.warn(
          `Maximum ${MAX_LINES_PER_SYMBOL} lines allowed per symbol`
        );
        return null;
      }

      try {
        const newLine = await addLine(
          symbol,
          timeframe,
          price,
          color || DEFAULT_LINE_COLOR
        );
        const lineData: HorizontalLineData = {
          id: newLine.id,
          price: newLine.price,
          color: newLine.color,
        };

        setLines((prev) => [...prev, lineData]);
        return lineData;
      } catch (err) {
        console.error('Failed to add horizontal line:', err);
        return null;
      }
    },
    [symbol, timeframe, lines.length]
  );

  // Remove a line
  const removeHorizontalLine = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeLine(id);
        setLines((prev) => prev.filter((line) => line.id !== id));
        return true;
      } catch (err) {
        console.error('Failed to remove horizontal line:', err);
        return false;
      }
    },
    []
  );

  // Update a line
  const updateHorizontalLine = useCallback(
    async (
      id: string,
      updates: { price?: number; color?: string }
    ): Promise<boolean> => {
      try {
        await updateLine(id, updates);
        setLines((prev) =>
          prev.map((line) => (line.id === id ? { ...line, ...updates } : line))
        );
        return true;
      } catch (err) {
        console.error('Failed to update horizontal line:', err);
        return false;
      }
    },
    []
  );

  // Clear all lines for the symbol + timeframe
  const clearAllLines = useCallback(async (): Promise<boolean> => {
    if (!symbol) return false;

    try {
      await removeAllLines(symbol, timeframe);
      setLines([]);
      return true;
    } catch (err) {
      console.error('Failed to clear all lines:', err);
      return false;
    }
  }, [symbol, timeframe]);

  // Handle Shift+Click to add line
  const handleChartClick = useCallback(
    (param: { point?: { x: number; y: number }; time?: Time }) => {
      if (!isShiftPressedRef.current || !chart || !param.point) return;

      // Get price from coordinate
      const price = candleSeries?.coordinateToPrice(param.point.y);
      if (price !== null && price !== undefined) {
        void addHorizontalLine(price);
      }
    },
    [chart, candleSeries, addHorizontalLine]
  );

  // Track Shift key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = true;
        setShowShiftHint(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = false;
        setShowShiftHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Subscribe to chart clicks
  useEffect(() => {
    if (!chart || !enabled) return;

    chart.subscribeClick(handleChartClick);

    return () => {
      chart.unsubscribeClick(handleChartClick);
    };
  }, [chart, handleChartClick, enabled]);

  // Context menu handler for line operations
  const showLineContextMenu = useCallback(
    (lineId: string, position: { x: number; y: number }) => {
      const line = lines.find((l) => l.id === lineId);
      if (!line) return;

      // Dispatch custom event for context menu
      const event = new CustomEvent('lineContextMenu', {
        detail: {
          lineId,
          line,
          position,
        },
      });
      window.dispatchEvent(event);
    },
    [lines]
  );

  return {
    lines,
    isLoading,
    showShiftHint,
    addHorizontalLine,
    removeHorizontalLine,
    updateHorizontalLine,
    clearAllLines,
    refreshLines: loadLines,
    showLineContextMenu,
  };
}

/**
 * Hook for handling line context menu operations
 */
export function useLineContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    lineId: string | null;
    position: { x: number; y: number };
    line: HorizontalLineData | null;
  }>({
    visible: false,
    lineId: null,
    position: { x: 0, y: 0 },
    line: null,
  });

  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      const customEvent = e as CustomEvent<{
        lineId: string;
        line: HorizontalLineData;
        position: { x: number; y: number };
      }>;

      setContextMenu({
        visible: true,
        lineId: customEvent.detail.lineId,
        position: customEvent.detail.position,
        line: customEvent.detail.line,
      });
    };

    window.addEventListener('lineContextMenu', handleContextMenu);

    return () => {
      window.removeEventListener('lineContextMenu', handleContextMenu);
    };
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    contextMenu,
    hideContextMenu,
  };
}
