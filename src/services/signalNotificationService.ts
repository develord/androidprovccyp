// Signal Notification Service - Push local notifications for BUY/SELL opportunities
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService, { CryptoPrediction } from './apiService';

const CHANNEL_ID = 'signal-alerts';
const LAST_SIGNALS_KEY = '@crypto_adviser_last_signals';
const CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes

const COIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  solana: 'Solana (SOL)',
  dogecoin: 'Dogecoin (DOGE)',
  avalanche: 'Avalanche (AVAX)',
  xrp: 'XRP',
  chainlink: 'Chainlink (LINK)',
  cardano: 'Cardano (ADA)',
  near: 'NEAR Protocol',
  polkadot: 'Polkadot (DOT)',
  filecoin: 'Filecoin (FIL)',
};

const COINS = Object.keys(COIN_NAMES);

interface StoredSignal {
  crypto: string;
  signal: string;
  direction: string | null;
  confidence: number;
  timestamp: string;
}

class SignalNotificationService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastSignals: Map<string, StoredSignal> = new Map();

  constructor() {
    this.createChannel();
    this.loadLastSignals();
  }

  private createChannel() {
    PushNotification.createChannel(
      {
        channelId: CHANNEL_ID,
        channelName: 'Signal Alerts',
        channelDescription: 'Notifications for new BUY/SELL trading signals',
        importance: 4, // HIGH
        vibrate: true,
      },
      () => {},
    );
  }

  /**
   * Start monitoring signals in background
   */
  start() {
    if (this.checkInterval) return;
    this.checkSignals(); // immediate first check
    this.checkInterval = setInterval(() => this.checkSignals(), CHECK_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check all coins for new BUY/SELL signals
   */
  private async checkSignals() {
    try {
      const predictions = await Promise.all(
        COINS.map(c => apiService.getPrediction(c).catch(() => null)),
      );

      for (const pred of predictions) {
        if (!pred) continue;
        if (pred.signal === 'HOLD') continue; // only BUY/SELL

        const lastSignal = this.lastSignals.get(pred.crypto);

        // Notify if: new signal OR signal changed (was HOLD/opposite, now BUY/SELL)
        const isNew =
          !lastSignal ||
          lastSignal.signal !== pred.signal ||
          lastSignal.direction !== pred.direction;

        if (isNew) {
          this.sendNotification(pred);
          this.lastSignals.set(pred.crypto, {
            crypto: pred.crypto,
            signal: pred.signal,
            direction: pred.direction,
            confidence: pred.confidence,
            timestamp: pred.timestamp,
          });
        }
      }

      // Also clear signals that went back to HOLD
      for (const pred of predictions) {
        if (pred && pred.signal === 'HOLD') {
          this.lastSignals.delete(pred.crypto);
        }
      }

      await this.saveLastSignals();
    } catch (error) {
      console.error('Signal check error:', error);
    }
  }

  /**
   * Send a local push notification for a signal
   */
  private sendNotification(pred: CryptoPrediction) {
    const coinName = COIN_NAMES[pred.crypto] || pred.crypto;
    const direction = pred.direction || pred.signal;
    const confidence = Math.round(pred.confidence * 100);
    const emoji = pred.signal === 'BUY' ? '🟢' : '🔴';

    let message = `${emoji} ${direction} signal at ${confidence}% confidence`;

    if (pred.current_price) {
      message += ` | Price: $${pred.current_price.toLocaleString()}`;
    }

    if (pred.risk_management) {
      const rm = pred.risk_management;
      if (rm.take_profit_pct && rm.stop_loss_pct) {
        message += ` | TP: +${rm.take_profit_pct.toFixed(1)}% SL: -${rm.stop_loss_pct.toFixed(1)}%`;
      }
    }

    PushNotification.localNotification({
      channelId: CHANNEL_ID,
      title: `${coinName} — ${pred.signal}`,
      message,
      bigText: message,
      smallIcon: 'ic_notification',
      largeIcon: '',
      priority: 'high',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      playSound: true,
    });
  }

  private async loadLastSignals() {
    try {
      const stored = await AsyncStorage.getItem(LAST_SIGNALS_KEY);
      if (stored) {
        const parsed: StoredSignal[] = JSON.parse(stored);
        for (const s of parsed) {
          this.lastSignals.set(s.crypto, s);
        }
      }
    } catch {}
  }

  private async saveLastSignals() {
    try {
      const arr = Array.from(this.lastSignals.values());
      await AsyncStorage.setItem(LAST_SIGNALS_KEY, JSON.stringify(arr));
    } catch {}
  }
}

export default new SignalNotificationService();
