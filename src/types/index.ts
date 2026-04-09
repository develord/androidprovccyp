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

// Auth Types
export interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar: string | null;
  auth_provider: 'google' | 'binance';
  created_at: string;
  last_login: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// App Navigation Types
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  HomeTab: undefined;
  SignalsTab: undefined;
  NewsTab: undefined;
  PortfolioTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  HomeTabs: NavigatorScreenParams<TabParamList> | undefined;
  Detail: { crypto: CryptoPrediction };
  Analysis: { coin: string; price: number; changePct: number };
  TradeDetail: { trade: VirtualTrade };
  Simulation: undefined;
};

// Credits Types
export interface CreditsInfo {
  balance: number;
  last_updated: string;
}

export interface CreditTransaction {
  id: number;
  amount: number;
  type: 'earn_ad' | 'spend_view' | 'bonus_signup';
  crypto: string | null;
  timestamp: string;
}

// Stats for Home Screen
export interface Stats {
  total: number;
  buy: number;
  sell: number;
  hold: number;
}
