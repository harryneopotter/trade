// Watchlist module types for TradeDash

export interface WatchlistItemData {
  symbol: string;
  price: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: number;
}

export interface SymbolSearchResult {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}
