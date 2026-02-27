# TradeDash Architecture Diagrams

This document provides visual diagrams to illustrate the TradeDash system architecture.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[App Shell<br/>Layout, Header, Sidebar]
    end

    subgraph "Feature Modules"
        B[Watchlist Module]
        C[Timeframe Module]
        D[Charts Module]
        E[Indicators Module]
        F[Settings Module]
    end

    subgraph "State Management"
        G[Zustand Stores]
        G1[Watchlist Store]
        G2[Timeframe Store]
        G3[Chart Store]
        G4[UI Store]
        G5[Settings Store]
    end

    subgraph "Data Layer"
        H[WebSocket Client]
        I[Data Service]
        J[IndexedDB Storage]
    end

    subgraph "External APIs"
        K[Binance WebSocket]
        L[Bybit WebSocket]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F

    B --> G1
    C --> G2
    D --> G3
    A --> G4
    F --> G5

    G1 --> I
    G2 --> I
    G3 --> I
    G5 --> J
    G1 --> J
    G3 --> J

    I --> H
    H --> K
    H --> L

    K -.->|fallback| L
```

---

## 2. Component Hierarchy

```mermaid
graph TD
    A[App] --> B[AppLayout]

    B --> C[AppHeader]
    B --> D[WatchlistSidebar]
    B --> E[ChartsGrid]

    C --> C1[Logo]
    C --> C2[TimeframeSelector]
    C --> C3[ConnectionStatus]
    C --> C4[SettingsButton]

    D --> D1[WatchlistHeader]
    D --> D2[WatchlistList]
    D --> D3[SymbolSearchModal]

    D1 --> D1a[SearchButton]
    D1 --> D1b[CollapseToggle]

    D2 --> D2a[WatchlistItem]
    D2a --> D2a1[SymbolBadge]
    D2a --> D2a2[PriceDisplay]
    D2a --> D2a3[ChangePercentBadge]
    D2a --> D2a4[RemoveButton]

    D3 --> D3a[SearchInput]
    D3 --> D3b[SearchResultsList]

    E --> E1[ChartContainer x4]

    E1 --> E1a[ChartHeader]
    E1 --> E1b[TradingViewChart]

    E1a --> E1a1[SymbolSelector]
    E1a --> E1a2[TimeframeDisplay]
    E1a --> E1a3[IndicatorToggles]

    E1b --> E1b1[CandlestickSeries]
    E1b --> E1b2[VolumeSeries]
    E1b --> E1b3[EMA9Line]
    E1b --> E1b4[EMA21Line]
    E1b --> E1b5[HorizontalPriceLines]
```

---

## 3. Data Flow - Symbol Selection

```mermaid
sequenceDiagram
    participant U as User
    participant WI as WatchlistItem
    participant WS as WatchlistStore
    participant CS as ChartStore
    participant WSC as WebSocketClient
    participant DS as DataService
    participant DB as IndexedDB

    U->>WI: Tap symbol
    WI->>WS: setActiveSymbol(symbol)
    WS->>WS: Update active symbol
    WS->>CS: syncAllChartsSymbol(symbol)

    loop For each chart
        CS->>CS: Update chart symbol
        CS->>WSC: subscribe(symbol, timeframe)
    end

    WSC->>DS: Request historical data
    DS-->>WSC: Return cached data
    WSC-->>CS: Stream real-time updates
    CS->>DB: Persist chart state
    CS-->>WI: Update ticker display
```

---

## 4. Data Flow - Timeframe Change

```mermaid
sequenceDiagram
    participant U as User
    participant TS as TimeframeSelector
    participant TF as TimeframeStore
    participant CS as ChartStore
    participant DS as DataService
    participant WSC as WebSocketClient
    participant DB as IndexedDB

    U->>TS: Click timeframe
    TS->>TF: setTimeframe(timeframe)
    TF->>CS: syncAllChartsTimeframe(timeframe)

    loop For each chart
        CS->>CS: Update chart timeframe
        alt Need aggregation
            CS->>DS: aggregateCandles(symbol, timeframe)
            DS-->>CS: Return aggregated data
        else Native timeframe
            CS->>WSC: subscribe(symbol, timeframe)
        end
    end

    CS->>DB: Persist chart state
    CS-->>TS: Update UI
```

---

## 5. Data Flow - Horizontal Lines

```mermaid
sequenceDiagram
    participant U as User
    participant TV as TradingViewChart
    participant HL as useHorizontalLines
    participant CS as ChartStore
    participant DB as IndexedDB

    U->>TV: Shift+Click on chart
    TV->>HL: handleChartClick(param)
    HL->>HL: Create line object
    HL->>CS: addHorizontalLine(chartId, line)
    CS->>CS: Add line to chart config
    CS->>DB: saveHorizontalLines(symbol, chartId, lines)
    DB-->>CS: Confirm save
    CS-->>TV: Update chart with new line
    TV-->>U: Display new price line

    U->>TV: Drag line
    TV->>HL: onDragEnd(newPrice)
    HL->>CS: updateHorizontalLine(id, {price})
    CS->>DB: saveHorizontalLines(...)
    DB-->>CS: Confirm
    CS-->>TV: Update line position
```

---

## 6. Store Dependencies

```mermaid
graph LR
    subgraph "Independent Stores"
        A[UI Store]
        B[Settings Store]
    end

    subgraph "Data Stores"
        C[Timeframe Store]
        D[Watchlist Store]
    end

    subgraph "Composite Store"
        E[Chart Store]
    end

    C -->|syncs timeframe| E
    D -->|syncs symbol| E

    B -.->|default settings| E
    A -.->|mobile detection| E
```

---

## 7. WebSocket Connection Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting: User opens app
    Connecting --> Connected: Connection successful
    Connecting --> Reconnecting: Connection failed

    Connected --> Reconnecting: Connection lost
    Reconnecting --> Connected: Reconnect successful
    Reconnecting --> Fallback: Max retries reached

    Fallback --> Connected: Fallback connection successful
    Fallback --> Disconnected: Fallback failed

    Connected --> Disconnected: User closes app
    Reconnecting --> Disconnected: User closes app
```

---

## 8. Persistence Strategy

```mermaid
graph TB
    subgraph "Zustand Stores"
        A[Watchlist Store]
        B[Timeframe Store]
        C[Chart Store]
        D[Settings Store]
    end

    subgraph "Persistence Middleware"
        P1[Watchlist Persistence]
        P2[Timeframe Persistence]
        P3[Chart State Persistence]
        P4[Settings Persistence]
    end

    subgraph "IndexedDB"
        DB1[(watchlist)]
        DB2[(horizontalLines)]
        DB3[(chartState)]
        DB4[(settings)]
    end

    A --> P1
    B --> P2
    C --> P3
    D --> P4

    P1 --> DB1
    P2 -.->|in-memory| DB2
    C -->|lines per symbol| DB2
    P3 --> DB3
    P4 --> DB4
```

---

## 9. Responsive Layout States

```mermaid
graph TB
    subgraph "Desktop (>1024px)"
        D1[Sidebar: Fixed 256px]
        D2[Charts: 2x2 Grid]
        D3[Header: Full width]
    end

    subgraph "Tablet (640-1024px)"
        T1[Sidebar: Collapsible]
        T2[Charts: 2x2 Grid]
        T3[Header: Compact]
    end

    subgraph "Mobile Portrait (<640px)"
        M1[Sidebar: Overlay drawer]
        M2[Charts: 1x4 Stack]
        M3[Header: Minimal]
    end

    subgraph "Mobile Landscape (<640px)"
        ML1[Sidebar: Hidden]
        ML2[Charts: 2x2 Grid]
        ML3[Header: Minimal]
    end
```

---

## 10. Module File Structure

```mermaid
graph TD
    subgraph "src/modules/watchlist"
        W1[index.ts]
        W2[types.ts]
        W3[watchlist-store.ts]
        W4[components/]
        W5[hooks/]
        W6[utils/]

        W4 --> W4a[watchlist-sidebar.tsx]
        W4 --> W4b[watchlist-item.tsx]
        W4 --> W4c[symbol-search-modal.tsx]

        W5 --> W5a[use-watchlist-socket.ts]
    end

    subgraph "src/modules/charts"
        C1[index.ts]
        C2[types.ts]
        C3[chart-store.ts]
        C4[components/]
        C5[hooks/]
        C6[utils/]

        C4 --> C4a[charts-grid.tsx]
        C4 --> C4b[chart-container.tsx]
        C4 --> C4c[trading-view-chart.tsx]

        C5 --> C5a[use-chart-instance.ts]
        C5 --> C5b[use-candle-data.ts]
        C5 --> C5c[use-horizontal-lines.ts]
    end

    subgraph "src/lib/storage"
        S1[db.ts]
        S2[storage-service.ts]
        S3[persist-middleware.ts]
    end

    subgraph "src/lib/store"
        ST1[root-store.ts]
        ST2[ui-store.ts]
    end
```

---

## 11. Package Dependencies

```mermaid
graph BT
    subgraph "Core"
        React[React 19]
        Vite[Vite]
        TS[TypeScript]
    end

    subgraph "State Management"
        Zustand[Zustand]
    end

    subgraph "Storage"
        IDB[idb]
    end

    subgraph "Charts"
        TV[lightweight-charts]
    end

    subgraph "Utilities"
        CLSX[clsx]
        TM[tailwind-merge]
        UUID[uuid]
    end

    subgraph "Build Tools"
        PWA[vite-plugin-pwa]
        ESLint[ESLint]
        Prettier[Prettier]
    end

    Zustand --> React
    IDB --> React
    TV --> React
    CLSX --> React
    TM --> React
    UUID --> React
```
