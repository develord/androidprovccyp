// Auth Context - Global authentication state
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import AuthService from '../services/authService';
import SignalNotificationService from '../services/signalNotificationService';
import AnalyticsService from '../services/analyticsService';
import { User } from '../types';
import { BINANCE_OAUTH_CONFIG } from '../config/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithBinance: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signInWithGoogle: async () => {},
  signInWithBinance: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[Auth] Checking authentication...');
        const authenticated = await AuthService.isAuthenticated();
        console.log('[Auth] isAuthenticated:', authenticated);
        if (authenticated) {
          const storedUser = await AuthService.getStoredUser();
          console.log('[Auth] Stored user:', storedUser?.email || 'none');
          setUser(storedUser);
        }
      } catch (e) {
        console.log('[Auth] Check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Start/stop signal notifications based on auth state
  useEffect(() => {
    if (user) {
      SignalNotificationService.start();
    } else {
      SignalNotificationService.stop();
    }
    return () => SignalNotificationService.stop();
  }, [user]);

  // Listen for Binance OAuth deep link callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (event.url.startsWith(BINANCE_OAUTH_CONFIG.REDIRECT_URI)) {
        try {
          setIsLoading(true);
          const authData = await AuthService.handleBinanceCallback(event.url);
          setUser(authData.user);
        } catch (error) {
          console.error('Binance callback error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a deep link
    Linking.getInitialURL().then(url => {
      if (url && url.startsWith(BINANCE_OAUTH_CONFIG.REDIRECT_URI)) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const authData = await AuthService.signInWithGoogle();
      setUser(authData.user);
      AnalyticsService.logLogin('google');
      AnalyticsService.setUserId(String(authData.user.id));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithBinance = useCallback(async () => {
    await AuthService.signInWithBinance();
    // The actual auth completion happens in the deep link handler above
  }, []);

  const logout = useCallback(async () => {
    AnalyticsService.logLogout();
    AnalyticsService.clearUser();
    await AuthService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        signInWithGoogle,
        signInWithBinance,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
