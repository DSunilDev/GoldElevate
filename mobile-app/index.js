// Import polyfills first
import './polyfills';

import { AppRegistry } from 'react-native';
import App from './App';

// Register the app component with name "main" (matches MainActivity.getMainComponentName())
AppRegistry.registerComponent('main', () => App);
