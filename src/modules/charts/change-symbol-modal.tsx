// Modal for changing the symbol displayed in a specific chart slot

import { useState, useMemo, useEffect, useRef } from 'react';

interface ChangeSymbolModalProps {
  currentSymbol: string;
  onConfirm: (symbol: string) => void;
  onClose: () => void;
}

const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
  'MATICUSDT',
  'LTCUSDT',
  'TRXUSDT',
  'NEARUSDT',
  'AAVEUSDT',
  'UNIUSDT',
  'ATOMUSDT',
  'ETCUSDT',
  'FILUSDT',
  'MKRUSDT',
];

export function ChangeSymbolModal({
  currentSymbol,
  onConfirm,
  onClose,
}: ChangeSymbolModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredPopular = useMemo(() => {
    if (!query.trim()) return POPULAR_SYMBOLS;
    const q = query.toUpperCase();
    return POPULAR_SYMBOLS.filter((s) => s.includes(q));
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && query.trim()) {
      onConfirm(query.trim().toUpperCase());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg shadow-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Change Symbol
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Close"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {/* Search / type input */}
          <div className="relative mb-3">
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
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Current: ${currentSymbol}`}
              className="w-full pl-9 pr-4 py-2 text-sm rounded focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Confirm typed symbol */}
          {query.trim() && (
            <button
              onClick={() => onConfirm(query.trim().toUpperCase())}
              className="w-full mb-3 py-2 text-sm rounded font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
              }}
            >
              Use {query.trim().toUpperCase()}
            </button>
          )}

          {/* Popular symbols */}
          <p
            className="text-xs font-medium mb-2 uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}
          >
            {query.trim() ? 'Matches' : 'Popular'}
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {filteredPopular.map((sym) => (
              <button
                key={sym}
                onClick={() => onConfirm(sym)}
                className="px-2.5 py-1 text-xs rounded font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor:
                    sym === currentSymbol
                      ? 'var(--accent-primary)'
                      : 'var(--bg-tertiary)',
                  color:
                    sym === currentSymbol ? '#ffffff' : 'var(--text-primary)',
                }}
              >
                {sym.replace('USDT', '')}
              </button>
            ))}
            {filteredPopular.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                No matches — press Enter to use "{query.trim().toUpperCase()}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
