// Generic React error boundary for TradeDash

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { logger } from '../../lib/utils/logger';

interface Props {
  children: ReactNode;
  /** Optional fallback UI. Receives the caught error. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Label shown in the default fallback (e.g. "Chart 1") */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Class-based error boundary that catches render errors from its children.
 * Shows a styled fallback card and allows the user to retry.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Render error caught by ErrorBoundary:', error, info);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback, label } = this.props;

    if (error) {
      if (fallback) return fallback(error, this.reset);

      return (
        <div
          className="flex flex-col items-center justify-center h-full w-full p-4 text-center rounded border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--accent-danger)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-2"
            style={{ color: 'var(--accent-danger)' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {label ? `${label} crashed` : 'Something went wrong'}
          </p>
          <p
            className="text-xs mb-3 max-w-xs break-words"
            style={{ color: 'var(--text-secondary)' }}
          >
            {error.message}
          </p>
          <button
            onClick={this.reset}
            className="px-3 py-1.5 text-xs rounded transition-opacity hover:opacity-80"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return children;
  }
}
