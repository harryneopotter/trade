# TradeDash Implementation Checklist

Use this checklist to track implementation progress. Each item should be checked off as completed.

---

## Phase 1: Foundation

### Dependencies

- [ ] Install `zustand` - State management
- [ ] Install `idb` - IndexedDB wrapper
- [ ] Install `lightweight-charts` - TradingView charts
- [ ] Install `clsx` - Conditional class names
- [ ] Install `tailwind-merge` - Tailwind class merging
- [ ] Install `uuid` - Unique ID generation
- [ ] Install `@types/uuid` - TypeScript types for uuid

### Storage Layer (`src/lib/storage/`)

- [ ] Create `db.ts` - IndexedDB schema with object stores
  - [ ] watchlist store
  - [ ] horizontalLines store with index
  - [ ] settings store
  - [ ] chartState store
- [ ] Create `storage-service.ts` - CRUD operations
  - [ ] Watchlist save/load methods
  - [ ] Horizontal lines save/load/delete methods
  - [ ] Settings save/load methods
  - [ ] Chart state save/load methods
- [ ] Create `persist-middleware.ts` - Zustand persistence middleware
  - [ ] Hydration on init
  - [ ] Serialization/deserialization
  - [ ] Error handling

### State Management (`src/lib/store/`)

- [ ] Create `ui-store.ts`
  - [ ] sidebarOpen state
  - [ ] isMobile detection
  - [ ] connectionStatus
  - [ ] Modal management
- [ ] Create `root-store.ts` - Store composition

---

## Phase 2: Core UI

### App Shell (`src/app/`)

- [ ] Update `index.css` with dark mode theme variables
- [ ] Create `components/app-layout.tsx`
  - [ ] Responsive grid layout
  - [ ] Sidebar positioning
  - [ ] Main content area
- [ ] Create `components/app-header.tsx`
  - [ ] Logo/brand
  - [ ] Connection status indicator
  - [ ] Settings button
- [ ] Create `components/app-sidebar.tsx`
  - [ ] Collapsible on mobile
  - [ ] Overlay drawer on mobile
- [ ] Create `hooks/use-mobile-detect.ts`
  - [ ] Window resize listener
  - [ ] Breakpoint detection

### Timeframe Module (`src/modules/timeframe/`)

- [ ] Create `types.ts`
  - [ ] Timeframe type definition
  - [ ] TimeframeState interface
- [ ] Create `timeframe-store.ts`
  - [ ] Current timeframe state
  - [ ] Available timeframes
  - [ ] Persistence
- [ ] Create `components/timeframe-selector.tsx`
  - [ ] Button group layout
  - [ ] Active state styling
  - [ ] Mobile dropdown variant
- [ ] Create `components/timeframe-button.tsx`
  - [ ] Individual button component
  - [ ] Active/inactive states
- [ ] Create `index.ts` - Public exports

---

## Phase 3: Watchlist

### Watchlist Module (`src/modules/watchlist/`)

- [ ] Create `types.ts`
  - [ ] WatchlistState interface
  - [ ] Component prop types
  - [ ] Symbol search types
- [ ] Create `watchlist-store.ts`
  - [ ] symbols array
  - [ ] activeSymbol
  - [ ] tickers record
  - [ ] All actions (add, remove, setActive, updateTicker, reorder)
  - [ ] Persistence middleware
- [ ] Create `hooks/use-watchlist-socket.ts`
  - [ ] Subscribe to ticker updates
  - [ ] Update store on new data
  - [ ] Cleanup on unmount
- [ ] Create `components/watchlist-sidebar.tsx`
  - [ ] Container layout
  - [ ] Integration with store
- [ ] Create `components/watchlist-header.tsx`
  - [ ] Title
  - [ ] Search button
  - [ ] Collapse toggle
- [ ] Create `components/watchlist-list.tsx`
  - [ ] Scrollable list
  - [ ] Empty state
  - [ ] Loading state
- [ ] Create `components/watchlist-item.tsx`
  - [ ] Symbol badge
  - [ ] Price display with formatting
  - [ ] 24h change percent with color
  - [ ] Remove button (on hover)
  - [ ] Active state styling
  - [ ] Click handler
- [ ] Create `components/symbol-search-modal.tsx`
  - [ ] Modal overlay
  - [ ] Search input
  - [ ] Results list
  - [ ] Popular symbols section
  - [ ] Close on select/escape/overlay click
- [ ] Create `components/symbol-search-input.tsx`
  - [ ] Debounced search
  - [ ] Clear button
  - [ ] Loading indicator
- [ ] Create `utils/symbol-search.ts`
  - [ ] Search filtering logic
  - [ ] Popular symbols list
  - [ ] Validation
- [ ] Create `index.ts` - Public exports

---

## Phase 4: Charts (Basic)

### Charts Module (`src/modules/charts/`)

- [ ] Create `types.ts`
  - [ ] HorizontalLine interface
  - [ ] ChartIndicators interface
  - [ ] ChartConfig interface
  - [ ] ChartState interface
  - [ ] Component prop types
- [ ] Create `chart-store.ts`
  - [ ] 4 chart configs
  - [ ] setChartSymbol action
  - [ ] setChartTimeframe action
  - [ ] toggleIndicator action
  - [ ] Horizontal line actions (add, remove, update)
  - [ ] syncAllChartsTimeframe action
  - [ ] syncAllChartsSymbol action
  - [ ] Persistence for horizontal lines
- [ ] Create `chart-config.ts`
  - [ ] Grid configuration
  - [ ] Default chart options
  - [ ] Color schemes
  - [ ] Candle colors
- [ ] Create `hooks/use-chart-instance.ts`
  - [ ] Create chart instance
  - [ ] Create candlestick series
  - [ ] Create volume series
  - [ ] Cleanup on unmount
  - [ ] Resize handling
- [ ] Create `hooks/use-candle-data.ts`
  - [ ] Subscribe to WebSocket
  - [ ] Update series data
  - [ ] Handle historical data
  - [ ] Aggregate if needed
- [ ] Create `hooks/use-horizontal-lines.ts`
  - [ ] Add line on Shift+Click
  - [ ] Update line on drag
  - [ ] Remove line on right-click
  - [ ] Sync with store
- [ ] Create `components/charts-grid.tsx`
  - [ ] 2x2 grid layout
  - [ ] Responsive classes
  - [ ] Gap configuration
- [ ] Create `components/chart-container.tsx`
  - [ ] Container sizing
  - [ ] Header integration
  - [ ] Chart integration
  - [ ] Loading state
- [ ] Create `components/chart-header.tsx`
  - [ ] Symbol display/selector
  - [ ] Timeframe display
  - [ ] Indicator toggles
  - [ ] Mobile optimizations
- [ ] Create `components/trading-view-chart.tsx`
  - [ ] Chart initialization
  - [ ] Series management
  - [ ] Event handlers
  - [ ] Resize observer
- [ ] Create `components/symbol-selector.tsx`
  - [ ] Dropdown/select
  - [ ] Search within dropdown
  - [ ] Recent symbols
- [ ] Create `components/indicator-toggle.tsx`
  - [ ] EMA9 toggle
  - [ ] EMA21 toggle
  - [ ] Visual feedback
- [ ] Create `utils/chart-helpers.ts`
  - [ ] Data formatting
  - [ ] Price formatting
  - [ ] Time formatting
- [ ] Create `utils/price-formatters.ts`
  - [ ] Format price for display
  - [ ] Format large numbers
  - [ ] Precision handling
- [ ] Create `index.ts` - Public exports

---

## Phase 5: Charts (Indicators)

### Indicators Integration

- [ ] Update `use-candle-data.ts`
  - [ ] Calculate EMA on data change
  - [ ] Create EMA series
  - [ ] Update EMA series
- [ ] Update `trading-view-chart.tsx`
  - [ ] Add EMA line series
  - [ ] Toggle visibility
  - [ ] Color configuration
- [ ] Update `chart-store.ts`
  - [ ] Persist indicator state
- [ ] Update `chart-header.tsx`
  - [ ] Integrate indicator toggles

---

## Phase 6: Horizontal Lines

### Horizontal Lines Feature

- [ ] Update `use-horizontal-lines.ts`
  - [ ] Generate unique IDs
  - [ ] Handle Shift+Click detection
  - [ ] Handle drag events
  - [ ] Handle right-click removal
  - [ ] Label editing
- [ ] Update `trading-view-chart.tsx`
  - [ ] Create price lines
  - [ ] Update price lines
  - [ ] Remove price lines
  - [ ] Event forwarding
- [ ] Update `chart-store.ts`
  - [ ] Load lines from storage on symbol change
  - [ ] Save lines to storage on change
- [ ] Create line styling defaults
  - [ ] Color
  - [ ] Width
  - [ ] Line style

---

## Phase 7: Integration

### App Integration

- [ ] Update `App.tsx`
  - [ ] Add AppLayout
  - [ ] Add AppHeader
  - [ ] Add WatchlistSidebar
  - [ ] Add ChartsGrid
  - [ ] Add TimeframeSelector to header
  - [ ] Add SymbolSearchModal
- [ ] Update `main.tsx`
  - [ ] Initialize IndexedDB
  - [ ] Initialize WebSocket
  - [ ] Hydrate stores
- [ ] Create store synchronization
  - [ ] Watchlist -> Charts symbol sync
  - [ ] Timeframe -> Charts timeframe sync

---

## Phase 8: Polish

### Mobile Optimization

- [ ] Test on mobile portrait
- [ ] Test on mobile landscape
- [ ] Test on tablet
- [ ] Test on desktop
- [ ] Optimize touch targets
- [ ] Add swipe gestures
- [ ] Optimize chart performance on mobile

### Error Handling

- [ ] Add ErrorBoundary for charts
- [ ] Add ErrorBoundary for app
- [ ] Handle WebSocket errors gracefully
- [ ] Handle storage errors
- [ ] Show user-friendly error messages

### Loading States

- [ ] Add loading spinner for charts
- [ ] Add loading state for watchlist
- [ ] Add skeleton screens
- [ ] Handle initial data loading

### Performance

- [ ] Add React.memo where needed
- [ ] Add useMemo for expensive calculations
- [ ] Add useCallback for event handlers
- [ ] Optimize re-renders
- [ ] Test with 4 charts active

---

## Phase 9: Testing

### Unit Tests

- [ ] Test watchlist store
- [ ] Test timeframe store
- [ ] Test chart store
- [ ] Test storage service
- [ ] Test data service calculations

### Integration Tests

- [ ] Test symbol selection flow
- [ ] Test timeframe change flow
- [ ] Test horizontal lines flow
- [ ] Test WebSocket reconnection

### E2E Tests

- [ ] Test PWA install
- [ ] Test offline mode
- [ ] Test mobile navigation
- [ ] Test chart interactions

---

## Phase 10: Deployment

### Build Verification

- [ ] Run `pnpm lint`
- [ ] Run `pnpm build`
- [ ] Verify PWA manifest
- [ ] Verify service worker
- [ ] Check bundle size

### Final Checks

- [ ] Verify all features work
- [ ] Verify mobile responsiveness
- [ ] Verify dark mode
- [ ] Verify persistence
- [ ] Verify WebSocket connections
- [ ] Check console for errors

---

## Summary

| Phase                        | Items   | Completed | Progress |
| ---------------------------- | ------- | --------- | -------- |
| Phase 1: Foundation          | 15      | 0         | 0%       |
| Phase 2: Core UI             | 11      | 0         | 0%       |
| Phase 3: Watchlist           | 16      | 0         | 0%       |
| Phase 4: Charts (Basic)      | 23      | 0         | 0%       |
| Phase 5: Charts (Indicators) | 4       | 0         | 0%       |
| Phase 6: Horizontal Lines    | 4       | 0         | 0%       |
| Phase 7: Integration         | 6       | 0         | 0%       |
| Phase 8: Polish              | 15      | 0         | 0%       |
| Phase 9: Testing             | 8       | 0         | 0%       |
| Phase 10: Deployment         | 7       | 0         | 0%       |
| **Total**                    | **109** | **0**     | **0%**   |
