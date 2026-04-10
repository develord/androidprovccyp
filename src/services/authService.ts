// Authentication Service - Google Sign-In + Binance OAuth2 + JWT
import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { jwtDecode } from 'jwt-decode';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Linking } from 'react-native';
import { API_CONFIG, GOOGLE_CONFIG, BINANCE_OAUTH_CONFIG } from '../config/api';
import { AuthResponse, User } from '../types';

const KEYCHAIN_SERVICE_ACCESS = 'cryptoadviser_access_token';
const KEYCHAIN_SERVICE_REFRESH = 'cryptoadviser_refresh_token';
const KEYCHAIN_SERVICE_USER = 'cryptoadviser_user';

// Configure Google Sign-In (deferred to avoid crash at import time)
try {
  GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
    offlineAccess: false,
  });
  console.log('[AuthService] Google Sign-In configured');
} catch (e) {
  console.error('[AuthService] Google Sign-In configure failed:', e);
}

// Axios instance for auth calls (no interceptors to avoid circular deps)
const authClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_CONFIG.API_KEY,
  },
});

class AuthService {
  /**
   * Sign in with Google - native dialog, sends id_token to server
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    await GoogleSignin.hasPlayServices();
    const signInResult = await GoogleSignin.signIn();
    const idToken = signInResult?.data?.idToken;

    if (!idToken) {
      throw new Error('Google Sign-In failed: no ID token');
    }

    const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH_GOOGLE, {
      id_token: idToken,
    });

    const authData: AuthResponse = response.data;
    await this.storeTokens(authData);
    return authData;
  }

  /**
   * Initiate Binance OAuth2 flow - opens browser
   */
  async signInWithBinance(): Promise<void> {
    const state = Math.random().toString(36).substring(2, 15);
    const url =
      `${BINANCE_OAUTH_CONFIG.AUTH_URL}?` +
      `response_type=code&` +
      `client_id=${BINANCE_OAUTH_CONFIG.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(BINANCE_OAUTH_CONFIG.REDIRECT_URI)}&` +
      `scope=${BINANCE_OAUTH_CONFIG.SCOPE}&` +
      `state=${state}`;

    await Linking.openURL(url);
  }

  /**
   * Handle Binance OAuth2 callback deep link
   */
  async handleBinanceCallback(url: string): Promise<AuthResponse> {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');

    if (!code) {
      throw new Error('Binance callback: no authorization code');
    }

    const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH_BINANCE, {
      code,
      redirect_uri: BINANCE_OAUTH_CONFIG.REDIRECT_URI,
    });

    const authData: AuthResponse = response.data;
    await this.storeTokens(authData);
    return authData;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) return null;

      const response = await authClient.post(API_CONFIG.ENDPOINTS.AUTH_REFRESH, {
        refresh_token: refreshToken,
      });

      const authData: AuthResponse = response.data;
      await this.storeTokens(authData);
      return authData.access_token;
    } catch {
      // Refresh failed - clear everything
      await this.clearTokens();
      return null;
    }
  }

  /**
   * Get a valid access token, auto-refreshing if needed
   */
  async getAccessToken(): Promise<string | null> {
    const token = await this.getStoredAccessToken();
    if (!token) return null;

    // Check if token expires within 5 minutes
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn < 5 * 60 * 1000) {
        return await this.refreshToken();
      }
    } catch {
      return await this.refreshToken();
    }

    return token;
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return token !== null;
  }

  /**
   * Get stored user info
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE_USER });
      if (credentials) {
        return JSON.parse(credentials.password);
      }
    } catch {}
    return null;
  }

  /**
   * Logout - clear all tokens and sign out from providers
   */
  async logout(): Promise<void> {
    try {
      const isGoogleSignedIn = await GoogleSignin.getCurrentUser();
      if (isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch {}

    await this.clearTokens();
  }

  // ---- Private storage methods ----

  private async storeTokens(authData: AuthResponse): Promise<void> {
    await Keychain.setGenericPassword('access', authData.access_token, {
      service: KEYCHAIN_SERVICE_ACCESS,
    });
    await Keychain.setGenericPassword('refresh', authData.refresh_token, {
      service: KEYCHAIN_SERVICE_REFRESH,
    });
    await Keychain.setGenericPassword('user', JSON.stringify(authData.user), {
      service: KEYCHAIN_SERVICE_USER,
    });
  }

  private async getStoredAccessToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE_ACCESS });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE_REFRESH });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  }

  private async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_ACCESS });
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_REFRESH });
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE_USER });
  }
}

export default new AuthService();
