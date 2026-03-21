// Custom hook for live price updates via WebSocket
import { useState, useEffect, useRef } from 'react';
import binanceWebSocketService from '../services/binanceWebSocketService';

interface UseLivePriceOptions {
  symbol: string;
  enabled?: boolean;
  onPriceUpdate?: (price: number) => void;
}

export const useLivePrice = ({ symbol, enabled = true, onPriceUpdate }: UseLivePriceOptions) => {
  const [price, setPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onPriceUpdate);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  useEffect(() => {
    if (!enabled || !symbol) {
      return;
    }

    console.log(`[useLivePrice] Subscribing to ${symbol}`);

    // Price update callback
    const handlePriceUpdate = (receivedSymbol: string, newPrice: number) => {
      if (receivedSymbol === symbol) {
        setPrice(newPrice);
        callbackRef.current?.(newPrice);
      }
    };

    // Subscribe to symbol
    binanceWebSocketService.subscribe(symbol, handlePriceUpdate);

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(binanceWebSocketService.isConnected());
    }, 1000);

    // Cleanup
    return () => {
      console.log(`[useLivePrice] Unsubscribing from ${symbol}`);
      binanceWebSocketService.unsubscribe(symbol, handlePriceUpdate);
      clearInterval(checkConnection);
    };
  }, [symbol, enabled]);

  return {
    price,
    isConnected,
  };
};
