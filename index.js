/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register background tasks for auto-trading
import './backgroundTasks';

// FCM background message handler — must be registered at entry point
import messaging from '@react-native-firebase/messaging';
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM background message:', remoteMessage);
  // Android auto-displays the notification from the "notification" payload
  // No extra handling needed — the system tray shows it automatically
});

AppRegistry.registerComponent(appName, () => App);
