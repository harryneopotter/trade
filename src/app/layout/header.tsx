// Header component for TradeDash
import { useUIStore } from '../../lib/stores';
import {
  TimeframeSelector,
  TimeframeSelectorCompact,
} from '../../modules/timeframe';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { connectionStatus, toggleSidebar, sidebarOpen } = useUIStore();

  // Get status indicator styles
  const getStatusDotClass = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'status-dot-connected';
      case 'reconnecting':
        return 'status-dot-reconnecting';
      case 'disconnected':
      default:
        return 'status-dot-disconnected';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-4 border-b bg-secondary z-20',
        className
      )}
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      {/* Left section: Menu toggle + Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-tertiary transition-colors"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-white"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            TD
          </div>
          <h1 className="text-lg font-semibold text-primary">TradeDash</h1>
        </div>
      </div>

      {/* Center section: Timeframe selector */}
      <div className="flex items-center">
        {/* Desktop: Full selector */}
        <div className="hidden md:block">
          <TimeframeSelector />
        </div>
        {/* Mobile: Compact selector */}
        <div className="md:hidden">
          <TimeframeSelectorCompact />
        </div>
      </div>

      {/* Right section: Connection status */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
          title={`WebSocket Status: ${getStatusText()}`}
        >
          <span className={cn('status-dot', getStatusDotClass())} />
          <span className="text-xs font-medium text-secondary hidden sm:inline">
            {getStatusText()}
          </span>
        </div>
      </div>
    </header>
  );
}
