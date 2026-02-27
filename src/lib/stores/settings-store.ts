/* eslint-disable no-console */
// Settings store for TradeDash
import { create } from 'zustand';
import type { SettingsState, Timeframe } from './types';
import {
  getSettings,
  saveSettings as saveSettingsToStorage,
} from '../storage/settings-storage';

// Default settings
const DEFAULT_TIMEFRAME: Timeframe = '1h';
const DEFAULT_CHART_LAYOUT: SettingsState['chartLayout'] = '2x2';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultTimeframe: DEFAULT_TIMEFRAME,
  chartLayout: DEFAULT_CHART_LAYOUT,
  showEMA9: true,
  showEMA21: true,
  sidebarOpen: true,

  updateSettings: async (
    settings: Partial<
      Omit<
        SettingsState,
        | 'updateSettings'
        | 'toggleEMA9'
        | 'toggleEMA21'
        | 'setChartLayout'
        | 'loadFromStorage'
      >
    >
  ) => {
    try {
      // Update local state
      set((state) => ({ ...state, ...settings }));

      // Persist to storage
      await saveSettingsToStorage(settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  toggleEMA9: async () => {
    const newValue = !get().showEMA9;
    try {
      set({ showEMA9: newValue });
      await saveSettingsToStorage({ showEMA9: newValue });
    } catch (error) {
      console.error('Failed to toggle EMA9:', error);
      // Revert on error
      set({ showEMA9: !newValue });
      throw error;
    }
  },

  toggleEMA21: async () => {
    const newValue = !get().showEMA21;
    try {
      set({ showEMA21: newValue });
      await saveSettingsToStorage({ showEMA21: newValue });
    } catch (error) {
      console.error('Failed to toggle EMA21:', error);
      // Revert on error
      set({ showEMA21: !newValue });
      throw error;
    }
  },

  setChartLayout: async (layout: SettingsState['chartLayout']) => {
    try {
      set({ chartLayout: layout });
      await saveSettingsToStorage({ chartLayout: layout });
    } catch (error) {
      console.error('Failed to set chart layout:', error);
      throw error;
    }
  },

  loadFromStorage: async () => {
    try {
      const settings = await getSettings();

      set({
        defaultTimeframe: settings.defaultTimeframe,
        chartLayout: settings.chartLayout,
        showEMA9: settings.showEMA9,
        showEMA21: settings.showEMA21,
        sidebarOpen: settings.sidebarOpen,
      });
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
    }
  },
}));
