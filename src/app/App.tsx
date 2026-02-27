// Main App component for TradeDash
import { useEffect, useState } from 'react';
import { AppShell } from './layout';
import { initializeStores, useUIStore } from '../lib/stores';
import { WebSocketClient } from '../lib/data/websocket-client';
import type { WebSocketEvent } from '../lib/data/types';
import './App.css';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const { setConnectionStatus } = useUIStore();

  // Initialize stores and WebSocket on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize all stores from storage
        await initializeStores();

        // Initialize WebSocket connection
        WebSocketClient.init();

        // Set up WebSocket event listener for connection status
        const unsubscribe = WebSocketClient.addEventListener(
          (event: WebSocketEvent) => {
            switch (event.type) {
              case 'connected':
                setConnectionStatus('connected');
                break;
              case 'disconnected':
                setConnectionStatus('disconnected');
                break;
              case 'reconnecting':
                setConnectionStatus('reconnecting');
                break;
              case 'error':
                console.error('WebSocket error:', event.data);
                break;
            }
          }
        );

        // Cleanup on unmount
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        );
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [setConnectionStatus]);

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div
        className="flex items-center justify-center h-screen w-full"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner loading-spinner-lg" />
          <p className="text-secondary text-sm">Loading TradeDash...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div
        className="flex items-center justify-center h-screen w-full"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-danger)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-primary">Failed to Load</h2>
          <p className="text-secondary text-sm">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded text-sm font-medium"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the main app shell
  return <AppShell />;
}

export default App;
