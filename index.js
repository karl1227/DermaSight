/**
 * @format
 */

import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

// Installed builds from before the display-name update still request this key.
// Keep the alias so a Metro reload also works before a native rebuild.
if (appName !== 'SkinSense') {
  AppRegistry.registerComponent('SkinSense', () => App);
}
