import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import { Alert } from 'react-native';

const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  Alert.alert(
    'JS Crash Detected',
    `Fatal: ${isFatal}\n\nError: ${error.name}: ${error.message}`,
    [{ text: 'OK' }]
  );
  // We purposely do not call defaultErrorHandler to keep the app open and show the alert
});

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
