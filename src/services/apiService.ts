// API Service - Prediction API
import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api';
import AuthService from './authService';

// Types for API responses
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

    // Request interceptor: attach JWT + API key
    this.client.interceptors.request.use(async config => {
      config.headers['X-API-Key'] = API_CONFIG.API_KEY;
      const token = await AuthService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: auto-refresh on 401
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await AuthService.refreshToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          }
          // Refresh failed — AuthService already cleared tokens
        }
        return Promise.reject(error);
      },
    );
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

  // ---- Credits API ----

  async getCredits(): Promise<{ balance: number; last_updated: string }> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.CREDITS);
      return response.data;
    } catch (error) {
      console.error('Error fetching credits:', error);
      throw new Error('Failed to fetch credits');
    }
  }

  async earnCredits(adId: string): Promise<{ balance: number; last_updated: string }> {
    try {
      const response = await this.client.post(API_CONFIG.ENDPOINTS.CREDITS_EARN, {
        ad_id: adId,
        reward_amount: 3,
      });
      return response.data;
    } catch (error) {
      console.error('Error earning credits:', error);
      throw new Error('Failed to earn credits');
    }
  }

  async spendCredits(crypto: string): Promise<{ success: boolean; balance: number; crypto: string }> {
    try {
      const response = await this.client.post(API_CONFIG.ENDPOINTS.CREDITS_SPEND, {
        crypto,
        amount: 3,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        return { success: false, balance: 0, crypto };
      }
      throw error;
    }
  }

  /**
   * Get technical analysis for a crypto
   */
  async getTechnicalAnalysis(crypto: string): Promise<any> {
    try {
      const cacheKey = `analysis_${crypto}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await this.client.get(`/api/analysis/${crypto}`);
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching analysis for ${crypto}:`, error);
      throw new Error(`Failed to fetch analysis for ${crypto}`);
    }
  }

  /**
   * Get crypto news with sentiment classification
   */
  async getNews(): Promise<any> {
    try {
      const cacheKey = 'news';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      const response = await this.client.get('/api/news');
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw new Error('Failed to fetch news');
    }
  }

  async registerFcmToken(fcmToken: string, platform: string = 'android'): Promise<void> {
    try {
      await this.client.post('/api/notifications/register', {
        fcm_token: fcmToken,
        platform,
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  async getSignalHistory(coin: string | null = null): Promise<any> {
    const params: any = { limit: 100 };
    if (coin) params.coin = coin;
    const { data } = await this.client.get('/api/notifications/history', { params });
    return data;
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
