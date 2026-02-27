// Horizontal line manager for TradeDash charts
// Provides utilities for creating, updating, and removing price lines

import { LineSeries } from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  LineData,
  LineWidth,
  Time,
} from 'lightweight-charts';
import type { HorizontalLineData } from './types';

// Default line styling
const DEFAULT_LINE_COLOR = '#f59e0b'; // amber-500
const DEFAULT_LINE_WIDTH: LineWidth = 1;
const DEFAULT_LINE_STYLE = 2; // Dashed line

/**
 * Options for creating a price line
 */
export interface PriceLineOptions {
  color?: string;
  lineWidth?: LineWidth;
  lineStyle?: number;
  title?: string;
  lastValueVisible?: boolean;
  priceLineVisible?: boolean;
}

/**
 * Manager class for horizontal price lines on charts
 */
export class HorizontalLineManager {
  private chart: IChartApi | null = null;
  private lines: Map<string, ISeriesApi<'Line'>> = new Map();
  private lineData: Map<string, HorizontalLineData> = new Map();

  /**
   * Initialize the manager with a chart instance
   */
  constructor(chart: IChartApi) {
    this.chart = chart;
  }

  /**
   * Create a new price line on the chart
   */
  createPriceLine(
    lineData: HorizontalLineData,
    timeRange: { start: number; end: number },
    options?: PriceLineOptions
  ): ISeriesApi<'Line'> | null {
    if (!this.chart) return null;

    const {
      color = DEFAULT_LINE_COLOR,
      lineWidth = DEFAULT_LINE_WIDTH,
      lineStyle = DEFAULT_LINE_STYLE,
      title,
      lastValueVisible = true,
      priceLineVisible = false,
    } = options || {};

    // Create line series
    const series = this.chart.addSeries(LineSeries, {
      color,
      lineWidth,
      lineStyle,
      lastValueVisible,
      priceLineVisible,
      title: title || `Level ${lineData.price.toFixed(2)}`,
    });

    // Set the horizontal line data (same price across time range)
    const data: LineData<Time>[] = [
      { time: timeRange.start as Time, value: lineData.price },
      { time: timeRange.end as Time, value: lineData.price },
    ];

    series.setData(data);

    // Store references
    this.lines.set(lineData.id, series);
    this.lineData.set(lineData.id, lineData);

    return series;
  }

  /**
   * Update an existing price line with new price
   */
  updatePriceLine(
    id: string,
    newPrice: number,
    timeRange: { start: number; end: number }
  ): boolean {
    const series = this.lines.get(id);
    if (!series) return false;

    // Update line data with new price
    const data: LineData<Time>[] = [
      { time: timeRange.start as Time, value: newPrice },
      { time: timeRange.end as Time, value: newPrice },
    ];

    series.setData(data);

    // Update stored data
    const existingData = this.lineData.get(id);
    if (existingData) {
      this.lineData.set(id, { ...existingData, price: newPrice });
    }

    return true;
  }

  /**
   * Update line color
   */
  updateLineColor(id: string, color: string): boolean {
    const series = this.lines.get(id);
    if (!series) return false;

    series.applyOptions({ color });

    // Update stored data
    const existingData = this.lineData.get(id);
    if (existingData) {
      this.lineData.set(id, { ...existingData, color });
    }

    return true;
  }

  /**
   * Remove a specific price line
   */
  removePriceLine(id: string): boolean {
    const series = this.lines.get(id);
    if (!series || !this.chart) return false;

    this.chart.removeSeries(series);
    this.lines.delete(id);
    this.lineData.delete(id);

    return true;
  }

  /**
   * Remove all price lines
   */
  removeAllLines(): void {
    if (!this.chart) return;

    this.lines.forEach((series) => {
      this.chart?.removeSeries(series);
    });

    this.lines.clear();
    this.lineData.clear();
  }

  /**
   * Sync all lines with current chart data
   * Adds new lines, updates existing, removes deleted
   */
  syncLines(
    lines: HorizontalLineData[],
    timeRange: { start: number; end: number }
  ): void {
    if (!this.chart) return;

    const currentIds = new Set(lines.map((l) => l.id));

    // Remove lines that no longer exist
    this.lines.forEach((_, id) => {
      if (!currentIds.has(id)) {
        this.removePriceLine(id);
      }
    });

    // Add or update lines
    lines.forEach((line) => {
      const existingSeries = this.lines.get(line.id);

      if (!existingSeries) {
        // Create new line
        this.createPriceLine(line, timeRange, {
          color: line.color,
          lastValueVisible: true,
          priceLineVisible: false,
        });
      } else {
        // Update existing line if price changed
        const existingData = this.lineData.get(line.id);
        if (existingData && existingData.price !== line.price) {
          this.updatePriceLine(line.id, line.price, timeRange);
        }
        // Update color if changed
        if (existingData && existingData.color !== line.color) {
          this.updateLineColor(line.id, line.color);
        }
      }
    });
  }

  /**
   * Get all line IDs
   */
  getLineIds(): string[] {
    return Array.from(this.lines.keys());
  }

  /**
   * Get line data by ID
   */
  getLineData(id: string): HorizontalLineData | undefined {
    return this.lineData.get(id);
  }

  /**
   * Check if a line exists
   */
  hasLine(id: string): boolean {
    return this.lines.has(id);
  }

  /**
   * Get count of active lines
   */
  getLineCount(): number {
    return this.lines.size;
  }

  /**
   * Clean up all resources
   */
  dispose(): void {
    this.removeAllLines();
    this.chart = null;
  }
}

/**
 * Create a price line on the chart (standalone function)
 */
export function createPriceLine(
  chart: IChartApi,
  lineData: HorizontalLineData,
  timeRange: { start: number; end: number },
  options?: PriceLineOptions
): ISeriesApi<'Line'> {
  const {
    color = DEFAULT_LINE_COLOR,
    lineWidth = DEFAULT_LINE_WIDTH,
    lineStyle = DEFAULT_LINE_STYLE,
    title,
    lastValueVisible = true,
    priceLineVisible = false,
  } = options || {};

  const series = chart.addSeries(LineSeries, {
    color,
    lineWidth,
    lineStyle,
    lastValueVisible,
    priceLineVisible,
    title: title || `Level ${lineData.price.toFixed(2)}`,
  });

  const data: LineData<Time>[] = [
    { time: timeRange.start as Time, value: lineData.price },
    { time: timeRange.end as Time, value: lineData.price },
  ];

  series.setData(data);

  return series;
}

/**
 * Update a price line with new price
 */
export function updatePriceLine(
  line: ISeriesApi<'Line'>,
  price: number,
  timeRange: { start: number; end: number }
): void {
  const data: LineData<Time>[] = [
    { time: timeRange.start as Time, value: price },
    { time: timeRange.end as Time, value: price },
  ];

  line.setData(data);
}

/**
 * Remove a price line from the chart
 */
export function removePriceLine(
  chart: IChartApi,
  line: ISeriesApi<'Line'>
): void {
  chart.removeSeries(line);
}

/**
 * Sync all lines with chart - removes old, adds new, updates existing
 */
export function syncLinesWithChart(
  chart: IChartApi,
  lines: HorizontalLineData[],
  timeRange: { start: number; end: number },
  lineRefs: Map<string, ISeriesApi<'Line'>>
): void {
  const currentIds = new Set(lines.map((l) => l.id));

  // Remove lines that no longer exist
  lineRefs.forEach((series, id) => {
    if (!currentIds.has(id)) {
      chart.removeSeries(series);
      lineRefs.delete(id);
    }
  });

  // Add or update lines
  lines.forEach((line) => {
    let series = lineRefs.get(line.id);

    if (!series) {
      // Create new line
      series = createPriceLine(chart, line, timeRange, {
        color: line.color,
        lastValueVisible: true,
        priceLineVisible: false,
      });
      lineRefs.set(line.id, series);
    } else {
      // Update existing line
      updatePriceLine(series, line.price, timeRange);
      // Update color if needed
      series.applyOptions({ color: line.color });
    }
  });
}
