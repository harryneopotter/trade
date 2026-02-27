/* eslint-disable no-console */
// Chart store for TradeDash
import { create } from 'zustand';
import type { ChartState, ChartConfig, Timeframe } from './types';
import { getChartStates, saveChartState } from '../storage/chart-state-storage';

// Default chart symbols
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const DEFAULT_TIMEFRAME: Timeframe = '1h';

// Create default chart configuration
const createDefaultChart = (index: number): ChartConfig => ({
  symbol: DEFAULT_SYMBOLS[index] || 'BTCUSDT',
  timeframe: DEFAULT_TIMEFRAME,
  showEMA9: true,
  showEMA21: true,
});

// Create initial charts array
const createDefaultCharts = (): ChartConfig[] =>
  Array.from({ length: 4 }, (_, i) => createDefaultChart(i));

export const useChartStore = create<ChartState>((set) => ({
  charts: createDefaultCharts(),

  setChartSymbol: async (index: number, symbol: string) => {
    const upperSymbol = symbol.toUpperCase().trim();
    if (index < 0 || index >= 4) {
      console.error(`Invalid chart index: ${index}`);
      return;
    }

    try {
      // Update state
      set((state) => {
        const newCharts = [...state.charts];
        newCharts[index] = { ...newCharts[index], symbol: upperSymbol };
        return { charts: newCharts };
      });

      // Persist to storage
      await saveChartState(index, upperSymbol);
    } catch (error) {
      console.error(`Failed to set chart symbol for chart ${index}:`, error);
      throw error;
    }
  },

  setChartTimeframe: (index: number, timeframe: Timeframe) => {
    if (index < 0 || index >= 4) {
      console.error(`Invalid chart index: ${index}`);
      return;
    }

    set((state) => {
      const newCharts = [...state.charts];
      newCharts[index] = { ...newCharts[index], timeframe };
      return { charts: newCharts };
    });
  },

  syncAllTimeframes: (timeframe: Timeframe) => {
    set((state) => ({
      charts: state.charts.map((chart) => ({ ...chart, timeframe })),
    }));
  },

  toggleChartEMA9: (index: number) => {
    if (index < 0 || index >= 4) {
      console.error(`Invalid chart index: ${index}`);
      return;
    }

    set((state) => {
      const newCharts = [...state.charts];
      newCharts[index] = {
        ...newCharts[index],
        showEMA9: !newCharts[index].showEMA9,
      };
      return { charts: newCharts };
    });
  },

  toggleChartEMA21: (index: number) => {
    if (index < 0 || index >= 4) {
      console.error(`Invalid chart index: ${index}`);
      return;
    }

    set((state) => {
      const newCharts = [...state.charts];
      newCharts[index] = {
        ...newCharts[index],
        showEMA21: !newCharts[index].showEMA21,
      };
      return { charts: newCharts };
    });
  },

  resetToDefaults: () => {
    set({ charts: createDefaultCharts() });
    // Save defaults to storage
    DEFAULT_SYMBOLS.forEach((symbol, index) => {
      saveChartState(index, symbol).catch((error) => {
        console.error(
          `Failed to save default chart state for chart ${index}:`,
          error
        );
      });
    });
  },

  loadFromStorage: async () => {
    try {
      const chartStates = await getChartStates();

      if (chartStates.length > 0) {
        set((state) => {
          const newCharts = [...state.charts];

          // Update charts based on stored states
          for (const chartState of chartStates) {
            if (chartState.chartIndex >= 0 && chartState.chartIndex < 4) {
              newCharts[chartState.chartIndex] = {
                ...newCharts[chartState.chartIndex],
                symbol: chartState.symbol,
              };
            }
          }

          return { charts: newCharts };
        });
      } else {
        // No stored chart states, save defaults
        for (let i = 0; i < 4; i++) {
          try {
            await saveChartState(i, DEFAULT_SYMBOLS[i] || 'BTCUSDT');
          } catch (error) {
            console.error(
              `Failed to save default chart state for chart ${i}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to load chart states from storage:', error);
    }
  },
}));
