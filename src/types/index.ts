// TypeScript Types & Interfaces

export interface RiskManagement {
  target_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  potential_gain_percent: number;
  potential_loss_percent: number;
}

export interface Probabilities {
  buy: number;
  sell: number;
  hold: number;
}

export interface CryptoPrediction {
  crypto: string;
  symbol: string;
  name: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  direction?: 'LONG' | 'SHORT' | null;
  long_confidence?: number | null;
  short_confidence?: number | null;
  long_filter?: string | null;
  short_filter?: string | null;
  model?: string | null;
  data_source?: string | null;
  probabilities?: Probabilities | null;
  threshold?: number | null;
  model_version?: string | null;
  current_price: number | null;
  risk_management: any | null;
  timestamp: string;
}

export interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
}

export interface CryptoListResponse {
  cryptos: Record<string, CryptoInfo>;
  count: number;
}

export interface AllPredictionsResponse {
  predictions: Record<string, CryptoPrediction>;
  timestamp: string;
  count: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  models_loaded: number;
  cryptos_available: string[];
}

// Binance Types
export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

// Virtual Trade Types
export interface VirtualTrade {
  id: string;
  cryptoId: string;
  symbol: string;
  name: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  confidence: number;
  status: 'open' | 'success' | 'failed' | 'closed';
  currentPrice?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  createdAt: string;
  closedAt?: string;
  priceHistory?: Array<{
    price: number;
    timestamp: string;
  }>;
}

// App Navigation Types
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  HomeTab: undefined;
  PortfolioTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  HomeTabs: NavigatorScreenParams<TabParamList> | undefined;
  Detail: { crypto: CryptoPrediction };
  TradeDetail: { trade: VirtualTrade };
  Simulation: undefined;
};

// Stats for Home Screen
export interface Stats {
  total: number;
  buy: number;
  sell: number;
  hold: number;
}
