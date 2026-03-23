// Background Tasks for Auto Trading
import { AppRegistry } from 'react-native';
import autoTradingService from './src/services/autoTradingService';
import tradeMonitoringService from './src/services/tradeMonitoringService';

// HeadlessJS Task: Check for trading opportunities every 15 minutes
const AutoTradingCheckTask = async (taskData) => {
  console.log('[HeadlessJS] AutoTradingCheck task started');

  try {
    // This will call the API, check conditions, and create trades if needed
    await autoTradingService.checkAndTrade();
    console.log('[HeadlessJS] AutoTradingCheck completed successfully');
  } catch (error) {
    console.error('[HeadlessJS] AutoTradingCheck error:', error);
  }
};

// HeadlessJS Task: Monitor active trades in real-time
const TradeMonitoringTask = async (taskData) => {
  console.log('[HeadlessJS] TradeMonitoring task started');

  try {
    // Start monitoring all open trades via WebSocket
    await tradeMonitoringService.startMonitoring();
    console.log('[HeadlessJS] TradeMonitoring started successfully');

    // Keep the task running (it will stop when no more trades to monitor)
    return new Promise((resolve) => {
      // The monitoring service will handle cleanup
      // This promise will resolve when monitoring stops
      setTimeout(() => {
        console.log('[HeadlessJS] TradeMonitoring task timeout');
        resolve();
      }, 60 * 60 * 1000); // 60 minutes max
    });
  } catch (error) {
    console.error('[HeadlessJS] TradeMonitoring error:', error);
  }
};

// Register HeadlessJS tasks
AppRegistry.registerHeadlessTask('AutoTradingCheck', () => AutoTradingCheckTask);
AppRegistry.registerHeadlessTask('TradeMonitoring', () => TradeMonitoringTask);

export { AutoTradingCheckTask, TradeMonitoringTask };
