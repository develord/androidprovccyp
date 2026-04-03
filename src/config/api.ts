// API Configuration
export const API_CONFIG = {
  // Production API on Hetzner VPS (CNN LONG+SHORT models)
  BASE_URL: 'http://204.168.236.23:8080',

  ENDPOINTS: {
    CRYPTOS: '/api/cryptos',
    PREDICTION: (crypto: string) => `/api/predictions/${crypto}`,
    PRICE: (crypto: string) => `/api/price/${crypto}`,
    HEALTH: '/health',
  },

  TIMEOUT: 30000, // 30 seconds (CNN prediction takes time)
};

// Binance API Configuration
export const BINANCE_CONFIG = {
  // Use data-api.binance.vision instead of api.binance.com to avoid HTTP 451 errors
  // data-api.binance.vision works for public market data from ANY location
  BASE_URL: 'https://data-api.binance.vision',
  WS_URL: 'wss://stream.binance.com:9443/ws',

  ENDPOINTS: {
    KLINES: '/api/v3/klines',
    TICKER_24H: '/api/v3/ticker/24hr',
    TICKER_PRICE: '/api/v3/ticker/price',
  },
};
