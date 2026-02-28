// Individual watchlist item component
import { memo } from 'react';
import { useWatchlistStore } from '../../lib/stores';
import type { WatchlistItemData } from './types';

interface WatchlistItemProps {
  data: WatchlistItemData;
}

// Format price with appropriate decimal places
function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } else if (price >= 0.01) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    });
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    });
  }
}

// Format percentage with sign
function formatPercentage(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

function WatchlistItemInner({ data }: WatchlistItemProps) {
  // Granular selectors: each subscription only re-renders when its slice changes.
  // isActive is a boolean comparison — only triggers re-render for this symbol.
  const isActive = useWatchlistStore((s) => s.activeSymbol === data.symbol);
  const setActiveSymbol = useWatchlistStore((s) => s.setActiveSymbol);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const isPositive = data.priceChangePercent >= 0;

  const handleClick = () => {
    setActiveSymbol(data.symbol);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSymbol(data.symbol);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex items-center justify-between px-3 py-2 cursor-pointer
        transition-colors duration-150 group
        ${isActive ? 'bg-tertiary' : 'hover:bg-tertiary/50'}
      `}
      style={{
        backgroundColor: isActive ? 'var(--bg-tertiary)' : undefined,
        minHeight: '56px',
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        />
      )}

      {/* Left side: Symbol and 24h high/low */}
      <div className="flex flex-col gap-0.5">
        <span
          className="font-semibold text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {data.symbol}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          H: {formatPrice(data.high24h)} L: {formatPrice(data.low24h)}
        </span>
      </div>

      {/* Right side: Price and change */}
      <div className="flex flex-col items-end gap-0.5">
        <span
          className="font-mono text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          ${formatPrice(data.price)}
        </span>
        <span
          className="text-xs font-medium"
          style={{
            color: isPositive
              ? 'var(--accent-success)'
              : 'var(--accent-danger)',
          }}
        >
          {formatPercentage(data.priceChangePercent)}
        </span>
      </div>

      {/* Delete button - appears on hover */}
      <button
        onClick={handleRemove}
        className="
          absolute right-2 top-1/2 -translate-y-1/2
          p-1.5 rounded opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          hover:bg-red-500/20
        "
        style={{ color: 'var(--accent-danger)' }}
        aria-label={`Remove ${data.symbol} from watchlist`}
        title="Remove from watchlist"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
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
  );
}

// Memoize so only the item whose `data` reference changed re-renders on tick.
// Combined with granular Zustand selectors above, clicking one item does NOT
// cause all other items to re-render.
export const WatchlistItem = memo(WatchlistItemInner);
