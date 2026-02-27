// 2x2 chart grid layout component for TradeDash

import { useChartStore } from '../../lib/stores/chart-store';
import { TradingViewChart } from './tradingview-chart';

/**
 * 2x2 grid layout for displaying 4 TradingView charts
 * Responsive: stacks vertically on mobile
 */
export function ChartGrid() {
  const charts = useChartStore((state) => state.charts);

  return (
    <div
      className="h-full w-full grid gap-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
      }}
    >
      {charts.map((chart, index) => (
        <div
          key={`chart-${index}-${chart.symbol}`}
          className="min-h-0 min-w-0"
          style={{
            gridColumn: `${(index % 2) + 1}`,
            gridRow: `${Math.floor(index / 2) + 1}`,
          }}
        >
          <TradingViewChart
            chartIndex={index}
            symbol={chart.symbol}
            timeframe={chart.timeframe}
            showEMA9={chart.showEMA9}
            showEMA21={chart.showEMA21}
          />
        </div>
      ))}
    </div>
  );
}
