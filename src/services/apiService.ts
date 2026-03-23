// API Service - Consomme l'API FastAPI
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import {
  CryptoPrediction,
  CryptoListResponse,
  AllPredictionsResponse,
  HealthCheckResponse,
} from '../types';

class APIService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_DURATION = 60000; // 1 minute

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.cache = new Map();
  }

  /**
   * Get all available cryptos
   */
  async getCryptosList(): Promise<CryptoListResponse> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.CRYPTOS);
      return response.data;
    } catch (error) {
      console.error('Error fetching cryptos list:', error);
      throw new Error('Failed to fetch cryptos list');
    }
  }

  /**
   * Get all predictions
   */
  async getAllPredictions(): Promise<AllPredictionsResponse> {
    try {
      // Check cache first
      const cached = this.getFromCache('all_predictions');
      if (cached) {
        console.log('Returning cached predictions');
        return cached;
      }

      const url = API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.PREDICTIONS_ALL;
      console.log('Fetching predictions from:', url);

      // Try with native fetch first
      try {
        const fetchResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Fetch response status:', fetchResponse.status);
        const data = await fetchResponse.json();
        console.log('Fetch response received successfully');

        // Cache the result
        this.setCache('all_predictions', data);
        return data;
      } catch (fetchError: any) {
        console.error('Fetch failed, error:', fetchError.message);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Error fetching all predictions:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to fetch predictions');
    }
  }

  /**
   * Get prediction for a specific crypto
   */
  async getPrediction(crypto: string): Promise<CryptoPrediction> {
    try {
      // Check cache first
      const cacheKey = `prediction_${crypto}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`Returning cached prediction for ${crypto}`);
        return cached;
      }

      const response = await this.client.get(API_CONFIG.ENDPOINTS.PREDICTION(crypto));
      const data = response.data;

      // Cache the result
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error(`Error fetching prediction for ${crypto}:`, error);
      throw new Error(`Failed to fetch prediction for ${crypto}`);
    }
  }

  /**
   * Get current price for a crypto
   */
  async getCurrentPrice(crypto: string): Promise<number> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.PRICE(crypto));
      return response.data.price;
    } catch (error) {
      console.error(`Error fetching price for ${crypto}:`, error);
      throw new Error(`Failed to fetch price for ${crypto}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get(API_CONFIG.ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API health check failed');
    }
  }

  /**
   * Run backtest simulation
   */
  async runBacktest(params: {
    crypto: string;
    start_date: string;
    end_date: string;
    tp_pct?: number;
    sl_pct?: number;
    prob_threshold?: number;
  }): Promise<any> {
    try {
      console.log('Running backtest with params:', params);
      const response = await this.client.post('/api/backtest', params);
      return response.data;
    } catch (error: any) {
      console.error('Error running backtest:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Failed to run backtest');
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache cleared');
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export default new APIService();
