// Main watchlist panel component
import { useState } from 'react';
import { useWatchlistStore } from '../../lib/stores';
import { useWatchlistData } from './use-watchlist-data';
import { WatchlistItem } from './watchlist-item';
import { SymbolSearch } from './symbol-search';

export function WatchlistPanel() {
  const { symbols, isLoading } = useWatchlistStore();
  const { watchlistData, isSubscribed } = useWatchlistData(symbols);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleAddSymbol = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Watchlist
          </h2>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {symbols.length}
          </span>
        </div>
        {isSubscribed && (
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--accent-success)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* Watchlist content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div
              className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
              style={{
                borderColor: 'var(--accent-primary)',
                borderTopColor: 'transparent',
              }}
            />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Loading watchlist...
            </p>
          </div>
        ) : symbols.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Your watchlist is empty
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Add symbols to start tracking prices
            </p>
          </div>
        ) : (
          // Watchlist items
          <div
            className="divide-y"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {symbols.map((symbol) => {
              const data = watchlistData[symbol];
              if (!data) {
                // Loading placeholder for this symbol
                return (
                  <div
                    key={symbol}
                    className="flex items-center justify-between px-3 py-2"
                    style={{ minHeight: '56px' }}
                  >
                    <div className="flex flex-col gap-1">
                      <span
                        className="font-semibold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {symbol}
                      </span>
                      <div
                        className="w-20 h-3 rounded animate-pulse"
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                      />
                    </div>
                    <div
                      className="w-16 h-4 rounded animate-pulse"
                      style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    />
                  </div>
                );
              }
              return <WatchlistItem key={symbol} data={data} />;
            })}
          </div>
        )}
      </div>

      {/* Footer with add button */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <button
          onClick={handleAddSymbol}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-sm font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Symbol
        </button>
      </div>

      {/* Symbol search modal */}
      {isSearchOpen && (
        <SymbolSearch onClose={handleCloseSearch} existingSymbols={symbols} />
      )}
    </div>
  );
}
