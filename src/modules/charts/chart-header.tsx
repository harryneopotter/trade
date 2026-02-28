// Chart header component for TradeDash

import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { Timeframe } from '../../lib/stores/types';
import { CompactIndicatorsPanel } from '../indicators';
import { LineControls, LineControlsButton } from './line-controls';
import type { HorizontalLineData } from './types';

interface ChartHeaderProps {
  symbol: string;
  timeframe: Timeframe;
  chartIndex: number;
  horizontalLines: HorizontalLineData[];
  currentPrice?: number | null;
  priceChange?: number;
  onSettingsClick?: () => void;
  onCloseClick?: () => void;
  onAddLine: (price: number, color?: string) => void;
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    updates: { price?: number; color?: string }
  ) => void;
  onClearAllLines: () => void;
}

/**
 * Format price with appropriate decimal places
 */
function formatPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else if (price >= 1000) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', { maximumFractionDigits: 4 });
  } else {
    return price.toLocaleString('en-US', { maximumFractionDigits: 6 });
  }
}

/**
 * Format price change percentage
 */
function formatPriceChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Chart header showing symbol, timeframe, price, and controls.
 * Memoized so that parent re-renders caused by canvas/candle updates don't
 * propagate here when price/symbol props are unchanged.
 */
function ChartHeaderInner({
  symbol,
  timeframe,
  chartIndex,
  horizontalLines,
  currentPrice,
  priceChange,
  onSettingsClick,
  onCloseClick,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  onClearAllLines,
}: ChartHeaderProps) {
  const isPositive = (priceChange ?? 0) >= 0;
  const [showIndicators, setShowIndicators] = useState(false);
  const [showLineControls, setShowLineControls] = useState(false);
  const indicatorsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lineControlsRef = useRef<HTMLDivElement>(null);

  // Close indicators dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        indicatorsRef.current &&
        !indicatorsRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowIndicators(false);
      }
    }

    if (showIndicators) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndicators]);

  // Close line controls dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lineControlsRef.current &&
        !lineControlsRef.current.contains(event.target as Node)
      ) {
        setShowLineControls(false);
      }
    }

    if (showLineControls) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLineControls]);

  // Format symbol display (e.g., "BTCUSDT" -> "BTC/USDT")
  const formattedSymbol = useMemo(() => {
    // Try to split at common quote currencies
    const quoteCurrencies = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB'];
    for (const quote of quoteCurrencies) {
      if (symbol.endsWith(quote)) {
        const base = symbol.slice(0, -quote.length);
        return `${base}/${quote}`;
      }
    }
    return symbol;
  }, [symbol]);

  const toggleIndicators = useCallback(() => {
    setShowIndicators((prev) => !prev);
  }, []);

  const toggleLineControls = useCallback(() => {
    setShowLineControls((prev) => !prev);
  }, []);

  return (
    <div
      className="flex items-center justify-between px-3 py-2 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left section: Symbol and timeframe */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className="font-semibold text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {formattedSymbol}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {timeframe.toUpperCase()}
          </span>
        </div>

        {/* Price and change */}
        {currentPrice !== null && currentPrice !== undefined && (
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatPrice(currentPrice)}
            </span>
            {priceChange !== undefined && (
              <span
                className="text-xs font-medium"
                style={{
                  color: isPositive
                    ? 'var(--accent-success)'
                    : 'var(--accent-danger)',
                }}
              >
                {formatPriceChange(priceChange)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right section: Controls */}
      <div className="flex items-center gap-1">
        {/* Line controls button with dropdown */}
        <div className="relative" ref={lineControlsRef}>
          <LineControlsButton
            lineCount={horizontalLines.length}
            onClick={toggleLineControls}
            isActive={showLineControls}
          />

          {showLineControls && (
            <div className="absolute right-0 top-full mt-1 z-50">
              <LineControls
                lines={horizontalLines}
                onAddLine={onAddLine}
                onRemoveLine={onRemoveLine}
                onUpdateLine={onUpdateLine}
                onClearAll={onClearAllLines}
              />
            </div>
          )}
        </div>

        {/* Indicators button with dropdown */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={toggleIndicators}
            className={`p-1.5 rounded transition-colors hover:opacity-80 ${
              showIndicators ? 'bg-[var(--bg-tertiary)]' : ''
            }`}
            style={{ color: 'var(--text-secondary)' }}
            title="Indicators"
            aria-label="Toggle indicators panel"
            aria-expanded={showIndicators}
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
              <path d="M3 3v18h18" />
              <path d="M7 16l4-4 4 4 6-6" />
            </svg>
          </button>

          {/* Indicators dropdown */}
          {showIndicators && (
            <div
              ref={indicatorsRef}
              className="absolute right-0 top-full mt-1 w-48 z-50"
            >
              <CompactIndicatorsPanel chartIndex={chartIndex} />
            </div>
          )}
        </div>

        {/* Settings button */}
        {onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="p-1.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            title="Chart settings"
            aria-label="Chart settings"
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
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}

        {/* Close button */}
        {onCloseClick && (
          <button
            onClick={onCloseClick}
            className="p-1.5 rounded transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            title="Remove chart"
            aria-label="Remove chart"
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
        )}
      </div>
    </div>
  );
}

export const ChartHeader = memo(ChartHeaderInner);
