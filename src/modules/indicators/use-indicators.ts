// Custom hooks for indicator operations
import { useCallback, useMemo } from 'react';
import { useChartStore, useSettingsStore } from '../../lib/stores';
import type { IndicatorType, IndicatorConfig, EMAPreset } from './types';
import { EMA_PRESETS } from './types';

/**
 * Hook to toggle a specific indicator for a chart
 *
 * @param chartIndex - The chart index (0-3)
 * @param indicator - The indicator type to toggle
 * @returns Object with toggle function and current state
 */
export function useIndicatorToggle(
  chartIndex: number,
  indicator: IndicatorType
) {
  const { charts, toggleChartEMA9, toggleChartEMA21 } = useChartStore();

  const isEnabled = useMemo(() => {
    if (chartIndex < 0 || chartIndex >= charts.length) {
      return false;
    }
    const chart = charts[chartIndex];
    return indicator === 'ema9' ? chart.showEMA9 : chart.showEMA21;
  }, [charts, chartIndex, indicator]);

  const toggle = useCallback(() => {
    if (indicator === 'ema9') {
      toggleChartEMA9(chartIndex);
    } else {
      toggleChartEMA21(chartIndex);
    }
  }, [indicator, chartIndex, toggleChartEMA9, toggleChartEMA21]);

  return {
    isEnabled,
    toggle,
  };
}

/**
 * Hook to get all indicators for a specific chart
 *
 * @param chartIndex - The chart index (0-3)
 * @returns Object with indicator configs and toggle functions
 */
export function useIndicatorsForChart(chartIndex: number) {
  const { charts, toggleChartEMA9, toggleChartEMA21 } = useChartStore();

  const chart = useMemo(() => {
    if (chartIndex < 0 || chartIndex >= charts.length) {
      return null;
    }
    return charts[chartIndex];
  }, [charts, chartIndex]);

  const indicators: IndicatorConfig[] = useMemo(() => {
    if (!chart) {
      return [];
    }

    return [
      {
        id: 'ema9',
        name: EMA_PRESETS.ema9.name,
        description: EMA_PRESETS.ema9.description,
        color: EMA_PRESETS.ema9.color,
        period: EMA_PRESETS.ema9.period,
        visible: chart.showEMA9,
      },
      {
        id: 'ema21',
        name: EMA_PRESETS.ema21.name,
        description: EMA_PRESETS.ema21.description,
        color: EMA_PRESETS.ema21.color,
        period: EMA_PRESETS.ema21.period,
        visible: chart.showEMA21,
      },
    ];
  }, [chart]);

  const toggleEMA9 = useCallback(() => {
    toggleChartEMA9(chartIndex);
  }, [chartIndex, toggleChartEMA9]);

  const toggleEMA21 = useCallback(() => {
    toggleChartEMA21(chartIndex);
  }, [chartIndex, toggleChartEMA21]);

  return {
    indicators,
    toggleEMA9,
    toggleEMA21,
    isLoading: !chart,
  };
}

/**
 * Hook to get/set global default indicators
 *
 * @returns Object with global indicator state and toggle functions
 */
export function useGlobalIndicators() {
  const { showEMA9, showEMA21, toggleEMA9, toggleEMA21 } = useSettingsStore();

  const indicators: IndicatorConfig[] = useMemo(
    () => [
      {
        id: 'ema9',
        name: EMA_PRESETS.ema9.name,
        description: EMA_PRESETS.ema9.description,
        color: EMA_PRESETS.ema9.color,
        period: EMA_PRESETS.ema9.period,
        visible: showEMA9,
      },
      {
        id: 'ema21',
        name: EMA_PRESETS.ema21.name,
        description: EMA_PRESETS.ema21.description,
        color: EMA_PRESETS.ema21.color,
        period: EMA_PRESETS.ema21.period,
        visible: showEMA21,
      },
    ],
    [showEMA9, showEMA21]
  );

  return {
    indicators,
    showEMA9,
    showEMA21,
    toggleEMA9,
    toggleEMA21,
  };
}

/**
 * Hook to apply global indicator settings to all charts
 *
 * @returns Function to apply global settings to all charts
 */
export function useApplyGlobalIndicators() {
  const { charts, toggleChartEMA9, toggleChartEMA21 } = useChartStore();
  const { showEMA9, showEMA21 } = useSettingsStore();

  const applyToAll = useCallback(() => {
    charts.forEach((chart, index) => {
      // Only toggle if the current state doesn't match the global setting
      if (chart.showEMA9 !== showEMA9) {
        toggleChartEMA9(index);
      }
      if (chart.showEMA21 !== showEMA21) {
        toggleChartEMA21(index);
      }
    });
  }, [charts, showEMA9, showEMA21, toggleChartEMA9, toggleChartEMA21]);

  return applyToAll;
}

/**
 * Get the EMA preset configuration for a specific indicator type
 *
 * @param type - The indicator type
 * @returns The EMA preset configuration
 */
export function getEMAPreset(type: IndicatorType): EMAPreset {
  return EMA_PRESETS[type];
}
