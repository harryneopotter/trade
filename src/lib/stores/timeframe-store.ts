// Timeframe store for TradeDash
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TimeframeState, Timeframe } from './types';
import { getSetting, saveSettings } from '../storage/settings-storage';

// Available timeframes in order
const TIMEFRAMES: Timeframe[] = ['15m', '1h', '4h', '8h'];

// Default timeframe
const DEFAULT_TIMEFRAME: Timeframe = '1h';

export const useTimeframeStore = create<TimeframeState>()(
  persist(
    (set, get) => ({
      timeframe: DEFAULT_TIMEFRAME,

      setTimeframe: (timeframe: Timeframe) => {
        set({ timeframe });
        // Also update settings storage
        saveSettings({ defaultTimeframe: timeframe }).catch((error) => {
          console.error('Failed to save timeframe to settings:', error);
        });
      },

      nextTimeframe: () => {
        const currentIndex = TIMEFRAMES.indexOf(get().timeframe);
        const nextIndex = (currentIndex + 1) % TIMEFRAMES.length;
        const nextTimeframe = TIMEFRAMES[nextIndex];
        get().setTimeframe(nextTimeframe);
      },

      previousTimeframe: () => {
        const currentIndex = TIMEFRAMES.indexOf(get().timeframe);
        const prevIndex =
          (currentIndex - 1 + TIMEFRAMES.length) % TIMEFRAMES.length;
        const prevTimeframe = TIMEFRAMES[prevIndex];
        get().setTimeframe(prevTimeframe);
      },
    }),
    {
      name: 'timeframe-storage',
      // Only persist the timeframe state
      partialize: (state) => ({ timeframe: state.timeframe }),
    }
  )
);

// Initialize timeframe from settings storage
export async function initTimeframeStore(): Promise<void> {
  try {
    const savedTimeframe = await getSetting('defaultTimeframe');
    if (savedTimeframe && TIMEFRAMES.includes(savedTimeframe as Timeframe)) {
      useTimeframeStore.setState({ timeframe: savedTimeframe as Timeframe });
    }
  } catch (error) {
    console.error('Failed to initialize timeframe store:', error);
  }
}
