// Type definitions for the timeframe module

export type Timeframe = '15m' | '1h' | '4h' | '8h';

export interface TimeframeOption {
  value: Timeframe;
  label: string;
  description: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: '15m', label: '15m', description: '15 minutes' },
  { value: '1h', label: '1H', description: '1 hour' },
  { value: '4h', label: '4H', description: '4 hours' },
  { value: '8h', label: '8H', description: '8 hours' },
];
