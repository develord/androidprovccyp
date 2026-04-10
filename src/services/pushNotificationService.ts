// Push Notification Service — FCM registration + background message handling
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import apiService from './apiService';

const CHANNEL_ID = 'signal-alerts';

class PushNotificationService {
  private initialized = false;

  /**
   * Request permission, get FCM token, register with API.
   * Call this after user logs in.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure notification channel exists
    PushNotification.createChannel(
      {
        channelId: CHANNEL_ID,
        channelName: 'Signal Alerts',
        channelDescription: 'LONG/SHORT trading signal notifications',
        importance: 4,
        vibrate: true,
      },
      () => {},
    );

    // Request permission (required on iOS, auto-granted on Android 12-)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notification permission denied');
      return;
    }

    // Get FCM token and register with API
    try {
      const token = await messaging().getToken();
      if (token) {
        await apiService.registerFcmToken(token);
        console.log('FCM token registered');
      }
    } catch (err) {
      console.error('FCM token registration failed:', err);
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async newToken => {
      try {
        await apiService.registerFcmToken(newToken);
        console.log('FCM token refreshed and registered');
      } catch (err) {
        console.error('FCM token refresh registration failed:', err);
      }
    });

    // Foreground messages — show as local notification
    messaging().onMessage(async remoteMessage => {
      const { notification, data } = remoteMessage;
      if (notification) {
        PushNotification.localNotification({
          channelId: CHANNEL_ID,
          title: notification.title || 'Trading Signal',
          message: notification.body || '',
          bigText: notification.body || '',
          smallIcon: 'ic_notification',
          priority: 'high',
          importance: 'high',
          vibrate: true,
          vibration: 300,
          playSound: true,
          userInfo: data,
        });
      }
    });

    this.initialized = true;
  }
}

export default new PushNotificationService();
