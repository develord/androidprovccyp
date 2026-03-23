/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register background tasks for auto-trading
import './backgroundTasks';

AppRegistry.registerComponent(appName, () => App);
