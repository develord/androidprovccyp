// Credits Context - Global credits/points state with AdMob integration
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import APIService from '../services/apiService';
import AdService from '../services/adService';

const CREDITS_CACHE_KEY = '@crypto_adviser_credits';

interface CreditsContextType {
  balance: number;
  isLoading: boolean;
  unlockedCoins: Set<string>;
  adReady: boolean;
  fetchBalance: () => Promise<void>;
  watchAdAndEarn: () => Promise<boolean>;
  spendOnCrypto: (crypto: string) => Promise<boolean>;
  isCoinUnlocked: (crypto: string) => boolean;
  resetUnlocks: () => void;
}

const CreditsContext = createContext<CreditsContextType>({
  balance: 0,
  isLoading: true,
  unlockedCoins: new Set(),
  adReady: false,
  fetchBalance: async () => {},
  watchAdAndEarn: async () => false,
  spendOnCrypto: async () => false,
  isCoinUnlocked: () => false,
  resetUnlocks: () => {},
});

export const useCredits = () => useContext(CreditsContext);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedCoins, setUnlockedCoins] = useState<Set<string>>(new Set());
  const [adReady, setAdReady] = useState(false);

  // Load cached balance immediately, then sync with server
  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(0);
      setUnlockedCoins(new Set());
      setIsLoading(false);
      return;
    }

    const init = async () => {
      // Load cache for instant UI
      try {
        const cached = await AsyncStorage.getItem(CREDITS_CACHE_KEY);
        if (cached) setBalance(parseInt(cached, 10));
      } catch {}

      // Sync with server
      try {
        const data = await APIService.getCredits();
        setBalance(data.balance);
        await AsyncStorage.setItem(CREDITS_CACHE_KEY, String(data.balance));
      } catch {}

      setIsLoading(false);
    };

    init();

    // Preload first ad
    AdService.load();
  }, [isAuthenticated]);

  // Check ad readiness periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setAdReady(AdService.isReady());
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await APIService.getCredits();
      setBalance(data.balance);
      await AsyncStorage.setItem(CREDITS_CACHE_KEY, String(data.balance));
    } catch {}
  }, []);

  const watchAdAndEarn = useCallback(async (): Promise<boolean> => {
    const earned = await AdService.show();
    if (!earned) return false;

    // Credits are now added by AdMob SSV server callback.
    // Wait briefly for SSV to process, then sync balance from server.
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fetchBalance();
    return true;
  }, [fetchBalance]);

  const spendOnCrypto = useCallback(async (crypto: string): Promise<boolean> => {
    if (unlockedCoins.has(crypto)) return true;

    try {
      const data = await APIService.spendCredits(crypto);
      if (data.success) {
        setBalance(data.balance);
        await AsyncStorage.setItem(CREDITS_CACHE_KEY, String(data.balance));
        setUnlockedCoins(prev => new Set(prev).add(crypto));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [unlockedCoins]);

  const isCoinUnlocked = useCallback((crypto: string): boolean => {
    return unlockedCoins.has(crypto);
  }, [unlockedCoins]);

  const resetUnlocks = useCallback(() => {
    setUnlockedCoins(new Set());
  }, []);

  return (
    <CreditsContext.Provider
      value={{
        balance,
        isLoading,
        unlockedCoins,
        adReady,
        fetchBalance,
        watchAdAndEarn,
        spendOnCrypto,
        isCoinUnlocked,
        resetUnlocks,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
};
