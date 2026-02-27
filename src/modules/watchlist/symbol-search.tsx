// Symbol search/add component
import { useState, useMemo, useEffect, useRef } from 'react';
import { useWatchlistStore } from '../../lib/stores';
import type { SymbolSearchResult } from './types';

interface SymbolSearchProps {
  onClose: () => void;
  existingSymbols: string[];
}

const MAX_SYMBOLS = 30;

// Popular crypto symbols for quick-add
const POPULAR_SYMBOLS: SymbolSearchResult[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT' },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT' },
  { symbol: 'MATICUSDT', baseAsset: 'MATIC', quoteAsset: 'USDT' },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT' },
];

// Extended list of available symbols for search
const AVAILABLE_SYMBOLS: SymbolSearchResult[] = [
  ...POPULAR_SYMBOLS,
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT' },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT' },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT' },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT' },
  { symbol: 'ETCUSDT', baseAsset: 'ETC', quoteAsset: 'USDT' },
  { symbol: 'XLMUSDT', baseAsset: 'XLM', quoteAsset: 'USDT' },
  { symbol: 'ALGOUSDT', baseAsset: 'ALGO', quoteAsset: 'USDT' },
  { symbol: 'VETUSDT', baseAsset: 'VET', quoteAsset: 'USDT' },
  { symbol: 'ICPUSDT', baseAsset: 'ICP', quoteAsset: 'USDT' },
  { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT' },
  { symbol: 'TRXUSDT', baseAsset: 'TRX', quoteAsset: 'USDT' },
  { symbol: 'XMRUSDT', baseAsset: 'XMR', quoteAsset: 'USDT' },
  { symbol: 'AAVEUSDT', baseAsset: 'AAVE', quoteAsset: 'USDT' },
  { symbol: 'MKRUSDT', baseAsset: 'MKR', quoteAsset: 'USDT' },
  { symbol: 'COMPUSDT', baseAsset: 'COMP', quoteAsset: 'USDT' },
  { symbol: 'YFIUSDT', baseAsset: 'YFI', quoteAsset: 'USDT' },
  { symbol: 'SNXUSDT', baseAsset: 'SNX', quoteAsset: 'USDT' },
  { symbol: 'CRVUSDT', baseAsset: 'CRV', quoteAsset: 'USDT' },
  { symbol: 'SUSHIUSDT', baseAsset: 'SUSHI', quoteAsset: 'USDT' },
  { symbol: '1INCHUSDT', baseAsset: '1INCH', quoteAsset: 'USDT' },
];

export function SymbolSearch({ onClose, existingSymbols }: SymbolSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addSymbol } = useWatchlistStore();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter symbols based on search query
  const filteredSymbols = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toUpperCase();
    return AVAILABLE_SYMBOLS.filter(
      (s) =>
        s.symbol.includes(query) ||
        s.baseAsset.includes(query) ||
        s.quoteAsset.includes(query)
    ).slice(0, 10); // Limit to 10 results
  }, [searchQuery]);

  // Get popular symbols that aren't already in watchlist
  const availablePopular = useMemo(() => {
    return POPULAR_SYMBOLS.filter((s) => !existingSymbols.includes(s.symbol));
  }, [existingSymbols]);

  const handleAddSymbol = async (symbol: string) => {
    // Validation
    if (existingSymbols.includes(symbol)) {
      setError(`${symbol} is already in your watchlist`);
      return;
    }

    if (existingSymbols.length >= MAX_SYMBOLS) {
      setError(`Watchlist is full (max ${MAX_SYMBOLS} symbols)`);
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      await addSymbol(symbol);
      onClose();
    } catch {
      setError(`Failed to add ${symbol}. Please try again.`);
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isAtLimit = existingSymbols.length >= MAX_SYMBOLS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg shadow-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Add Symbol
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-tertiary transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbols (e.g., BTC, ETH)..."
              className="w-full pl-10 pr-4 py-2.5 rounded text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
              }}
              disabled={isAtLimit || isAdding}
            />
          </div>

          {/* Symbol count */}
          <div
            className="flex justify-between items-center mt-2 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>
              {existingSymbols.length} / {MAX_SYMBOLS} symbols
            </span>
            {isAtLimit && (
              <span style={{ color: 'var(--accent-warning)' }}>
                Watchlist full
              </span>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mt-3 p-2.5 rounded text-sm flex items-center gap-2"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-danger)',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Search results */}
          {searchQuery.trim() && (
            <div className="mt-3">
              {filteredSymbols.length > 0 ? (
                <div
                  className="rounded overflow-hidden"
                  style={{ border: '1px solid var(--border-color)' }}
                >
                  {filteredSymbols.map((result, index) => {
                    const isExisting = existingSymbols.includes(result.symbol);
                    return (
                      <button
                        key={result.symbol}
                        onClick={() => handleAddSymbol(result.symbol)}
                        disabled={isExisting || isAdding}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 text-left
                          transition-colors
                          ${index !== 0 ? 'border-t' : ''}
                          ${isExisting || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-tertiary/50'}
                        `}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {result.symbol}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {result.baseAsset}/{result.quoteAsset}
                          </span>
                        </div>
                        {isExisting ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            Added
                          </span>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="text-sm text-center py-4"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No symbols found for "{searchQuery}"
                </p>
              )}
            </div>
          )}

          {/* Popular symbols quick-add */}
          {!searchQuery.trim() && availablePopular.length > 0 && (
            <div className="mt-4">
              <h4
                className="text-xs font-medium mb-2 uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                Popular
              </h4>
              <div className="flex flex-wrap gap-2">
                {availablePopular.map((symbol) => (
                  <button
                    key={symbol.symbol}
                    onClick={() => handleAddSymbol(symbol.symbol)}
                    disabled={isAdding}
                    className="px-3 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {symbol.baseAsset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
