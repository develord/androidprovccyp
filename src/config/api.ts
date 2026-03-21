// API Configuration
export const API_CONFIG = {
  // Production API sur Render.com
  BASE_URL: 'https://crypprovid.onrender.com',
  // Pour développement local:
  // - Android Emulator: 'http://10.0.2.2:8000'
  // - Device physique avec adb reverse: 'http://localhost:8000'

  ENDPOINTS: {
    CRYPTOS: '/api/cryptos',
    PREDICTIONS_ALL: '/api/predictions/all',
    PREDICTION: (crypto: string) => `/api/predictions/${crypto}`,
    PRICE: (crypto: string) => `/api/price/${crypto}`,
    HEALTH: '/health',
  },

  TIMEOUT: 10000, // 10 seconds
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
