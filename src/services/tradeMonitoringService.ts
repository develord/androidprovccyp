// Trade Monitoring Service - Background monitoring with push notifications
import { AppState, AppStateStatus } from 'react-native';
import PushNotification from 'react-native-push-notification';
import virtualTradeService from './virtualTradeService';
import binanceWebSocketService from './binanceWebSocketService';
import { VirtualTrade } from '../types';

type PriceCallback = (symbol: string, price: number) => void;

class TradeMonitoringService {
  private isMonitoring: boolean = false;
  private appState: AppStateStatus = 'active';
  private monitoredTrades: Map<string, VirtualTrade> = new Map();
  private tradeCallbacks: Map<string, PriceCallback> = new Map(); // Store callbacks by trade ID

  constructor() {
    // Configure push notifications
    this.configurePushNotifications();

    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Configure push notifications
  private configurePushNotifications() {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('[TradeMonitor] Push notification token:', token);
      },

      onNotification: (notification) => {
        console.log('[TradeMonitor] Notification received:', notification);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: false, // Changed to false - we only use local notifications, not Firebase
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: 'trade-alerts',
        channelName: 'Trade Alerts',
        channelDescription: 'Notifications for trade wins and losses',
        playSound: true,
        soundName: 'default',
        importance: 4, // High importance
        vibrate: true,
      },
      (created) => console.log(`[TradeMonitor] Channel created: ${created}`)
    );
  }

  // Handle app state changes
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`[TradeMonitor] App state changed: ${this.appState} -> ${nextAppState}`);
    this.appState = nextAppState;

    // Start monitoring when app goes to background
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.startMonitoring();
    }
    // Keep monitoring even in active state for real-time updates
  };

  // Start monitoring all open trades
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('[TradeMonitor] Already monitoring');
      return;
    }

    console.log('[TradeMonitor] Starting trade monitoring...');
    this.isMonitoring = true;

    try {
      // Get all open trades
      const openTrades = await virtualTradeService.getOpenTrades();
      console.log(`[TradeMonitor] Found ${openTrades.length} open trades`);

      if (openTrades.length === 0) {
        this.stopMonitoring();
        return;
      }

      // Subscribe to price updates for each trade
      openTrades.forEach(trade => {
        this.monitoredTrades.set(trade.id, trade);
        this.subscribeToTrade(trade);
      });

    } catch (error) {
      console.error('[TradeMonitor] Error starting monitoring:', error);
      this.isMonitoring = false;
    }
  }

  // Subscribe to a trade's price updates
  private subscribeToTrade(trade: VirtualTrade) {
    const { symbol, id } = trade;

    console.log(`[TradeMonitor] Subscribing to ${symbol} for trade ${id}`);

    // Create and store the callback
    const callback: PriceCallback = async (receivedSymbol, price) => {
      if (receivedSymbol !== symbol) return;

      console.log(`[TradeMonitor] Price update for ${symbol}: ${price}`);

      // Update trade with new price
      const updatedTrade = await virtualTradeService.updateTradePrice(id, price);

      if (!updatedTrade) {
        console.log(`[TradeMonitor] Trade ${id} not found or already closed`);
        return;
      }

      // Check if trade status changed (win/loss)
      const oldTrade = this.monitoredTrades.get(id);
      if (oldTrade && oldTrade.status === 'open' && updatedTrade.status !== 'open') {
        console.log(`[TradeMonitor] Trade ${id} status changed: ${oldTrade.status} -> ${updatedTrade.status}`);

        // Send push notification
        this.sendTradeNotification(updatedTrade);

        // Unsubscribe from this trade
        const storedCallback = this.tradeCallbacks.get(id);
        if (storedCallback) {
          binanceWebSocketService.unsubscribe(symbol, storedCallback);
          this.tradeCallbacks.delete(id);
        }
        this.monitoredTrades.delete(id);

        // Stop monitoring if no more trades
        if (this.monitoredTrades.size === 0) {
          this.stopMonitoring();
        }
      } else {
        // Update local cache
        this.monitoredTrades.set(id, updatedTrade);
      }
    };

    // Store the callback
    this.tradeCallbacks.set(id, callback);

    // Subscribe with the stored callback
    binanceWebSocketService.subscribe(symbol, callback);
  }

  // Send push notification for trade result
  private sendTradeNotification(trade: VirtualTrade) {
    const isWin = trade.status === 'success';
    const profitLossFormatted = trade.profitLoss?.toFixed(2) || '0.00';
    const profitLossPercent = trade.profitLossPercent?.toFixed(2) || '0.00';

    const title = isWin
      ? `🎉 Trade Win! ${trade.cryptoName}`
      : `⚠️ Trade Loss - ${trade.cryptoName}`;

    const message = isWin
      ? `Target reached! Profit: $${profitLossFormatted} (+${profitLossPercent}%)`
      : `Stop loss hit. Loss: $${profitLossFormatted} (${profitLossPercent}%)`;

    console.log(`[TradeMonitor] Sending notification: ${title} - ${message}`);

    PushNotification.localNotification({
      channelId: 'trade-alerts',
      title,
      message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      priority: 'high',
      visibility: 'public',
      importance: 'high',
      userInfo: {
        tradeId: trade.id,
        crypto: trade.crypto,
        status: trade.status,
      },
      actions: ['View Trade'],
    });
  }

  // Stop monitoring all trades
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('[TradeMonitor] Not monitoring');
      return;
    }

    console.log('[TradeMonitor] Stopping trade monitoring...');
    this.isMonitoring = false;

    // Unsubscribe from each trade individually
    this.monitoredTrades.forEach((trade, tradeId) => {
      const callback = this.tradeCallbacks.get(tradeId);
      if (callback) {
        binanceWebSocketService.unsubscribe(trade.symbol, callback);
      }
    });

    this.monitoredTrades.clear();
    this.tradeCallbacks.clear();
  }

  // Add new trade to monitoring
  async addTradeToMonitor(tradeId: string) {
    const trade = await virtualTradeService.getTradeById(tradeId);
    if (!trade || trade.status !== 'open') {
      console.log(`[TradeMonitor] Trade ${tradeId} not found or not open`);
      return;
    }

    console.log(`[TradeMonitor] Adding trade ${tradeId} to monitoring`);
    this.monitoredTrades.set(tradeId, trade);
    this.subscribeToTrade(trade);

    if (!this.isMonitoring) {
      this.startMonitoring();
    }
  }

  // Remove trade from monitoring
  removeTradeFromMonitor(tradeId: string) {
    const trade = this.monitoredTrades.get(tradeId);
    if (!trade) {
      console.log(`[TradeMonitor] Trade ${tradeId} not in monitoring`);
      return;
    }

    console.log(`[TradeMonitor] Removing trade ${tradeId} from monitoring`);

    // Unsubscribe using the stored callback
    const callback = this.tradeCallbacks.get(tradeId);
    if (callback) {
      binanceWebSocketService.unsubscribe(trade.symbol, callback);
      this.tradeCallbacks.delete(tradeId);
    }

    this.monitoredTrades.delete(tradeId);

    if (this.monitoredTrades.size === 0) {
      this.stopMonitoring();
    }
  }

  // Check if monitoring is active
  isActive(): boolean {
    return this.isMonitoring;
  }

  // Get number of monitored trades
  getMonitoredTradesCount(): number {
    return this.monitoredTrades.size;
  }
}

export default new TradeMonitoringService();
