// Individual TradingView chart component for TradeDash

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
  CrosshairMode,
} from 'lightweight-charts';
import type { Timeframe } from '../../lib/stores/types';
import { useChartStore } from '../../lib/stores/chart-store';
import { useChartData } from './use-chart-data';
import { ChartHeader } from './chart-header';
import { HorizontalLineManager } from './horizontal-line-manager';
import { LineContextMenu } from './line-controls';
import { ChangeSymbolModal } from './change-symbol-modal';
import type { HorizontalLineData } from './types';

interface TradingViewChartProps {
  chartIndex: number;
  symbol: string;
  timeframe: Timeframe;
  showEMA9: boolean;
  showEMA21: boolean;
}

// ── Module-level crosshair sync ──────────────────────────────────────────────
// Each chart registers a callback; when one chart moves its crosshair the
// others receive the new time and snap their own crosshair to it.
const crosshairSyncCallbacks = new Map<number, (time: Time | null) => void>();

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Individual TradingView chart with candlesticks, EMAs, volume, and horizontal
 * price lines. Supports crosshair synchronisation across all 4 chart slots.
 */
export function TradingViewChart({
  chartIndex,
  symbol,
  timeframe,
  showEMA9,
  showEMA21,
}: TradingViewChartProps) {
  const { setChartSymbol } = useChartStore();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [priceChange, setPriceChange] = useState<number>(0);
  const [showShiftHint, setShowShiftHint] = useState(false);
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    line: HorizontalLineData | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    line: null,
  });

  // Edit-price modal state
  const [editModal, setEditModal] = useState<{
    visible: boolean;
    line: HorizontalLineData | null;
    value: string;
  }>({ visible: false, line: null, value: '' });

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
    clearAllHorizontalLines,
  } = useChartData(symbol, timeframe);

  // ── Chart initialisation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return;

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
    lineManagerRef.current = new HorizontalLineManager(chart);

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;

    // Volume histogram (separate price scale — bottom 25 % of chart)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // EMA line series
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

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } =
          chartContainerRef.current.getBoundingClientRect();
        chartRef.current.applyOptions({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Shift+Click → add horizontal line
    const handleClick = (param: {
      point?: { x: number; y: number };
      time?: Time;
    }) => {
      if (!isShiftPressedRef.current || !param.point) return;
      const cs = candleSeriesRef.current;
      if (!cs) return;
      const price = cs.coordinateToPrice(param.point.y);
      if (price !== null && price !== undefined) {
        void addHorizontalLine(price);
      }
    };
    chart.subscribeClick(handleClick);

    // Shift key tracking
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

    // ── Crosshair sync ───────────────────────────────────────────────────────
    // Broadcast this chart's crosshair position to all other registered charts
    const handleCrosshairMove = (param: {
      time?: Time;
      point?: { x: number; y: number };
    }) => {
      const time = param.time ?? null;
      crosshairSyncCallbacks.forEach((cb, idx) => {
        if (idx !== chartIndex) cb(time);
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    // Receive crosshair time from other charts and snap ours to it
    const receiveCrosshair = (time: Time | null) => {
      const cs = candleSeriesRef.current;
      const ch = chartRef.current;
      if (!ch || !cs) return;
      if (time === null) {
        ch.clearCrosshairPosition();
      } else {
        ch.setCrosshairPosition(0, time, cs);
      }
    };
    crosshairSyncCallbacks.set(chartIndex, receiveCrosshair);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      chart.unsubscribeClick(handleClick);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      crosshairSyncCallbacks.delete(chartIndex);

      lineManagerRef.current?.dispose();
      lineManagerRef.current = null;

      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema21SeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [addHorizontalLine, chartIndex]);

  // ── Candle data ───────────────────────────────────────────────────────────
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

    if (candles.length >= 2) {
      const first = candles[0];
      const last = candles[candles.length - 1];
      const change = ((last.close - first.open) / first.open) * 100;
      const rafId = requestAnimationFrame(() => setPriceChange(change));
      return () => cancelAnimationFrame(rafId);
    }
  }, [candles]);

  // ── Volume bars ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!volumeSeriesRef.current || candles.length === 0) return;

    const volData: HistogramData[] = candles
      .filter((c) => c.volume !== undefined)
      .map((c) => ({
        time: c.time as Time,
        value: c.volume as number,
        color: c.close >= c.open ? '#22c55e55' : '#ef444455',
      }));

    if (volData.length > 0) {
      volumeSeriesRef.current.setData(volData);
    }
  }, [candles]);

  // ── EMA 9 ─────────────────────────────────────────────────────────────────
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

  // ── EMA 21 ────────────────────────────────────────────────────────────────
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

  // ── Horizontal lines ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!lineManagerRef.current || candles.length === 0) return;
    const timeRange = {
      start: candles[0].time,
      end: candles[candles.length - 1].time,
    };
    lineManagerRef.current.syncLines(horizontalLines, timeRange);
  }, [horizontalLines, candles]);

  // ── Line callbacks ────────────────────────────────────────────────────────
  const handleAddLine = useCallback(
    (price: number, color?: string) => void addHorizontalLine(price, color),
    [addHorizontalLine]
  );
  const handleRemoveLine = useCallback(
    (id: string) => void removeHorizontalLine(id),
    [removeHorizontalLine]
  );
  const handleUpdateLine = useCallback(
    (id: string, updates: { price?: number; color?: string }) =>
      void updateHorizontalLine(id, updates),
    [updateHorizontalLine]
  );
  const handleClearAllLines = useCallback(
    () => void clearAllHorizontalLines(),
    [clearAllHorizontalLines]
  );

  // ── Context menu ──────────────────────────────────────────────────────────
  const hideContextMenu = useCallback(
    () => setContextMenu((p) => ({ ...p, visible: false })),
    []
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!chartContainerRef.current || !candleSeriesRef.current) return;

      const rect = chartContainerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (price === null || price === undefined) return;

      let closestLine: HorizontalLineData | null = null;
      let minDist = Infinity;
      for (const line of horizontalLines) {
        const d = Math.abs(line.price - price);
        if (d < minDist) {
          minDist = d;
          closestLine = line;
        }
      }

      const tolerance = Math.abs(price) * 0.02;
      if (closestLine && minDist <= tolerance) {
        setContextMenu({
          visible: true,
          position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
          line: closestLine,
        });
      }
    },
    [horizontalLines]
  );

  // ── Edit price modal ──────────────────────────────────────────────────────
  const handleEditLine = useCallback((line: HorizontalLineData) => {
    setEditModal({ visible: true, line, value: String(line.price) });
  }, []);

  const handleEditConfirm = useCallback(() => {
    if (!editModal.line) return;
    const p = parseFloat(editModal.value);
    if (!isNaN(p) && p > 0) handleUpdateLine(editModal.line.id, { price: p });
    setEditModal({ visible: false, line: null, value: '' });
  }, [editModal, handleUpdateLine]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleEditConfirm();
      if (e.key === 'Escape')
        setEditModal({ visible: false, line: null, value: '' });
    },
    [handleEditConfirm]
  );

  // ── Symbol change ─────────────────────────────────────────────────────────
  const handleSettingsClick = useCallback(() => {
    setShowSymbolModal(true);
  }, []);

  const handleSymbolConfirm = useCallback(
    (newSymbol: string) => {
      void setChartSymbol(chartIndex, newSymbol);
      setShowSymbolModal(false);
    },
    [chartIndex, setChartSymbol]
  );

  const handleCloseClick = useCallback(() => {
    setShowSymbolModal(true);
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
        <div
          ref={chartContainerRef}
          className="w-full h-full"
          onContextMenu={handleContextMenu}
        />

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
                Loading…
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

        {/* Shift+Click hint */}
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
              hideContextMenu();
              handleEditLine(line);
            }}
            onChangeColor={(line, color) => {
              handleUpdateLine(line.id, { color });
            }}
            onDelete={(line) => {
              handleRemoveLine(line.id);
            }}
          />
        )}

        {/* Edit Price Modal */}
        {editModal.visible && editModal.line && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() =>
              setEditModal({ visible: false, line: null, value: '' })
            }
          >
            <div
              className="rounded-lg shadow-xl p-4 w-64"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Edit Price Level
              </h4>
              <input
                type="number"
                step="any"
                autoFocus
                value={editModal.value}
                onChange={(e) =>
                  setEditModal((p) => ({ ...p, value: e.target.value }))
                }
                onKeyDown={handleEditKeyDown}
                className="w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-1 mb-3"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() =>
                    setEditModal({ visible: false, line: null, value: '' })
                  }
                  className="px-3 py-1.5 text-sm rounded"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditConfirm}
                  className="px-3 py-1.5 text-sm rounded"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Symbol Modal */}
      {showSymbolModal && (
        <ChangeSymbolModal
          currentSymbol={symbol}
          onConfirm={handleSymbolConfirm}
          onClose={() => setShowSymbolModal(false)}
        />
      )}
    </div>
  );
}
