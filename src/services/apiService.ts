// API Service - CNN Prediction API
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';

// Types for CNN API responses
export interface CryptoPrediction {
  crypto: string;
  symbol: string;
  name: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  direction: 'LONG' | 'SHORT' | null;
  confidence: number;
  long_confidence: number | null;
  short_confidence: number | null;
  long_filter: string | null;
  short_filter: string | null;
  current_price: number;
  risk_management: {
    target_price: number;
    stop_loss: number;
    take_profit_pct: number;
    stop_loss_pct: number;
    risk_reward_ratio: number;
  } | null;
  model: string;
  timestamp: string;
  data_source: string;
}

export interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
  models: string[];
  status: string;
}

class APIService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 60000; // 1 minute

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: { 'Content-Type': 'application/json' },
    });
    this.cache = new Map();
  }

  /**
   * Get all supported cryptos (BTC, ETH, SOL, DOGE, AVAX)
   */
  async getCryptosList(): Promise<{ cryptos: Record<string, CryptoInfo>; count: number }> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.CRYPTOS);
      return response.data;
    } catch (error) {
      console.error('Error fetching cryptos:', error);
      throw new Error('Failed to fetch cryptos list');
    }
  }

  /**
   * Get CNN prediction for a specific crypto (LONG + SHORT)
   */
  async getPrediction(crypto: string): Promise<CryptoPrediction> {
    try {
      const cacheKey = `prediction_${crypto}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await this.client.get(API_CONFIG.ENDPOINTS.PREDICTION(crypto));
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching prediction for ${crypto}:`, error);
      throw new Error(`Failed to fetch prediction for ${crypto}`);
    }
  }

  /**
   * Get predictions for ALL cryptos
   */
  async getAllPredictions(): Promise<CryptoPrediction[]> {
    const cryptos = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'avalanche'];
    const predictions = await Promise.all(
      cryptos.map(c => this.getPrediction(c).catch(() => null))
    );
    return predictions.filter(p => p !== null) as CryptoPrediction[];
  }

  /**
   * Get current price
   */
  async getCurrentPrice(crypto: string): Promise<number> {
    try {
      const prediction = await this.getPrediction(crypto);
      return prediction.current_price;
    } catch (error) {
      console.error(`Error fetching price for ${crypto}:`, error);
      throw new Error(`Failed to fetch price for ${crypto}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API health check failed');
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export default new APIService();
