// Chart module types for TradeDash

import type { Timeframe } from '../../lib/stores/types';

/**
 * Chart data structure containing candles and indicators
 */
export interface ChartData {
  candles: CandleData[];
  ema9: LineData[];
  ema21: LineData[];
  horizontalLines: HorizontalLineData[];
}

/**
 * Candlestick data point for TradingView charts
 */
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Line data point for EMA and other line series
 */
export interface LineData {
  time: number;
  value: number;
}

/**
 * Horizontal line data for price levels
 */
export interface HorizontalLineData {
  id: string;
  price: number;
  color: string;
}

/**
 * Props for the TradingViewChart component
 */
export interface ChartProps {
  chartIndex: number;
  symbol: string;
  timeframe: Timeframe;
  showEMA9: boolean;
  showEMA21: boolean;
}

/**
 * Chart header props
 */
export interface ChartHeaderProps {
  symbol: string;
  timeframe: Timeframe;
  chartIndex: number;
  currentPrice?: number | null;
  priceChange?: number;
  horizontalLines: HorizontalLineData[];
  onSettingsClick?: () => void;
  onCloseClick?: () => void;
  onAddLine: (price: number, color?: string) => void;
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    updates: { price?: number; color?: string }
  ) => void;
  onClearAllLines: () => void;
}

/**
 * Return type for useChartData hook
 */
export interface UseChartDataReturn {
  candles: CandleData[];
  ema9: LineData[];
  ema21: LineData[];
  horizontalLines: HorizontalLineData[];
  isLoading: boolean;
  error: string | null;
  currentPrice: number | null;
  addHorizontalLine: (price: number, color?: string) => Promise<void>;
  removeHorizontalLine: (id: string) => Promise<void>;
  updateHorizontalLine: (
    id: string,
    updates: { price?: number; color?: string }
  ) => Promise<void>;
  refreshLines: () => Promise<void>;
}
