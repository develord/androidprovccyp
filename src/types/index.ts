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
  probabilities?: Probabilities; // Optional - V6 only
  threshold?: number; // V11 optimal threshold
  model_version?: string; // Model version (v11_temporal, v6, etc.)
  current_price: number;
  risk_management: RiskManagement | null;
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
