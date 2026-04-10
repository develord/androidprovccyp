// Google Analytics Service - Screen tracking + login events
import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  /**
   * Log screen view
   */
  async logScreenView(screenName: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenName,
      });
    } catch {}
  }

  /**
   * Log login event
   */
  async logLogin(method: 'google' | 'binance') {
    try {
      await analytics().logLogin({ method });
    } catch {}
  }

  /**
   * Log sign up (first time user)
   */
  async logSignUp(method: 'google' | 'binance') {
    try {
      await analytics().logSignUp({ method });
    } catch {}
  }

  /**
   * Log logout
   */
  async logLogout() {
    try {
      await analytics().logEvent('logout');
    } catch {}
  }

  /**
   * Set user ID for analytics
   */
  async setUserId(userId: string) {
    try {
      await analytics().setUserId(userId);
    } catch {}
  }

  /**
   * Clear user on logout
   */
  async clearUser() {
    try {
      await analytics().setUserId(null);
    } catch {}
  }
}

export default new AnalyticsService();
