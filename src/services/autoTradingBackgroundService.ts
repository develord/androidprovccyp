// Auto Trading Background Service - Native Module Wrapper
import { NativeModules } from 'react-native';

const { AutoTradingModule } = NativeModules;

class AutoTradingBackgroundService {
  // Start the background service (runs even when app is closed)
  startBackgroundService() {
    if (AutoTradingModule) {
      AutoTradingModule.startBackgroundService();
      console.log('[AutoTradingBackground] Background service started');
    } else {
      console.warn('[AutoTradingBackground] Native module not available');
    }
  }

  // Stop the background service
  stopBackgroundService() {
    if (AutoTradingModule) {
      AutoTradingModule.stopBackgroundService();
      console.log('[AutoTradingBackground] Background service stopped');
    } else {
      console.warn('[AutoTradingBackground] Native module not available');
    }
  }
}

export default new AutoTradingBackgroundService();
