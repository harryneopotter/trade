// Indicator module types for TradeDash

/**
 * Configuration for a single indicator
 */
export interface IndicatorConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  period: number;
  visible: boolean;
}

/**
 * Supported indicator types
 */
export type IndicatorType = 'ema9' | 'ema21';

/**
 * Props for the IndicatorsPanel component
 */
export interface IndicatorsPanelProps {
  /** Chart index to control. If undefined, controls apply to all charts */
  chartIndex?: number;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Props for the IndicatorToggle component
 */
export interface IndicatorToggleProps {
  /** Indicator configuration */
  config: IndicatorConfig;
  /** Whether the indicator is currently enabled */
  enabled: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Compact mode for smaller spaces */
  compact?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * EMA preset configuration
 */
export interface EMAPreset {
  type: IndicatorType;
  period: number;
  color: string;
  name: string;
  description: string;
}

/**
 * Default EMA configurations
 */
export const EMA_PRESETS: Record<IndicatorType, EMAPreset> = {
  ema9: {
    type: 'ema9',
    period: 9,
    color: '#3b82f6', // blue-500
    name: 'EMA 9',
    description: 'Short-term trend',
  },
  ema21: {
    type: 'ema21',
    period: 21,
    color: '#f97316', // orange-500
    name: 'EMA 21',
    description: 'Medium-term trend',
  },
};
