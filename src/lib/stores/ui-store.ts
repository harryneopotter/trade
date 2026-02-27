/* eslint-disable no-console */
// UI store for TradeDash
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState } from './types';
import { getSetting, saveSettings } from '../storage/settings-storage';

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      connectionStatus: 'disconnected',
      activeModal: null,

      toggleSidebar: () => {
        const newState = !get().sidebarOpen;
        set({ sidebarOpen: newState });
        // Persist to settings storage
        saveSettings({ sidebarOpen: newState }).catch((error) => {
          console.error('Failed to save sidebar state:', error);
        });
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
        // Persist to settings storage
        saveSettings({ sidebarOpen: open }).catch((error) => {
          console.error('Failed to save sidebar state:', error);
        });
      },

      setConnectionStatus: (status: UIState['connectionStatus']) => {
        set({ connectionStatus: status });
      },

      openModal: (modal: string) => {
        set({ activeModal: modal });
      },

      closeModal: () => {
        set({ activeModal: null });
      },
    }),
    {
      name: 'ui-storage',
      // Only persist sidebar state
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);

// Initialize UI store from settings
export async function initUIStore(): Promise<void> {
  try {
    const sidebarOpen = await getSetting('sidebarOpen');
    if (typeof sidebarOpen === 'boolean') {
      useUIStore.setState({ sidebarOpen });
    }
  } catch (error) {
    console.error('Failed to initialize UI store:', error);
  }
}
