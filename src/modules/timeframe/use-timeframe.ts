// Custom hook for timeframe operations
import { useCallback, useEffect } from 'react';
import { useTimeframeStore, useChartStore } from '../../lib/stores';
import {
  TIMEFRAME_OPTIONS,
  type Timeframe,
  type TimeframeOption,
} from './types';

interface UseTimeframeReturn {
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  nextTimeframe: () => void;
  previousTimeframe: () => void;
}

/**
 * Hook for accessing and modifying the current timeframe
 * Automatically syncs all charts when timeframe changes
 */
export function useTimeframe(): UseTimeframeReturn {
  const {
    timeframe,
    setTimeframe: setStoreTimeframe,
    nextTimeframe: storeNext,
    previousTimeframe: storePrev,
  } = useTimeframeStore();
  const { syncAllTimeframes } = useChartStore();

  // Wrap setTimeframe to also sync charts
  const setTimeframe = useCallback(
    (newTimeframe: Timeframe) => {
      setStoreTimeframe(newTimeframe);
      syncAllTimeframes(newTimeframe);
    },
    [setStoreTimeframe, syncAllTimeframes]
  );

  // Wrap nextTimeframe to also sync charts
  const nextTimeframe = useCallback(() => {
    storeNext();
    // Get the new timeframe after incrementing and sync charts
    const newTimeframe = useTimeframeStore.getState().timeframe;
    syncAllTimeframes(newTimeframe);
  }, [storeNext, syncAllTimeframes]);

  // Wrap previousTimeframe to also sync charts
  const previousTimeframe = useCallback(() => {
    storePrev();
    // Get the new timeframe after decrementing and sync charts
    const newTimeframe = useTimeframeStore.getState().timeframe;
    syncAllTimeframes(newTimeframe);
  }, [storePrev, syncAllTimeframes]);

  return {
    timeframe,
    setTimeframe,
    nextTimeframe,
    previousTimeframe,
  };
}

interface UseTimeframeOptionsReturn {
  options: TimeframeOption[];
  getOption: (value: Timeframe) => TimeframeOption | undefined;
  getCurrentOption: () => TimeframeOption | undefined;
}

/**
 * Hook for accessing timeframe options
 */
export function useTimeframeOptions(): UseTimeframeOptionsReturn {
  const { timeframe } = useTimeframeStore();

  const getOption = useCallback(
    (value: Timeframe): TimeframeOption | undefined => {
      return TIMEFRAME_OPTIONS.find((opt) => opt.value === value);
    },
    []
  );

  const getCurrentOption = useCallback((): TimeframeOption | undefined => {
    return getOption(timeframe);
  }, [timeframe, getOption]);

  return {
    options: TIMEFRAME_OPTIONS,
    getOption,
    getCurrentOption,
  };
}

/**
 * Hook for keyboard navigation of timeframes
 * ArrowLeft/ArrowRight to navigate between timeframes
 */
export function useTimeframeKeyboard(): void {
  const { nextTimeframe, previousTimeframe } = useTimeframe();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          previousTimeframe();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextTimeframe();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextTimeframe, previousTimeframe]);
}
