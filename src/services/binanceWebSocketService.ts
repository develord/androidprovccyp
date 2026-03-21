// Binance WebSocket Service - Live price updates
import { VirtualTrade } from '../types';

type PriceCallback = (symbol: string, price: number) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<PriceCallback>> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  // Binance WebSocket URL for combined streams
  private readonly WS_BASE_URL = 'wss://stream.binance.com:9443/stream?streams=';

  // Connect to WebSocket
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[BinanceWS] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    console.log('[BinanceWS] Connecting to Binance WebSocket...');

    try {
      // Build stream URL from subscribed symbols
      const streams = Array.from(this.subscribedSymbols)
        .map(symbol => `${symbol.toLowerCase()}@trade`)
        .join('/');

      if (!streams) {
        console.log('[BinanceWS] No symbols to subscribe, skipping connection');
        this.isConnecting = false;
        return;
      }

      const url = `${this.WS_BASE_URL}${streams}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[BinanceWS] Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.stream && data.data) {
            const { s: symbol, p: price } = data.data; // s = symbol, p = price
            const priceNum = parseFloat(price);

            // Notify all subscribers for this symbol
            const callbacks = this.subscribers.get(symbol);
            if (callbacks) {
              callbacks.forEach(callback => callback(symbol, priceNum));
            }
          }
        } catch (error) {
          console.error('[BinanceWS] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[BinanceWS] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('[BinanceWS] Connection closed');
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[BinanceWS] Error creating WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Schedule reconnection
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.log('[BinanceWS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[BinanceWS] Reconnecting in ${this.RECONNECT_DELAY / 1000}s (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.RECONNECT_DELAY);
  }

  // Subscribe to symbol price updates
  subscribe(symbol: string, callback: PriceCallback) {
    console.log(`[BinanceWS] Subscribing to ${symbol}`);

    // Add callback to subscribers
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Add symbol to subscribed list
    const wasEmpty = this.subscribedSymbols.size === 0;
    this.subscribedSymbols.add(symbol);

    // If this is the first subscription or connection is closed, connect
    if (wasEmpty || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.disconnect(); // Close existing connection to reconnect with new symbols
      this.connect();
    }
  }

  // Unsubscribe from symbol price updates
  unsubscribe(symbol: string, callback: PriceCallback) {
    console.log(`[BinanceWS] Unsubscribing from ${symbol}`);

    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);

      // If no more callbacks for this symbol, remove it
      if (callbacks.size === 0) {
        this.subscribers.delete(symbol);
        this.subscribedSymbols.delete(symbol);

        // Reconnect with updated symbol list
        this.disconnect();
        if (this.subscribedSymbols.size > 0) {
          this.connect();
        }
      }
    }
  }

  // Disconnect WebSocket
  disconnect() {
    console.log('[BinanceWS] Disconnecting...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = false;
  }

  // Clean up (disconnect and clear all subscriptions)
  cleanup() {
    console.log('[BinanceWS] Cleaning up...');
    this.disconnect();
    this.subscribers.clear();
    this.subscribedSymbols.clear();
    this.reconnectAttempts = 0;
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default new BinanceWebSocketService();
