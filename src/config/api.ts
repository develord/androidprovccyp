// API Configuration
export const API_CONFIG = {
  // Production API on Hetzner VPS with HTTPS + DuckDNS domain on port 443
  BASE_URL: 'https://crypto-trading-bot.duckdns.org',

  // Static API key for app identification (matches server APP_API_KEY)
  API_KEY: '098e53ee1afd8cbb5079c7ed6321f7f3',

  ENDPOINTS: {
    CRYPTOS: '/api/cryptos',
    PREDICTION: (crypto: string) => `/api/predictions/${crypto}`,
    PRICE: (crypto: string) => `/api/price/${crypto}`,
    HEALTH: '/health',
    AUTH_GOOGLE: '/auth/google',
    AUTH_BINANCE: '/auth/binance',
    AUTH_REFRESH: '/auth/refresh',
    AUTH_ME: '/auth/me',
    CREDITS: '/api/credits',
    CREDITS_EARN: '/api/credits/earn',
    CREDITS_SPEND: '/api/credits/spend',
    ANALYSIS: (crypto: string) => `/api/analysis/${crypto}`,
    NEWS: '/api/news',
  },

  TIMEOUT: 30000, // 30 seconds (CNN prediction takes time)
};

// Google Sign-In Configuration
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: '133497870542-bppv7o3ehb0mj3gh9k9k8me79clsfcoe.apps.googleusercontent.com',
};

// Binance OAuth2 Configuration
export const BINANCE_OAUTH_CONFIG = {
  CLIENT_ID: 'YOUR_BINANCE_CLIENT_ID',
  AUTH_URL: 'https://accounts.binance.com/oauth/authorize',
  REDIRECT_URI: 'cryptoadviser://auth/binance/callback',
  SCOPE: 'user:openId',
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
