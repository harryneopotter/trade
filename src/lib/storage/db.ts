// Database initialization and connection management for TradeDash
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  WatchlistItem,
  HorizontalLine,
  UserSettings,
  ChartState,
} from './types';

/**
 * Database name
 */
const DB_NAME = 'tradedash-db';

/**
 * Database version
 */
const DB_VERSION = 1;

/**
 * Database schema interface for idb
 */
interface TradeDashDBSchema extends DBSchema {
  watchlist: {
    key: string;
    value: WatchlistItem;
    indexes: { byOrder: number; bySymbol: string };
  };
  horizontalLines: {
    key: string;
    value: HorizontalLine;
    indexes: { bySymbol: string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  chartState: {
    key: string;
    value: ChartState;
    indexes: { byChartIndex: number };
  };
}

/**
 * Database instance cache
 */
let dbInstance: IDBPDatabase<TradeDashDBSchema> | null = null;

/**
 * Initialize and open the IndexedDB database
 * Creates object stores if they don't exist
 */
export async function initDB(): Promise<IDBPDatabase<TradeDashDBSchema>> {
  try {
    const db = await openDB<TradeDashDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${newVersion}`
        );

        // Create watchlist object store
        if (!db.objectStoreNames.contains('watchlist')) {
          const watchlistStore = db.createObjectStore('watchlist', {
            keyPath: 'id',
          });
          watchlistStore.createIndex('byOrder', 'order', { unique: false });
          watchlistStore.createIndex('bySymbol', 'symbol', { unique: true });
          console.log('Created watchlist object store');
        }

        // Create horizontalLines object store
        if (!db.objectStoreNames.contains('horizontalLines')) {
          const linesStore = db.createObjectStore('horizontalLines', {
            keyPath: 'id',
          });
          linesStore.createIndex('bySymbol', 'symbol', { unique: false });
          console.log('Created horizontalLines object store');
        }

        // Create settings object store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
          console.log('Created settings object store');
        }

        // Create chartState object store
        if (!db.objectStoreNames.contains('chartState')) {
          const chartStateStore = db.createObjectStore('chartState', {
            keyPath: 'id',
          });
          chartStateStore.createIndex('byChartIndex', 'chartIndex', {
            unique: true,
          });
          console.log('Created chartState object store');
        }
      },
    });

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error('Database initialization failed');
  }
}

/**
 * Get the database instance (creates if not exists)
 */
export async function getDB(): Promise<IDBPDatabase<TradeDashDBSchema>> {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('Database connection closed');
  }
}

/**
 * Delete the entire database (useful for testing/reset)
 */
export async function deleteDB(): Promise<void> {
  try {
    closeDB();
    await openDB(DB_NAME, DB_VERSION).then((db) => {
      db.close();
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      return new Promise<void>((resolve, reject) => {
        deleteRequest.onsuccess = () => {
          console.log('Database deleted successfully');
          resolve();
        };
        deleteRequest.onerror = () => {
          console.error('Failed to delete database');
          reject(new Error('Failed to delete database'));
        };
        deleteRequest.onblocked = () => {
          console.warn('Database deletion blocked');
          reject(new Error('Database deletion blocked'));
        };
      });
    });
  } catch (error) {
    console.error('Error deleting database:', error);
    throw error;
  }
}

// Export types for use in other storage modules
export type { TradeDashDBSchema };
