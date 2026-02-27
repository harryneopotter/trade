// Individual indicator toggle component for TradeDash
import { useState, useCallback } from 'react';
import type { IndicatorToggleProps } from './types';

/**
 * IndicatorToggle component
 *
 * A compact toggle switch for enabling/disabling indicators.
 * Features:
 * - iOS-style toggle switch
 * - Color indicator dot
 * - Tooltip with description
 * - Accessible keyboard controls
 */
export function IndicatorToggle({
  config,
  enabled,
  onToggle,
  compact = false,
  className = '',
}: IndicatorToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <div
      className={`flex items-center justify-between gap-3 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Left side: Color indicator and label */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Color indicator dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />

        {/* Label and period */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'var(--text-primary)' }}
            title={config.description}
          >
            {config.name}
          </span>
          {!compact && (
            <span
              className="text-xs flex-shrink-0"
              style={{ color: 'var(--text-secondary)' }}
            >
              ({config.period})
            </span>
          )}
        </div>
      </div>

      {/* Right side: Toggle switch */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${config.name}`}
          onClick={onToggle}
          onKeyDown={handleKeyDown}
          className={`
            relative inline-flex h-5 w-9 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]
          `}
          style={{
            backgroundColor: enabled ? config.color : 'var(--bg-tertiary)',
          }}
        >
          <span
            className={`
              inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
              transform transition-transform duration-200 ease-in-out
              ${enabled ? 'translate-x-4.5' : 'translate-x-1'}
            `}
            style={{
              transform: enabled ? 'translateX(18px)' : 'translateX(2px)',
            }}
          />
        </button>

        {/* Tooltip */}
        {showTooltip && !compact && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap z-50"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {config.description}
          </div>
        )}
      </div>
    </div>
  );
}
