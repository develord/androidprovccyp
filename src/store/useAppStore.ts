/**
 * Global App Store (Zustand)
 * Persists data across screen navigation — shows cached data instantly,
 * then refreshes silently in background for fluid UX.
 */
import { create } from 'zustand';
import { CryptoPrediction } from '../services/apiService';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: { label: 'bullish' | 'bearish' | 'neutral'; score: number };
  coins: string[];
}

interface CryptoTicker {
  symbol: string;
  coin: string;
  price: number;
  change24h: number;
  changePct: number;
  volume: number;
  high24h: number;
  low24h: number;
  hasAI: boolean;
}

interface AnalysisData {
  data: any;
  fetchedAt: number;
}

interface AppState {
  // Home
  tickers: CryptoTicker[];
  tickersFetchedAt: number;
  setTickers: (tickers: CryptoTicker[]) => void;

  // Signals
  signals: CryptoPrediction[];
  signalsFetchedAt: number;
  setSignals: (signals: CryptoPrediction[]) => void;

  // News
  articles: NewsArticle[];
  newsFetchedAt: number;
  setArticles: (articles: NewsArticle[]) => void;

  // Analysis (per coin)
  analysisCache: Record<string, AnalysisData>;
  setAnalysis: (coin: string, data: any) => void;
  getAnalysis: (coin: string) => any | null;
}

const useAppStore = create<AppState>((set, get) => ({
  // Home
  tickers: [],
  tickersFetchedAt: 0,
  setTickers: (tickers) => set({ tickers, tickersFetchedAt: Date.now() }),

  // Signals
  signals: [],
  signalsFetchedAt: 0,
  setSignals: (signals) => set({ signals, signalsFetchedAt: Date.now() }),

  // News
  articles: [],
  newsFetchedAt: 0,
  setArticles: (articles) => set({ articles, newsFetchedAt: Date.now() }),

  // Analysis
  analysisCache: {},
  setAnalysis: (coin, data) =>
    set((state) => ({
      analysisCache: {
        ...state.analysisCache,
        [coin]: { data, fetchedAt: Date.now() },
      },
    })),
  getAnalysis: (coin) => {
    const cached = get().analysisCache[coin];
    if (!cached) return null;
    // 1h TTL
    if (Date.now() - cached.fetchedAt > 3600000) return null;
    return cached.data;
  },
}));

export default useAppStore;
