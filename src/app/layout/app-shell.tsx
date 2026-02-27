// App Shell component for TradeDash
// Main layout structure with header, sidebar, and content area
import { type ReactNode } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MainContent } from './main-content';
import { useUIStore } from '../../lib/stores';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppShellProps {
  children?: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div
      className={cn('flex flex-col h-screen w-full overflow-hidden', className)}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Fixed header */}
      <Header className="flex-shrink-0" />

      {/* Main layout container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - collapsible on mobile/tablet */}
        <Sidebar />

        {/* Main content area */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 transition-all duration-300',
            sidebarOpen && 'lg:ml-[240px]'
          )}
        >
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </div>
  );
}
