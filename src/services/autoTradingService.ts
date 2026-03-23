// Auto Trading Service - Automated trading system with V11 model
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './apiService';
import virtualTradeService from './virtualTradeService';
import binanceWebSocketService from './binanceWebSocketService';
import autoTradingBackgroundService from './autoTradingBackgroundService';

// Configuration
const AUTO_TRADING_CONFIG = {
  INITIAL_BUDGET: 10000, // $10,000 budget initial
  POSITION_SIZE_PERCENT: 0.05, // 5% du budget par trade
  CHECK_INTERVAL: 1 * 60 * 1000, // 1 minute pour tests (était 15 minutes)
  CRYPTOS: ['bitcoin', 'ethereum', 'solana'], // Cryptos à monitorer
  // Note: Pas de MIN_CONFIDENCE car l'API utilise déjà un threshold optimisé par crypto
};

const AUTO_TRADING_STATE_KEY = '@crypto_adviser_auto_trading_enabled';

interface AutoTradingStats {
  initialBudget: number;
  currentBudget: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
}

interface TradingState {
  isRunning: boolean;
  lastCheckTime: Date | null;
  currentPrices: Map<string, number>;
}

class AutoTradingService {
  private state: TradingState = {
    isRunning: false,
    lastCheckTime: null,
    currentPrices: new Map(),
  };

  private checkInterval: NodeJS.Timeout | null = null;
  private stats: AutoTradingStats = {
    initialBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET,
    currentBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfitLoss: 0,
  };

  constructor() {
    this.initializeNotificationChannel();
    this.loadStats();
    this.loadState();
  }

  // Initialize notification channel for auto-trading alerts
  private initializeNotificationChannel() {
    PushNotification.createChannel(
      {
        channelId: 'auto-trading',
        channelName: 'Auto Trading',
        channelDescription: 'Notifications for automated trades',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`[AutoTrading] Channel created: ${created}`)
    );
  }

  // Load stats from storage
  private async loadStats() {
    try {
      const trades = await virtualTradeService.getAllTrades();

      let totalPL = 0;
      let wins = 0;
      let losses = 0;

      trades.forEach(trade => {
        if (trade.status === 'success' || trade.status === 'failed') {
          if (trade.profitLoss) {
            totalPL += trade.profitLoss;
          }
          if (trade.status === 'success') wins++;
          if (trade.status === 'failed') losses++;
        }
      });

      this.stats = {
        initialBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET,
        currentBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET + totalPL,
        totalTrades: trades.length,
        winningTrades: wins,
        losingTrades: losses,
        winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
        totalProfitLoss: totalPL,
      };

      console.log('[AutoTrading] Stats loaded:', this.stats);
    } catch (error) {
      console.error('[AutoTrading] Error loading stats:', error);
    }
  }

  // Load persisted state from AsyncStorage
  private async loadState() {
    try {
      const savedState = await AsyncStorage.getItem(AUTO_TRADING_STATE_KEY);
      if (savedState === 'true') {
        console.log('[AutoTrading] Found persisted enabled state, restoring auto-trading...');
        this.state.isRunning = false; // Reset to false so start() can execute fully
        // Auto-start if it was previously enabled
        await this.start();
      } else {
        console.log('[AutoTrading] No persisted state or disabled');
      }
    } catch (error) {
      console.error('[AutoTrading] Error loading state:', error);
    }
  }

  // Save state to AsyncStorage
  private async saveState(isEnabled: boolean) {
    try {
      await AsyncStorage.setItem(AUTO_TRADING_STATE_KEY, isEnabled ? 'true' : 'false');
      console.log('[AutoTrading] State saved:', isEnabled);
    } catch (error) {
      console.error('[AutoTrading] Error saving state:', error);
    }
  }

  // Start auto trading
  async start() {
    if (this.state.isRunning) {
      console.log('[AutoTrading] Already running');
      return;
    }

    console.log('[AutoTrading] Starting auto trading system...');
    this.state.isRunning = true;

    // Save state to persist across app restarts
    await this.saveState(true);

    // Start the native Android background service (with WorkManager)
    autoTradingBackgroundService.startBackgroundService();

    // Subscribe to WebSocket for all cryptos
    AUTO_TRADING_CONFIG.CRYPTOS.forEach(crypto => {
      const symbol = this.getSymbol(crypto);
      binanceWebSocketService.subscribe(symbol, (receivedSymbol, price) => {
        this.state.currentPrices.set(crypto, price);
      });
    });

    // Note: Ne pas appeler checkAndTrade() immédiatement ici car le HeadlessJS le fait déjà
    // pour éviter la création de trades en double

    // Set interval for periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAndTrade();
    }, AUTO_TRADING_CONFIG.CHECK_INTERVAL);

    console.log('════════════════════════════════════════════════════════');
    console.log(`✅ [AutoTrading] System STARTED`);
    console.log(`⏱️  Check interval: ${AUTO_TRADING_CONFIG.CHECK_INTERVAL / 1000 / 60} minute(s)`);
    console.log(`📈 Monitoring: ${AUTO_TRADING_CONFIG.CRYPTOS.join(', ')}`);
    console.log('════════════════════════════════════════════════════════\n');
  }

  // Stop auto trading
  async stop() {
    if (!this.state.isRunning) {
      console.log('[AutoTrading] Not running');
      return;
    }

    console.log('[AutoTrading] Stopping auto trading system...');
    this.state.isRunning = false;

    // Save state to persist across app restarts
    await this.saveState(false);

    // Stop the native Android background service
    autoTradingBackgroundService.stopBackgroundService();

    // Clear interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Unsubscribe from all WebSocket connections
    AUTO_TRADING_CONFIG.CRYPTOS.forEach(crypto => {
      const symbol = this.getSymbol(crypto);
      binanceWebSocketService.unsubscribe(symbol, () => {});
    });

    console.log('[AutoTrading] System stopped');
  }

  // Check conditions and create trade if criteria met (exposed for HeadlessJS)
  async checkAndTrade() {
    try {
      const checkTime = new Date();
      console.log('════════════════════════════════════════════════════════');
      console.log(`🔄 [AutoTrading CHECK] ${checkTime.toLocaleTimeString()}`);
      console.log('════════════════════════════════════════════════════════');
      this.state.lastCheckTime = checkTime;

      // Get all predictions in one call (more reliable than individual calls)
      console.log('[AutoTrading] Fetching predictions from API...');
      const allPredictionsData = await apiService.getAllPredictions();
      const predictions = allPredictionsData.predictions;
      console.log('[AutoTrading] ✅ API Response received');

      // Check each crypto
      console.log('\n📊 Analyzing cryptos:');
      for (const crypto of AUTO_TRADING_CONFIG.CRYPTOS) {
        const prediction = predictions[crypto];

        if (!prediction) {
          console.log(`  ⚠️  ${crypto.toUpperCase()}: No prediction available`);
          continue;
        }

        console.log(`  💰 ${crypto.toUpperCase()}: Price=$${prediction.current_price.toFixed(2)} | Signal=${prediction.signal} | Confidence=${(prediction.confidence * 100).toFixed(1)}%`);

        // Check if conditions are met for auto-trade
        const shouldTrade = await this.shouldCreateTrade(prediction, crypto);

        if (shouldTrade) {
          console.log(`  🚀 ${crypto.toUpperCase()}: Creating trade...`);
          await this.createAutoTrade(prediction, crypto);
        }
      }

      console.log('════════════════════════════════════════════════════════');
      console.log('✅ [AutoTrading CHECK] Completed\n');

    } catch (error) {
      console.error('════════════════════════════════════════════════════════');
      console.error('❌ [AutoTrading CHECK] Error:', error);
      console.error('════════════════════════════════════════════════════════\n');
    }
  }

  // Determine if we should create a trade based on backtest conditions
  private async shouldCreateTrade(prediction: any, crypto: string): Promise<boolean> {
    // Conditions du backtest V11:
    // 1. Signal BUY (API fait déjà: confidence >= threshold optimisé)
    // 2. Pas de trade ouvert pour cette crypto

    // L'API retourne déjà BUY/HOLD basé sur: confidence >= threshold
    // Le threshold est optimisé par crypto (ex: 0.35 pour certains)
    // Donc on utilise directement le signal sans re-vérifier
    if (!prediction.signal || prediction.signal === 'HOLD') {
      console.log(`[AutoTrading] ${crypto}: Signal is ${prediction.signal}, skipping (confidence: ${(prediction.confidence * 100).toFixed(1)}%, threshold: ${(prediction.threshold * 100).toFixed(1)}%)`);
      return false;
    }

    // Check if we already have an open trade for this crypto
    // (On ne fait pas plusieurs trades simultanés sur la même crypto)
    const openTrades = await virtualTradeService.getOpenTrades();
    const hasOpenTrade = openTrades.some(trade => trade.cryptoId === crypto);

    if (hasOpenTrade) {
      console.log(`[AutoTrading] ${crypto}: Already has open trade, skipping`);
      return false;
    }

    console.log(`[AutoTrading] ${crypto}: ✅ BUY signal! Confidence=${(prediction.confidence * 100).toFixed(1)}% (threshold=${(prediction.threshold * 100).toFixed(1)}%)`);
    return true;
  }

  // Create automated trade
  private async createAutoTrade(prediction: any, cryptoId: string) {
    try {
      const positionSize = this.stats.currentBudget * AUTO_TRADING_CONFIG.POSITION_SIZE_PERCENT;
      const quantity = positionSize / prediction.current_price;

      console.log(`[AutoTrading] Creating auto trade for ${cryptoId}...`);
      console.log(`  Signal: ${prediction.signal}`);
      console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`  Entry Price: $${prediction.current_price.toFixed(2)}`);
      console.log(`  Position Size: $${positionSize.toFixed(2)} (${quantity.toFixed(6)} units)`);

      const trade = await virtualTradeService.createTrade({
        cryptoId,
        symbol: prediction.symbol,
        name: prediction.name,
        signal: prediction.signal,
        entryPrice: prediction.current_price,
        targetPrice: prediction.risk_management.target_price,
        stopLoss: prediction.risk_management.stop_loss,
        quantity,
        confidence: prediction.confidence,
        currentPrice: prediction.current_price,
      });

      // Update stats
      await this.loadStats();

      // Send notification
      this.sendTradeNotification(trade, 'created');

      console.log(`[AutoTrading] Trade created successfully:`, trade.id);
    } catch (error) {
      console.error('[AutoTrading] Error creating auto trade:', error);
    }
  }

  // Send push notification
  private sendTradeNotification(trade: any, type: 'created' | 'closed') {
    if (type === 'created') {
      PushNotification.localNotification({
        channelId: 'auto-trading',
        title: `🤖 Auto Trade Created - ${trade.cryptoName}`,
        message: `${trade.signal} signal @ $${trade.entryPrice.toFixed(2)} | Confidence: ${(trade.confidence * 100).toFixed(1)}%`,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        priority: 'high',
        userInfo: {
          tradeId: trade.id,
          type: 'auto-trade-created',
        },
      });
    } else if (type === 'closed') {
      const isWin = trade.status === 'success';
      const profitLossFormatted = trade.profitLoss?.toFixed(2) || '0.00';

      PushNotification.localNotification({
        channelId: 'auto-trading',
        title: isWin ? `✅ Auto Trade Win - ${trade.cryptoName}` : `❌ Auto Trade Loss - ${trade.cryptoName}`,
        message: isWin
          ? `Target reached! Profit: $${profitLossFormatted}`
          : `Stop loss hit. Loss: $${profitLossFormatted}`,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        priority: 'high',
        userInfo: {
          tradeId: trade.id,
          type: 'auto-trade-closed',
        },
      });
    }
  }

  // Get trading symbol for crypto
  private getSymbol(cryptoId: string): string {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTCUSDT',
      'ethereum': 'ETHUSDT',
      'solana': 'SOLUSDT',
    };
    return symbolMap[cryptoId] || 'BTCUSDT';
  }

  // Get current stats
  getStats(): AutoTradingStats {
    return { ...this.stats };
  }

  // Get trading state
  getState(): TradingState {
    return { ...this.state };
  }

  // Check if system is running
  isRunning(): boolean {
    return this.state.isRunning;
  }

  // Reset stats (for testing)
  async resetStats() {
    this.stats = {
      initialBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET,
      currentBudget: AUTO_TRADING_CONFIG.INITIAL_BUDGET,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfitLoss: 0,
    };
    console.log('[AutoTrading] Stats reset');
  }
}

export default new AutoTradingService();
