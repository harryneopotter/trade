// Individual TradingView chart component for TradeDash

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  CrosshairMode,
} from 'lightweight-charts';
import type { Timeframe } from '../../lib/stores/types';
import { useChartData } from './use-chart-data';
import { ChartHeader } from './chart-header';
import { HorizontalLineManager } from './horizontal-line-manager';
import { LineContextMenu } from './line-controls';
import type { HorizontalLineData } from './types';

interface TradingViewChartProps {
  chartIndex: number;
  symbol: string;
  timeframe: Timeframe;
  showEMA9: boolean;
  showEMA21: boolean;
}

/**
 * Individual TradingView chart with candlesticks, EMAs, and horizontal lines
 */
export function TradingViewChart({
  chartIndex,
  symbol,
  timeframe,
  showEMA9,
  showEMA21,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [priceChange, setPriceChange] = useState<number>(0);
  const [showShiftHint, setShowShiftHint] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    line: HorizontalLineData | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    line: null,
  });

  // Line manager ref
  const lineManagerRef = useRef<HorizontalLineManager | null>(null);
  const isShiftPressedRef = useRef(false);

  // Get chart data from hook
  const {
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
  } = useChartData(symbol, timeframe);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    chartRef.current = chart;

    // Initialize line manager
    lineManagerRef.current = new HorizontalLineManager(chart);

    // Create candlestick series using v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Create EMA series using v5 API
    const ema9Series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
      title: 'EMA 9',
      lastValueVisible: false,
    });
    ema9SeriesRef.current = ema9Series;

    const ema21Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'EMA 21',
      lastValueVisible: false,
    });
    ema21SeriesRef.current = ema21Series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } =
          chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({
          width,
          height,
        });
      }
    };

    // Initial resize
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Handle Shift+Click for adding horizontal lines
    const handleClick = (param: {
      point?: { x: number; y: number };
      time?: Time;
    }) => {
      if (!isShiftPressedRef.current || !chartRef.current || !param.point)
        return;

      // For v5, we need to use the series to get price from coordinate
      // Using the candle series to convert coordinate to price
      const candleSeries = candleSeriesRef.current;
      if (!candleSeries) return;

      // Get price from coordinate using the series price scale
      const price = candleSeries.coordinateToPrice(param.point.y);

      if (price !== null && price !== undefined) {
        void addHorizontalLine(price);
      }
    };

    chart.subscribeClick(handleClick);

    // Track Shift key state
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      chart.unsubscribeClick(handleClick);

      // Dispose line manager
      lineManagerRef.current?.dispose();
      lineManagerRef.current = null;

      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
    };
  }, [addHorizontalLine]);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const chartData: CandlestickData[] = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(chartData);

    // Calculate price change from first to last candle using RAF
    if (candles.length >= 2) {
      const firstCandle = candles[0];
      const lastCandle = candles[candles.length - 1];
      const change =
        ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
      const rafId = requestAnimationFrame(() => {
        setPriceChange(change);
      });

      // Cleanup RAF on effect cleanup
      return () => cancelAnimationFrame(rafId);
    }
  }, [candles]);

  // Update EMA 9
  useEffect(() => {
    if (!ema9SeriesRef.current) return;

    if (showEMA9 && ema9.length > 0) {
      const lineData: LineData[] = ema9.map((d) => ({
        time: d.time as Time,
        value: d.value,
      }));
      ema9SeriesRef.current.setData(lineData);
    } else {
      ema9SeriesRef.current.setData([]);
    }
  }, [ema9, showEMA9]);

  // Update EMA 21
  useEffect(() => {
    if (!ema21SeriesRef.current) return;

    if (showEMA21 && ema21.length > 0) {
      const lineData: LineData[] = ema21.map((d) => ({
        time: d.time as Time,
        value: d.value,
      }));
      ema21SeriesRef.current.setData(lineData);
    } else {
      ema21SeriesRef.current.setData([]);
    }
  }, [ema21, showEMA21]);

  // Update horizontal lines using line manager
  useEffect(() => {
    if (!lineManagerRef.current || candles.length === 0) return;

    const timeRange = {
      start: candles[0].time,
      end: candles[candles.length - 1].time,
    };

    lineManagerRef.current.syncLines(horizontalLines, timeRange);
  }, [horizontalLines, candles]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    // TODO: Open chart settings modal
    // eslint-disable-next-line no-console
    console.log('Settings clicked for chart', chartIndex);
  }, [chartIndex]);

  // Handle close click
  const handleCloseClick = useCallback(() => {
    // TODO: Remove chart or show placeholder
    // eslint-disable-next-line no-console
    console.log('Close clicked for chart', chartIndex);
  }, [chartIndex]);

  // Handle line operations from header
  const handleAddLine = useCallback(
    (price: number, color?: string) => {
      void addHorizontalLine(price, color);
    },
    [addHorizontalLine]
  );

  const handleRemoveLine = useCallback(
    (id: string) => {
      void removeHorizontalLine(id);
    },
    [removeHorizontalLine]
  );

  const handleUpdateLine = useCallback(
    (id: string, updates: { price?: number; color?: string }) => {
      void updateHorizontalLine(id, updates);
    },
    [updateHorizontalLine]
  );

  const handleClearAllLines = useCallback(() => {
    horizontalLines.forEach((line) => {
      void removeHorizontalLine(line.id);
    });
  }, [horizontalLines, removeHorizontalLine]);

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div
      className="flex flex-col h-full rounded overflow-hidden border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Chart Header */}
      <ChartHeader
        symbol={symbol}
        timeframe={timeframe}
        chartIndex={chartIndex}
        currentPrice={currentPrice ?? undefined}
        priceChange={priceChange}
        horizontalLines={horizontalLines}
        onSettingsClick={handleSettingsClick}
        onCloseClick={handleCloseClick}
        onAddLine={handleAddLine}
        onRemoveLine={handleRemoveLine}
        onUpdateLine={handleUpdateLine}
        onClearAllLines={handleClearAllLines}
      />

      {/* Chart Container */}
      <div className="flex-1 relative">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Loading state */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{
                  borderColor: 'var(--accent-primary)',
                  borderTopColor: 'transparent',
                }}
              />
              <span
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Loading...
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
          >
            <div className="text-center px-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2"
                style={{ color: 'var(--accent-danger)' }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Click hint */}
        {!isLoading && !error && (
          <div
            className={`absolute bottom-2 left-2 text-xs px-2 py-1 rounded transition-opacity pointer-events-none ${
              showShiftHint ? 'opacity-100' : 'opacity-50'
            }`}
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {showShiftHint
              ? 'Shift+Click to add line'
              : 'Shift+Click chart to add price level'}
          </div>
        )}

        {/* Context Menu */}
        {contextMenu.visible && (
          <LineContextMenu
            position={contextMenu.position}
            line={contextMenu.line}
            onClose={hideContextMenu}
            onEdit={(line) => {
              // TODO: Implement edit price modal
              console.log('Edit line:', line);
            }}
            onChangeColor={(line, color) => {
              handleUpdateLine(line.id, { color });
            }}
            onDelete={(line) => {
              handleRemoveLine(line.id);
            }}
          />
        )}
      </div>
    </div>
  );
}
