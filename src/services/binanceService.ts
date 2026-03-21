// Binance Service - Fetch real-time price data
import axios, { AxiosInstance } from 'axios';
import { BINANCE_CONFIG } from '../config/api';
import { BinanceTicker, BinanceKline } from '../types';

class BinanceService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BINANCE_CONFIG.BASE_URL,
      timeout: 10000,
    });
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const response = await this.client.get(BINANCE_CONFIG.ENDPOINTS.TICKER_PRICE, {
        params: { symbol: binanceSymbol },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`Error fetching Binance price for ${symbol}:`, error);
      throw new Error(`Failed to fetch price from Binance for ${symbol}`);
    }
  }

  /**
   * Get 24h ticker data
   */
  async get24hTicker(symbol: string): Promise<BinanceTicker> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const response = await this.client.get(BINANCE_CONFIG.ENDPOINTS.TICKER_24H, {
        params: { symbol: binanceSymbol },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching 24h ticker for ${symbol}:`, error);
      throw new Error(`Failed to fetch 24h data from Binance for ${symbol}`);
    }
  }

  /**
   * Get klines/candlestick data for charts
   * @param symbol - Crypto symbol (e.g., 'bitcoin', 'ethereum')
   * @param interval - Kline interval ('1h', '4h', '1d', '1w')
   * @param limit - Number of klines to fetch (default: 100)
   */
  async getKlines(
    symbol: string,
    interval: '1h' | '4h' | '1d' | '1w' = '1h',
    limit: number = 100
  ): Promise<BinanceKline[]> {
    try {
      const binanceSymbol = this.formatSymbol(symbol);
      const response = await this.client.get(BINANCE_CONFIG.ENDPOINTS.KLINES, {
        params: {
          symbol: binanceSymbol,
          interval,
          limit,
        },
      });

      // Transform raw Binance data to typed objects
      return response.data.map((kline: any[]) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
      }));
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error);
      throw new Error(`Failed to fetch chart data from Binance for ${symbol}`);
    }
  }

  /**
   * Get multiple prices at once
   */
  async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      const binanceSymbols = symbols.map(s => this.formatSymbol(s));
      const response = await this.client.get(BINANCE_CONFIG.ENDPOINTS.TICKER_PRICE);

      const priceMap: Record<string, number> = {};
      const allPrices = response.data;

      binanceSymbols.forEach((binanceSymbol, index) => {
        const priceData = allPrices.find((p: any) => p.symbol === binanceSymbol);
        if (priceData) {
          priceMap[symbols[index]] = parseFloat(priceData.price);
        }
      });

      return priceMap;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      throw new Error('Failed to fetch multiple prices from Binance');
    }
  }

  /**
   * Format crypto name to Binance symbol format
   * bitcoin -> BTCUSDT
   * ethereum -> ETHUSDT
   */
  private formatSymbol(crypto: string): string {
    const symbolMap: Record<string, string> = {
      bitcoin: 'BTCUSDT',
      ethereum: 'ETHUSDT',
      binancecoin: 'BNBUSDT',
      bnb: 'BNBUSDT',  // Alternative name
      cardano: 'ADAUSDT',
      solana: 'SOLUSDT',
      ripple: 'XRPUSDT',
      xrp: 'XRPUSDT',  // Alternative name
      polkadot: 'DOTUSDT',
      dogecoin: 'DOGEUSDT',
      avalanche: 'AVAXUSDT',
      polygon: 'MATICUSDT',
      chainlink: 'LINKUSDT',
      litecoin: 'LTCUSDT',
      uniswap: 'UNIUSDT',
      cosmos: 'ATOMUSDT',
      monero: 'XMRUSDT',
      stellar: 'XLMUSDT',
      'ethereum-classic': 'ETCUSDT',
      filecoin: 'FILUSDT',
      tron: 'TRXUSDT',
      'crypto-com-chain': 'CROUSDT',
    };

    const symbol = symbolMap[crypto.toLowerCase()];
    if (!symbol) {
      console.warn(`No Binance symbol mapping for ${crypto}, using default format`);
      return `${crypto.toUpperCase()}USDT`;
    }
    return symbol;
  }
}

export default new BinanceService();
