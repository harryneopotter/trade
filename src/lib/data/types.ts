// WebSocket Data Types for TradeDash

// Binance WebSocket Message Types
export type BinanceWebSocketMessage = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  k?: BinanceCandleData; // Candle data (for kline events)
  t?: BinanceTickerData; // Ticker data (for ticker events)
};

// Binance Candle (Kline) Data
export type BinanceCandleData = {
  t: number; // Kline start time
  T: number; // Kline close time
  s: string; // Symbol
  i: string; // Interval
  f: number; // First trade ID
  L: number; // Last trade ID
  o: string; // Open price
  c: string; // Close price
  h: string; // High price
  l: string; // Low price
  v: string; // Base asset volume
  n: number; // Number of trades
  x: boolean; // Is this kline closed?
  q: string; // Quote asset volume
  V: string; // Taker buy base asset volume
  Q: string; // Taker buy quote asset volume
  B: string; // Ignore
};

// Binance Ticker Data
export type BinanceTickerData = {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price change
  P: string; // Price change percent
  w: string; // Weighted average price
  x: string; // First trade(F)-1 price (first trade before the 24hr rolling window)
  c: string; // Last price
  Q: string; // Last quantity
  b: string; // Best bid price
  B: string; // Best bid quantity
  a: string; // Best ask price
  A: string; // Best ask quantity
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
  O: number; // Statistics open time
  C: number; // Statistics close time
  F: number; // First trade ID
  L: number; // Last trade ID
  n: number; // Total number of trades
};

// Bybit WebSocket Message Types
export type BybitWebSocketMessage = {
  topic: string;
  type: string;
  data: BybitCandleData | BybitTickerData;
  ts: number;
};

// Bybit Candle Data
export type BybitCandleData = {
  symbol: string;
  start: number;
  end: number;
  interval: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
  confirm: boolean;
  timestamp: number;
};

// Bybit Ticker Data
export type BybitTickerData = {
  symbol: string;
  lastPrice: string;
  price24hPcnt: string;
  highPrice24h: string;
  lowPrice24h: string;
  turnover24h: string;
  volume24h: string;
  usdIndexPrice: string;
  bid1Price: string;
  bid1Size: string;
  ask1Price: string;
  ask1Size: string;
};

// Normalized Data Types (used internally by TradeDash)
export type NormalizedCandle = {
  symbol: string;
  timeframe: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  source: 'binance' | 'bybit';
};

export type NormalizedTicker = {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
  source: 'binance' | 'bybit';
};

// WebSocket Connection Status
export type WebSocketStatus = {
  isConnected: boolean;
  currentEndpoint: string | null;
  reconnectAttempts: number;
  lastMessageTime: number | null;
  activeSubscriptions: string[];
};

// WebSocket Events
export type WebSocketEvent = {
  type: 'connected' | 'disconnected' | 'error' | 'message' | 'reconnecting';
  data?: any;
  timestamp: number;
};

// Subscription Types
export type WebSocketSubscription = {
  symbol: string;
  type: 'candle' | 'ticker';
  timeframe?: string; // Required for candle subscriptions
  source: 'binance' | 'bybit';
};
