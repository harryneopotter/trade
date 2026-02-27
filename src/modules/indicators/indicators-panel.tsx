// Main indicators panel component for TradeDash
import { useState, useCallback } from 'react';
import { IndicatorToggle } from './indicator-toggle';
import {
  useIndicatorsForChart,
  useGlobalIndicators,
  useApplyGlobalIndicators,
} from './use-indicators';
import type { IndicatorsPanelProps } from './types';

type PanelMode = 'chart' | 'global';

/**
 * IndicatorsPanel component
 *
 * A panel for controlling EMA indicator visibility.
 * Can be used per-chart or globally.
 *
 * Features:
 * - Toggle EMA 9 and EMA 21 on/off
 * - Per-chart or global mode
 * - Reset to defaults button
 * - Compact mode for smaller spaces
 */
export function IndicatorsPanel({
  chartIndex,
  compact = false,
  className = '',
}: IndicatorsPanelProps) {
  const [mode, setMode] = useState<PanelMode>(
    chartIndex !== undefined ? 'chart' : 'global'
  );

  // Get chart-specific indicators
  const {
    indicators: chartIndicators,
    toggleEMA9: toggleChartEMA9,
    toggleEMA21: toggleChartEMA21,
  } = useIndicatorsForChart(chartIndex ?? 0);

  // Get global indicators
  const {
    indicators: globalIndicators,
    toggleEMA9: toggleGlobalEMA9,
    toggleEMA21: toggleGlobalEMA21,
  } = useGlobalIndicators();

  // Apply global settings to all charts
  const applyGlobalToAll = useApplyGlobalIndicators();

  // Determine which indicators and toggles to use based on mode
  const indicators =
    mode === 'chart' && chartIndex !== undefined
      ? chartIndicators
      : globalIndicators;

  const handleToggleEMA9 = useCallback(() => {
    if (mode === 'chart' && chartIndex !== undefined) {
      toggleChartEMA9();
    } else {
      toggleGlobalEMA9();
    }
  }, [mode, chartIndex, toggleChartEMA9, toggleGlobalEMA9]);

  const handleToggleEMA21 = useCallback(() => {
    if (mode === 'chart' && chartIndex !== undefined) {
      toggleChartEMA21();
    } else {
      toggleGlobalEMA21();
    }
  }, [mode, chartIndex, toggleChartEMA21, toggleGlobalEMA21]);

  const handleReset = useCallback(() => {
    // Reset to defaults (both EMAs enabled)
    if (mode === 'chart' && chartIndex !== undefined) {
      const ema9Config = indicators.find((i) => i.id === 'ema9');
      const ema21Config = indicators.find((i) => i.id === 'ema21');
      if (ema9Config && !ema9Config.visible) {
        toggleChartEMA9();
      }
      if (ema21Config && !ema21Config.visible) {
        toggleChartEMA21();
      }
    } else {
      // Reset global settings
      applyGlobalToAll();
    }
  }, [
    mode,
    chartIndex,
    indicators,
    toggleChartEMA9,
    toggleChartEMA21,
    applyGlobalToAll,
  ]);

  const ema9Config = indicators.find((i) => i.id === 'ema9');
  const ema21Config = indicators.find((i) => i.id === 'ema21');

  if (!ema9Config || !ema21Config) {
    return null;
  }

  return (
    <div
      className={`${compact ? 'p-2' : 'p-3'} rounded-lg ${className}`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between ${compact ? 'mb-2' : 'mb-3'}`}
      >
        <h3
          className={`font-semibold ${compact ? 'text-xs' : 'text-sm'}`}
          style={{ color: 'var(--text-primary)' }}
        >
          Indicators
        </h3>

        {/* Mode toggle (only show if chartIndex is provided) */}
        {chartIndex !== undefined && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode('chart')}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                mode === 'chart'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'hover:bg-[var(--bg-tertiary)]'
              }`}
              style={{
                color: mode === 'chart' ? 'white' : 'var(--text-secondary)',
              }}
            >
              This Chart
            </button>
            <button
              type="button"
              onClick={() => setMode('global')}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                mode === 'global'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'hover:bg-[var(--bg-tertiary)]'
              }`}
              style={{
                color: mode === 'global' ? 'white' : 'var(--text-secondary)',
              }}
            >
              Global
            </button>
          </div>
        )}
      </div>

      {/* Indicator toggles */}
      <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
        <IndicatorToggle
          config={ema9Config}
          enabled={ema9Config.visible}
          onToggle={handleToggleEMA9}
          compact={compact}
        />
        <IndicatorToggle
          config={ema21Config}
          enabled={ema21Config.visible}
          onToggle={handleToggleEMA21}
          compact={compact}
        />
      </div>

      {/* Footer with reset button */}
      {!compact && (
        <div
          className="mt-3 pt-2 border-t"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="text-xs w-full py-1.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * CompactIndicatorsPanel - A minimal version for chart headers
 *
 * Shows just the toggles in a dropdown-friendly format
 */
export function CompactIndicatorsPanel({
  chartIndex,
  className = '',
}: Omit<IndicatorsPanelProps, 'compact'>) {
  return (
    <IndicatorsPanel
      chartIndex={chartIndex}
      compact={true}
      className={className}
    />
  );
}
