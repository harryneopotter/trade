/* eslint-disable no-console */
// Settings storage operations for TradeDash
import { getDB } from './db';
import type { UserSettings } from './types';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  id: 'user-settings',
  defaultTimeframe: '1h',
  chartLayout: '2x2',
  showEMA9: true,
  showEMA21: true,
  sidebarOpen: true,
  lastUpdated: Date.now(),
};

/**
 * Get user settings from storage
 * Returns default settings if none exist
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const db = await getDB();
    const settings = await db.get('settings', 'user-settings');

    if (!settings) {
      // Return default settings without saving them
      return { ...DEFAULT_SETTINGS };
    }

    return settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    // Return default settings on error
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save user settings to storage
 * Only updates the provided fields, preserves existing values for others
 */
export async function saveSettings(
  settings: Partial<Omit<UserSettings, 'id'>>
): Promise<void> {
  try {
    const db = await getDB();

    // Get existing settings or use defaults
    const existingSettings = await db.get('settings', 'user-settings');
    const currentSettings = existingSettings || DEFAULT_SETTINGS;

    // Merge with updates
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...settings,
      id: 'user-settings', // Ensure id is always set
      lastUpdated: Date.now(),
    };

    await db.put('settings', updatedSettings);
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    const db = await getDB();
    const defaultSettings: UserSettings = {
      ...DEFAULT_SETTINGS,
      lastUpdated: Date.now(),
    };

    await db.put('settings', defaultSettings);
    console.log('Settings reset to defaults');
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw new Error('Failed to reset settings');
  }
}

/**
 * Get a specific setting value
 */
export async function getSetting<K extends keyof UserSettings>(
  key: K
): Promise<UserSettings[K]> {
  try {
    const settings = await getSettings();
    return settings[key];
  } catch (error) {
    console.error(`Failed to get setting ${String(key)}:`, error);
    return DEFAULT_SETTINGS[key];
  }
}

/**
 * Check if settings exist in storage
 */
export async function hasSettings(): Promise<boolean> {
  try {
    const db = await getDB();
    const settings = await db.get('settings', 'user-settings');
    return !!settings;
  } catch (error) {
    console.error('Failed to check if settings exist:', error);
    return false;
  }
}
