// Sidebar component for TradeDash
import { useUIStore } from '../../lib/stores';
import { WatchlistPanel } from '../../modules/watchlist';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Close sidebar when clicking overlay (mobile)
  const handleOverlayClick = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40',
          'w-[240px] flex flex-col',
          'border-r transition-transform duration-300 ease-in-out',
          'bg-secondary',
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0 lg:hidden',
          className
        )}
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          top: 'var(--header-height)',
          height: 'calc(100% - var(--header-height))',
        }}
        aria-label="Watchlist sidebar"
        aria-expanded={sidebarOpen}
      >
        {/* Watchlist Panel */}
        <WatchlistPanel />
      </aside>
    </>
  );
}
