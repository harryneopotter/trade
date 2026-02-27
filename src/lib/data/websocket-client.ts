// WebSocket Client for TradeDash
// Handles Binance/Bybit connections with automatic reconnection and fallback

/* eslint-disable no-console */
import { ENV_CONFIG } from '../config/env';
import type {
  BinanceWebSocketMessage,
  BybitWebSocketMessage,
  NormalizedCandle,
  NormalizedTicker,
  WebSocketStatus,
  WebSocketEvent,
  WebSocketSubscription,
} from './types';

// WebSocket Client State
let websocket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let currentEndpoint: string | null = null;
let activeSubscriptions: WebSocketSubscription[] = [];
let eventListeners: ((event: WebSocketEvent) => void)[] = [];
let dataListeners: ((data: NormalizedCandle | NormalizedTicker) => void)[] = [];

// Connection Status
const getStatus = (): WebSocketStatus => ({
  isConnected: websocket?.readyState === WebSocket.OPEN,
  currentEndpoint,
  reconnectAttempts,
  lastMessageTime:
    (websocket as WebSocket & { lastMessageTime?: number })?.lastMessageTime ||
    null,
  activeSubscriptions: activeSubscriptions.map(
    (sub) => `${sub.symbol}_${sub.type}_${sub.timeframe || ''}`
  ),
});

// Normalize Binance Candle Data
const normalizeBinanceCandle = (
  symbol: string,
  candle: any,
  timeframe: string
): NormalizedCandle => ({
  symbol,
  timeframe,
  timestamp: candle.T,
  open: parseFloat(candle.o),
  high: parseFloat(candle.h),
  low: parseFloat(candle.l),
  close: parseFloat(candle.c),
  volume: parseFloat(candle.v),
  isClosed: candle.x,
  source: 'binance',
});

// Normalize Binance Ticker Data
const normalizeBinanceTicker = (ticker: any): NormalizedTicker => ({
  symbol: ticker.s,
  lastPrice: parseFloat(ticker.c),
  priceChangePercent: parseFloat(ticker.P),
  highPrice24h: parseFloat(ticker.h),
  lowPrice24h: parseFloat(ticker.l),
  volume24h: parseFloat(ticker.v),
  source: 'binance',
});

// Normalize Bybit Candle Data
const normalizeBybitCandle = (candle: any): NormalizedCandle => ({
  symbol: candle.symbol,
  timeframe: candle.interval,
  timestamp: candle.end,
  open: parseFloat(candle.open),
  high: parseFloat(candle.high),
  low: parseFloat(candle.low),
  close: parseFloat(candle.close),
  volume: parseFloat(candle.volume),
  isClosed: candle.confirm,
  source: 'bybit',
});

// Normalize Bybit Ticker Data
const normalizeBybitTicker = (ticker: any): NormalizedTicker => ({
  symbol: ticker.symbol,
  lastPrice: parseFloat(ticker.lastPrice),
  priceChangePercent: parseFloat(ticker.price24hPcnt),
  highPrice24h: parseFloat(ticker.highPrice24h),
  lowPrice24h: parseFloat(ticker.lowPrice24h),
  volume24h: parseFloat(ticker.volume24h),
  source: 'bybit',
});

// Handle WebSocket Messages
const handleMessage = (event: MessageEvent) => {
  const data = JSON.parse(event.data);

  // Update last message time
  if (websocket) {
    const wsWithTime = websocket as WebSocket & { lastMessageTime?: number };
    wsWithTime.lastMessageTime = Date.now();
  }

  try {
    // Binance message format
    if (data.e) {
      const binanceMsg = data as BinanceWebSocketMessage;

      if (binanceMsg.k) {
        // Candle data
        const candle = normalizeBinanceCandle(
          binanceMsg.s,
          binanceMsg.k,
          binanceMsg.k.i
        );
        dataListeners.forEach((listener) => listener(candle));
      } else if (binanceMsg.t) {
        // Ticker data
        const ticker = normalizeBinanceTicker(binanceMsg);
        dataListeners.forEach((listener) => listener(ticker));
      }
    }
    // Bybit message format
    else if (data.topic) {
      const bybitMsg = data as BybitWebSocketMessage;

      if (bybitMsg.data) {
        if ((bybitMsg.data as any).interval) {
          // Candle data
          const candle = normalizeBybitCandle(bybitMsg.data);
          dataListeners.forEach((listener) => listener(candle));
        } else {
          // Ticker data
          const ticker = normalizeBybitTicker(bybitMsg.data);
          dataListeners.forEach((listener) => listener(ticker));
        }
      }
    }

    // Notify event listeners
    eventListeners.forEach((listener) =>
      listener({ type: 'message', data, timestamp: Date.now() })
    );
  } catch (error) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.error('Error processing WebSocket message:', error);
    }
    eventListeners.forEach((listener) =>
      listener({ type: 'error', data: error, timestamp: Date.now() })
    );
  }
};

// Connect to WebSocket
const connect = (endpoint: string) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('Already connected to:', currentEndpoint);
    }
    return;
  }

  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    console.log('Connecting to WebSocket:', endpoint);
  }

  // Close existing connection if any
  if (websocket) {
    websocket.close();
  }

  // Create new connection
  websocket = new WebSocket(endpoint);
  currentEndpoint = endpoint;
  reconnectAttempts = 0;

  websocket.onopen = () => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('WebSocket connected:', endpoint);
    }
    reconnectAttempts = 0;

    // Re-subscribe to active subscriptions
    activeSubscriptions.forEach((subscription) => {
      subscribe(subscription);
    });

    eventListeners.forEach((listener) =>
      listener({ type: 'connected', timestamp: Date.now() })
    );
  };

  websocket.onmessage = handleMessage;

  websocket.onerror = (error) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.error('WebSocket error:', error);
    }
    eventListeners.forEach((listener) =>
      listener({ type: 'error', data: error, timestamp: Date.now() })
    );
  };

  websocket.onclose = () => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('WebSocket disconnected');
    }
    eventListeners.forEach((listener) =>
      listener({ type: 'disconnected', timestamp: Date.now() })
    );

    // Attempt reconnection
    attemptReconnect();
  };
};

// Attempt reconnection with exponential backoff
const attemptReconnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  if (reconnectAttempts >= ENV_CONFIG.WS_MAX_RECONNECT_ATTEMPTS) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log(
        'Max reconnection attempts reached. Trying fallback endpoint.'
      );
    }

    // Try fallback to Bybit if we were using Binance
    if (currentEndpoint?.includes('binance')) {
      connect(ENV_CONFIG.BYBIT_WS);
    } else {
      if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
        console.error('All connection attempts failed');
      }
      eventListeners.forEach((listener) =>
        listener({
          type: 'error',
          data: 'All connection attempts failed',
          timestamp: Date.now(),
        })
      );
    }
    return;
  }

  const delay =
    ENV_CONFIG.WS_RECONNECT_DELAY *
    Math.pow(ENV_CONFIG.WS_RECONNECT_BACKOFF, reconnectAttempts);

  reconnectAttempts++;

  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts})`
    );
  }

  eventListeners.forEach((listener) =>
    listener({
      type: 'reconnecting',
      data: { delay, attempt: reconnectAttempts },
      timestamp: Date.now(),
    })
  );

  reconnectTimeout = setTimeout(() => {
    if (currentEndpoint) {
      connect(currentEndpoint);
    }
  }, delay);
};

// Subscribe to data streams
const subscribe = (subscription: WebSocketSubscription) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.warn('Cannot subscribe - WebSocket not connected');
    }
    return;
  }

  // Check if already subscribed
  const existingIndex = activeSubscriptions.findIndex(
    (sub) =>
      sub.symbol === subscription.symbol &&
      sub.type === subscription.type &&
      sub.timeframe === subscription.timeframe
  );

  if (existingIndex !== -1) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.log('Already subscribed to:', subscription);
    }
    return;
  }

  // Add to active subscriptions
  activeSubscriptions.push(subscription);

  // Build subscription message based on source
  if (subscription.source === 'binance') {
    if (subscription.type === 'candle') {
      const message = {
        method: 'SUBSCRIBE',
        params: [
          `${subscription.symbol.toLowerCase()}@kline_${subscription.timeframe}`,
        ],
        id: Date.now(),
      };
      websocket.send(JSON.stringify(message));
    } else if (subscription.type === 'ticker') {
      const message = {
        method: 'SUBSCRIBE',
        params: [`${subscription.symbol.toLowerCase()}@ticker`],
        id: Date.now(),
      };
      websocket.send(JSON.stringify(message));
    }
  } else if (subscription.source === 'bybit') {
    if (subscription.type === 'candle') {
      const message = {
        op: 'subscribe',
        args: [`candle.${subscription.timeframe}.${subscription.symbol}`],
      };
      websocket.send(JSON.stringify(message));
    } else if (subscription.type === 'ticker') {
      const message = {
        op: 'subscribe',
        args: [`tickers.${subscription.symbol}`],
      };
      websocket.send(JSON.stringify(message));
    }
  }

  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    console.log('Subscribed to:', subscription);
  }
};

// Unsubscribe from data streams
const unsubscribe = (subscription: WebSocketSubscription) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
      console.warn('Cannot unsubscribe - WebSocket not connected');
    }
    return;
  }

  // Remove from active subscriptions
  activeSubscriptions = activeSubscriptions.filter(
    (sub) =>
      !(
        sub.symbol === subscription.symbol &&
        sub.type === subscription.type &&
        sub.timeframe === subscription.timeframe
      )
  );

  // Build unsubscribe message based on source
  if (subscription.source === 'binance') {
    if (subscription.type === 'candle') {
      const message = {
        method: 'UNSUBSCRIBE',
        params: [
          `${subscription.symbol.toLowerCase()}@kline_${subscription.timeframe}`,
        ],
        id: Date.now(),
      };
      websocket.send(JSON.stringify(message));
    } else if (subscription.type === 'ticker') {
      const message = {
        method: 'UNSUBSCRIBE',
        params: [`${subscription.symbol.toLowerCase()}@ticker`],
        id: Date.now(),
      };
      websocket.send(JSON.stringify(message));
    }
  } else if (subscription.source === 'bybit') {
    if (subscription.type === 'candle') {
      const message = {
        op: 'unsubscribe',
        args: [`candle.${subscription.timeframe}.${subscription.symbol}`],
      };
      websocket.send(JSON.stringify(message));
    } else if (subscription.type === 'ticker') {
      const message = {
        op: 'unsubscribe',
        args: [`tickers.${subscription.symbol}`],
      };
      websocket.send(JSON.stringify(message));
    }
  }

  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    console.log('Unsubscribed from:', subscription);
  }
};

// Disconnect WebSocket
const disconnect = () => {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
    currentEndpoint = null;
  }

  activeSubscriptions = [];
  if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true') {
    console.log('WebSocket disconnected manually');
  }
};

// Public API
export const WebSocketClient = {
  connect,
  disconnect,
  subscribe,
  unsubscribe,
  getStatus,
  addEventListener: (listener: (event: WebSocketEvent) => void) => {
    eventListeners.push(listener);
    return () => {
      eventListeners = eventListeners.filter((l) => l !== listener);
    };
  },
  addDataListener: (
    listener: (data: NormalizedCandle | NormalizedTicker) => void
  ) => {
    dataListeners.push(listener);
    return () => {
      dataListeners = dataListeners.filter((l) => l !== listener);
    };
  },
  // Initialize with Binance as primary
  init: () => {
    connect(ENV_CONFIG.BINANCE_FUTURES_WS);
  },
};
