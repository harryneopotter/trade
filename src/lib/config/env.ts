// Environment configuration for API endpoints
export const ENV_CONFIG = {
  // Binance Futures WebSocket endpoints
  BINANCE_FUTURES_WS: 'wss://fstream.binance.com/ws',
  BINANCE_FUTURES_WS_STREAM: 'wss://fstream.binance.com/stream',

  // Bybit WebSocket endpoints (fallback)
  BYBIT_WS: 'wss://stream.bybit.com/v5/public',

  // Default symbols and timeframes
  DEFAULT_SYMBOL: 'BTCUSDT',
  DEFAULT_TIMEFRAME: '1h',

  // WebSocket reconnection settings
  WS_RECONNECT_DELAY: 1000, // 1 second initial delay
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_BACKOFF: 1.5, // Exponential backoff factor

  // Data caching settings
  CACHE_EXPIRY_MINUTES: 15,
  MAX_CACHED_CANDLES: 1000,

  // API rate limits
  MAX_WS_CONNECTIONS: 5,
  WS_MESSAGE_THROTTLE_MS: 100,
} as const;

export type EnvConfig = typeof ENV_CONFIG;
