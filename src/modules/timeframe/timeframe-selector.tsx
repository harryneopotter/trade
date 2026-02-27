// Timeframe selector component for TradeDash
import { useCallback, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  useTimeframe,
  useTimeframeKeyboard,
  useTimeframeOptions,
} from './use-timeframe';
import { TIMEFRAME_OPTIONS, type Timeframe } from './types';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TimeframeSelectorProps {
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * TimeframeSelector component
 *
 * A segmented control for selecting the global timeframe.
 * Syncs across all charts when changed.
 *
 * Features:
 * - Segmented button group with 4 options: 15m, 1H, 4H, 8H
 * - Active state with accent background
 * - Keyboard navigation (ArrowLeft/ArrowRight)
 * - Responsive design (compact mode for mobile)
 */
export function TimeframeSelector({
  className,
  variant = 'default',
}: TimeframeSelectorProps) {
  const { timeframe, setTimeframe } = useTimeframe();
  const containerRef = useRef<HTMLDivElement>(null);

  // Enable keyboard navigation
  useTimeframeKeyboard();

  const handleTimeframeChange = useCallback(
    (newTimeframe: Timeframe) => {
      setTimeframe(newTimeframe);
    },
    [setTimeframe]
  );

  // Handle keyboard navigation within the component
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      switch (event.key) {
        case 'ArrowLeft': {
          event.preventDefault();
          const prevIndex =
            index > 0 ? index - 1 : TIMEFRAME_OPTIONS.length - 1;
          const prevTimeframe = TIMEFRAME_OPTIONS[prevIndex].value;
          setTimeframe(prevTimeframe);
          // Focus the previous button
          const buttons = containerRef.current?.querySelectorAll('button');
          buttons?.[prevIndex]?.focus();
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const nextIndex =
            index < TIMEFRAME_OPTIONS.length - 1 ? index + 1 : 0;
          const nextTimeframe = TIMEFRAME_OPTIONS[nextIndex].value;
          setTimeframe(nextTimeframe);
          // Focus the next button
          const buttons = containerRef.current?.querySelectorAll('button');
          buttons?.[nextIndex]?.focus();
          break;
        }
        case 'Home': {
          event.preventDefault();
          setTimeframe(TIMEFRAME_OPTIONS[0].value);
          const buttons = containerRef.current?.querySelectorAll('button');
          buttons?.[0]?.focus();
          break;
        }
        case 'End': {
          event.preventDefault();
          setTimeframe(TIMEFRAME_OPTIONS[TIMEFRAME_OPTIONS.length - 1].value);
          const buttons = containerRef.current?.querySelectorAll('button');
          buttons?.[TIMEFRAME_OPTIONS.length - 1]?.focus();
          break;
        }
      }
    },
    [setTimeframe]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'inline-flex items-center rounded-lg p-1',
        'bg-tertiary/30 border border-border',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-color)',
      }}
      role="radiogroup"
      aria-label="Select timeframe"
    >
      {TIMEFRAME_OPTIONS.map((option, index) => {
        const isActive = timeframe === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.description}
            onClick={() => handleTimeframeChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              // Base styles
              'relative px-3 py-1.5 text-sm font-medium rounded-md',
              'transition-all duration-150 ease-in-out',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              'focus-visible:ring-offset-background',
              // Responsive sizing
              variant === 'compact'
                ? 'px-2 py-1 text-xs'
                : 'px-3 py-1.5 text-sm',
              // Active state
              isActive && 'text-white shadow-sm',
              // Inactive state
              !isActive && 'text-secondary hover:text-primary',
              // Focus ring color
              'focus-visible:ring-[var(--accent-primary)]'
            )}
            style={{
              backgroundColor: isActive
                ? 'var(--accent-primary)'
                : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
            }}
            tabIndex={isActive ? 0 : -1}
          >
            {/* Mobile: Just show label without description */}
            <span className={cn('block', variant === 'compact' && 'text-xs')}>
              {option.label}
            </span>

            {/* Active indicator for accessibility */}
            {isActive && <span className="sr-only">(selected)</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact version of the timeframe selector for mobile/narrow spaces
 */
export function TimeframeSelectorCompact({
  className,
}: {
  className?: string;
}) {
  return <TimeframeSelector className={className} variant="compact" />;
}

/**
 * Timeframe display (read-only) for showing current selection
 */
export function TimeframeDisplay({ className }: { className?: string }) {
  const { timeframe } = useTimeframe();
  const { getCurrentOption } = useTimeframeOptions();

  const currentOption = getCurrentOption();

  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium',
        'bg-tertiary/50 border border-border',
        className
      )}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)',
      }}
      title={currentOption?.description || 'Timeframe'}
    >
      <span className="text-secondary mr-2">TF:</span>
      <span
        className="font-semibold"
        style={{ color: 'var(--accent-primary)' }}
      >
        {currentOption?.label || timeframe}
      </span>
    </div>
  );
}
