// Indicators module for TradeDash
// Provides EMA indicator controls for charts

// Components
export { IndicatorToggle } from './indicator-toggle';
export { IndicatorsPanel, CompactIndicatorsPanel } from './indicators-panel';

// Hooks
export {
  useIndicatorToggle,
  useIndicatorsForChart,
  useGlobalIndicators,
  useApplyGlobalIndicators,
  getEMAPreset,
} from './use-indicators';

// Types
export type {
  IndicatorConfig,
  IndicatorType,
  IndicatorsPanelProps,
  IndicatorToggleProps,
  EMAPreset,
} from './types';

// Constants
export { EMA_PRESETS } from './types';
