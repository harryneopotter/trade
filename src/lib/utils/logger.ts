// Centralised logging utility for TradeDash
// In production, debug/info messages are silenced; errors always surface.

const isDev = import.meta.env.DEV;

export const logger = {
  /** Debug messages: only emitted in dev mode */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[TradeDash]', ...args); // eslint-disable-line no-console
  },
  /** General info: only emitted in dev mode */
  log: (...args: unknown[]) => {
    if (isDev) console.log('[TradeDash]', ...args); // eslint-disable-line no-console
  },
  /** Warnings: only emitted in dev mode */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[TradeDash]', ...args); // eslint-disable-line no-console
  },
  /** Errors: always emitted (needed in production for observability) */
  error: (...args: unknown[]) => {
    console.error('[TradeDash]', ...args); // eslint-disable-line no-console
  },
};
