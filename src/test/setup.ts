// Vitest setup file — runs before each test file
import '@testing-library/jest-dom';

// Mock import.meta.env so modules that reference it don't throw
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: true,
    PROD: false,
    VITE_ENABLE_DEBUG_LOGGING: 'false',
    VITE_APP_NAME: 'TradeDash',
    VITE_APP_VERSION: '0.0.0-test',
    VITE_DEFAULT_SYMBOL: 'BTCUSDT',
    VITE_DEFAULT_TIMEFRAME: '1h',
    VITE_ENABLE_ANALYTICS: 'false',
    VITE_BINANCE_API_KEY: '',
    VITE_BYBIT_API_KEY: '',
  },
  writable: false,
});
