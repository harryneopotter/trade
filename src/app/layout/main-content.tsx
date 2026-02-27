// Main content area component for TradeDash
import { type ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChartGrid } from '../../modules/charts';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MainContentProps {
  children?: ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      className={cn('flex-1 overflow-hidden', 'p-2 lg:p-4', className)}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Chart grid - the core feature of TradeDash */}
      {children || <ChartGrid />}
    </main>
  );
}
